const { SlashCommandBuilder } = require('@discordjs/builders');

const datafetcher = require('../src/datafetcher.js');
const { db } = require('../src/database.js');
const { getPatch, lol, sendDateAndPatch } = require('../src/postman.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lol')
		.setDescription('Posts Lolalytics data in #lolalytics and updates patch data'),
	async execute(interaction) {
		const enabled = db.statements.feature_get.get('lol')?.enabled;
		if(!enabled) {
			await interaction.reply({ content: 'Feature disabled', ephemeral: true });
			return;
		}

		// defer response as web interactions take a while
		await interaction.deferReply({ ephemeral: true });

		const channel_id = db.statements.channel.get('lol').channel_id;

		// print date/patch
		const patch = await getPatch();
		await sendDateAndPatch(interaction.client, channel_id, patch);

		// send images
		await lol(interaction.client, channel_id);


		// update patch data
		// formats present date as YYYY-MM-DD
		const today = new Date();
		const date = today.getFullYear() + '-'
			+ ('0' + (today.getMonth() + 1)).slice(-2) + '-'
			+ ('0' + today.getDate()).slice(-2);
		const data = await datafetcher.lol();
		db.statements.lol.run(date, patch, data.wr, data.pr, data.br);

		// complete responding to command
		await interaction.editReply('Sent images successfully');
	},
};