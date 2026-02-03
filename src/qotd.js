const Suggestions = require("../models/Suggestions");
const { EmbedBuilder } = require("discord.js");
const OpenAI = require("openai");

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY
});

function getOpenAiModel() {
	const model = process.env.OPENAI_MODEL?.trim();
	return model ? model : "gpt-5-mini";
}

function getQotdHistoryLimit() {
	const parsedLimit = Number.parseInt(
		process.env.QOTD_HISTORY_LIMIT ?? "",
		10
	);
	return Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 25;
}

async function generateQotd(previousQuestions = [], model) {
	const previousQuestionsPrompt =
		previousQuestions.length === 0
			? "No previous questions are available."
			: previousQuestions
					.map((question, index) => `${index + 1}. ${question}`)
					.join("\n");

	const response = await openai.responses.create({
		model,
		reasoning: {
			effort: "minimal"
		},
		text: {
			verbosity: "low"
		},
		instructions:
			"You are a creative assistant that generates engaging 'Question of the Day' prompts for a Discord community. Generate fun, thought-provoking, and conversation-starting questions that are appropriate for all ages. Only respond with the question itself, no additional text. Avoid repeating or being too similar to previously asked questions. (The server mainly targets people around 18-27, most people are games and or anime fans.)",
		input: `Generate a unique and interesting Question of the Day.\n\nPreviously asked questions:\n${previousQuestionsPrompt}`,
		max_output_tokens: 300
	});

	const structuredText = Array.isArray(response?.output)
		? response.output
				.flatMap((item) => item?.content ?? [])
				.filter((item) => item?.type === "output_text")
				.map((item) => item?.text ?? "")
				.join("\n")
		: "";
	const questionText = String(response?.output_text ?? structuredText).trim();

	if (!questionText) {
		const status = response?.status ?? "unknown";
		const incomplete = JSON.stringify(response?.incomplete_details ?? null);
		const outputTypes = Array.isArray(response?.output)
			? response.output.map((item) => item?.type).join(", ")
			: "none";
		throw new Error(
			`OpenAI returned an empty QOTD response. status=${status} incomplete=${incomplete} output_types=${outputTypes}`
		);
	}

	return questionText;
}

async function getPreviouslyAskedQuestions(limit = 25) {
	const askedQuestions = await Suggestions.find(
		{ asked: true },
		{ question: 1, _id: 0 }
	)
		.sort({ _id: -1 })
		.limit(limit)
		.lean();

	return askedQuestions
		.map((questionDoc) => questionDoc.question)
		.filter(Boolean);
}

module.exports = {
	qotd: async (client) => {
		const count = await Suggestions.countDocuments(
			{ approved: true, asked: false },
			{}
		);
		var random = Math.floor(Math.random() * count);

		const question = await Suggestions.findOne({
			approved: true,
			asked: false
		}).skip(random);

		if (question === undefined || question === null) {
			console.log("🤖 - No qotd in db, generating with OpenAI...");
			try {
				const historyLimit = getQotdHistoryLimit();
				const previousQuestions =
					await getPreviouslyAskedQuestions(historyLimit);
				const model = getOpenAiModel();
				console.log(`🤖 - OpenAI model in use: ${model}`);
				const generatedQuestion = await generateQotd(
					previousQuestions,
					model
				);
				console.log(
					`🤖 - Generated QOTD length: ${generatedQuestion.length}`
				);
				const embed = qotdEmbed(generatedQuestion, null);
				const message = await client.channels.cache
					.get(process.env.QOTD_CHANNEL_ID)
					.send({
						content: `<@&${process.env.QOTD_ROLE_ID}>`,
						embeds: [embed]
					});

				await Suggestions.create({
					question: generatedQuestion,
					approved: true,
					messageId: message.id,
					asked: true,
					imageUrl: null
				});

				console.log("✅ - AI-generated QOTD sent successfully");
				return true;
			} catch (error) {
				console.error("❌ - Failed to generate QOTD with OpenAI:", {
					message: error?.message,
					type: error?.type,
					code: error?.code,
					param: error?.param,
					requestID: error?.requestID,
					details: Array.isArray(error?.errors)
						? error.errors.map((item) => item?.message ?? String(item))
						: undefined
				});
				return false;
			}
		}

		const embed = qotdEmbed(question.question, question.imageUrl);
		await client.channels.cache.get(process.env.QOTD_CHANNEL_ID).send({
			content: `<@&${process.env.QOTD_ROLE_ID}>`,
			embeds: [embed]
		});

		question.asked = true;
		await question.save();

		console.log("🔹  - qotdJob ran");
		return true;
	}
};

function qotdEmbed(question, imageUrl) {
	const embed = new EmbedBuilder()
		.setColor(0x0099ff)
		.setTitle("Question of the day!")
		.setDescription(question)
		.setTimestamp();

	if (imageUrl) {
		embed.setImage(imageUrl);
	}

	return embed;
}
