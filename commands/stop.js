const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stop')
		.setDescription('Stops bot'),
	async execute(interaction) {
		await interaction.reply({ content: 'Shut down.', ephemeral: true });
		process.exit(0);
	},
};