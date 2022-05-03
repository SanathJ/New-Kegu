const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { emotes } = require('../src/constants.js');
const { db } = require('../src/database.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('suggest')
		.setDescription('Publishes a suggestion')
		.addStringOption(option =>
			option.setName('suggestion')
				.setDescription('The suggestion to publish')
				.setRequired(true),
		),
	async execute(interaction) {
		await interaction.deferReply();
		const suggestion = interaction.options.getString('suggestion');
		const channel_id = db.statements.channel.get('suggestions').channel_id;

		const embed = new MessageEmbed()
			.setAuthor({
				name: interaction.user.tag,
				iconURL: interaction.user.displayAvatarURL(),
			})
			.setDescription(suggestion);

		const channel = await interaction.client.channels.fetch(channel_id);
		const sentMsg = await channel.send({ embeds: [embed] });

		await sentMsg.react(emotes.upvote);
		await sentMsg.react(emotes.downvote);

		await interaction.editReply('Success');
		await interaction.deleteReply();
	},
};