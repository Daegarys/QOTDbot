const {
	SlashCommandBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	PermissionFlagsBits,
	EmbedBuilder
} = require("discord.js");
const { qotd } = require("../src/qotd");
const { PermissionsBitField } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("qotd")
		.setDescription("Make the bot ask a question of the day"),
	run: async ({ interaction, client, handler }) => {
		if (
			!interaction.member.permissions.has(
				PermissionsBitField.Flags.ManageMessages
			)
		)
			return interaction.reply({
				content: `You do not have permission to run this command!`,
				flags: 64
			});

		await interaction.deferReply({ flags: 64 });

		await qotd(client);
		console.log("🔹  - qotd command ran");

		await interaction.editReply({
			content: `Question of the day has been asked!`
		});
	},
	devOnly: false
};
