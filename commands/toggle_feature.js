const { SlashCommandBuilder } = require('@discordjs/builders');

const { db } = require('../src/database.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('toggle_feature')
		.setDescription('Toggles a bot feature on/off')
		.addStringOption(option =>
			option.setName('feature')
				.setDescription('The bot feature')
				.setRequired(true)
				.addChoices(
					{ name:'U.GG', value:'ugg' },
					{ name:'OP.GG', value:'opgg' },
					{ name:'Lolalytics', value:'lol' },
					{ name:'League Of Graphs', value:'log' },
				)),
	async execute(interaction) {
		const feature = interaction.options.getString('feature');

		const enabled = db.statements.feature_get.get(feature)?.enabled;
		db.statements.feature_set.run(feature, !enabled ? 1 : 0);

		await interaction.reply({ content: `Feature toggled ${!enabled ? 'on' : 'off'}`, ephemeral: true });
	},
};