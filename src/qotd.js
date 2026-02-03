const Suggestions = require("../models/Suggestions");
const { EmbedBuilder } = require("discord.js");
const OpenAI = require("openai");

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY
});

function getQotdHistoryLimit() {
	const parsedLimit = Number.parseInt(
		process.env.QOTD_HISTORY_LIMIT ?? "",
		10
	);
	return Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 25;
}

async function generateQotd(previousQuestions = []) {
	const previousQuestionsPrompt =
		previousQuestions.length === 0
			? "No previous questions are available."
			: previousQuestions
					.map((question, index) => `${index + 1}. ${question}`)
					.join("\n");

	const completion = await openai.chat.completions.create({
		model: "gpt-5-mini",
		messages: [
			{
				role: "system",
				content:
					"You are a creative assistant that generates engaging 'Question of the Day' prompts for a Discord community. Generate fun, thought-provoking, and conversation-starting questions that are appropriate for all ages. Only respond with the question itself, no additional text. Avoid repeating or being too similar to previously asked questions. (The server mainly targets people around 18-27, most people are games and or anime fans.)"
			},
			{
				role: "user",
				content: `Generate a unique and interesting Question of the Day.\n\nPreviously asked questions:\n${previousQuestionsPrompt}`
			}
		],
		max_tokens: 150
	});

	return completion.choices[0].message.content.trim();
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
				const generatedQuestion = await generateQotd(previousQuestions);
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
			} catch (error) {
				console.error(
					"❌ - Failed to generate QOTD with OpenAI:",
					error
				);
			}
			return;
		}

		const embed = qotdEmbed(question.question, question.imageUrl);
		await client.channels.cache.get(process.env.QOTD_CHANNEL_ID).send({
			content: `<@&${process.env.QOTD_ROLE_ID}>`,
			embeds: [embed]
		});

		question.asked = true;
		await question.save();

		console.log("🔹  - qotdJob ran");
	}
};

function qotdEmbed(question, imageUrl) {
	return new EmbedBuilder()
		.setColor(0x0099ff)
		.setTitle("Question of the day!")
		.setImage(imageUrl)
		.setDescription(question)
		.setTimestamp();
}
