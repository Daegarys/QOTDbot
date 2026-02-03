const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");
const { qotd } = require("../src/qotd");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("qotd")
		.setDescription("Make the bot ask a question of the day"),
	run: async ({ interaction, client }) => {
		try {
			if (!interaction.deferred && !interaction.replied) {
				await interaction.deferReply({ flags: 64 });
			}

			if (
				!interaction.member.permissions.has(
					PermissionsBitField.Flags.ManageMessages
				)
			) {
				await interaction.editReply({
					content: "You do not have permission to run this command!"
				});
				return;
			}

			const sent = await qotd(client);
			if (!sent) {
				await interaction.editReply({
					content: "QOTD failed to send. Check bot logs."
				});
				return;
			}

			console.log("QOTD command ran");
			await interaction.editReply({
				content: "Question of the day has been asked!"
			});
		} catch (error) {
			if (error?.code === 10062) {
				console.warn("QOTD interaction expired before reply (10062)");
				return;
			}

			console.error("Failed to run /qotd:", {
				message: error?.message,
				code: error?.code
			});

			if (!interaction.deferred && !interaction.replied) {
				await interaction
					.reply({
						content: "Something went wrong while running /qotd.",
						flags: 64
					})
					.catch(() => null);
				return;
			}

			await interaction
				.editReply({
					content: "Something went wrong while running /qotd."
				})
				.catch(() => null);
		}
	},
	devOnly: false
};
