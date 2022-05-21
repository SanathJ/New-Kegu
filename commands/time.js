const { Formatters } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

const { version } = require('../package.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('time')
		.setDescription('Prints server time and version'),
	async execute(interaction) {
		await interaction.reply({ content: Formatters.codeBlock(`Server Time: ${new Intl.DateTimeFormat(['en-US'], { dateStyle: 'long', timeStyle: 'long' }).format(new Date())}\nVersion: ${version}`), ephemeral: true });
	},
};