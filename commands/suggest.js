const { MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

const { db } = require('../src/database.js');
const { emotes } = require('../src/constants.js');

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
		const sent_message = await channel.send({ embeds: [embed] });

		await sent_message.react(emotes.upvote);
		await sent_message.react(emotes.downvote);

		await interaction.editReply('Success');
		await interaction.deleteReply();
	},
};