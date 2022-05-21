const { SlashCommandBuilder } = require('@discordjs/builders');

const { log, sendDateAndPatch, getPatch } = require('../src/postman.js');
const { db } = require('../src/database.js');
const datafetcher = require('../src/datafetcher.js');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('log')
		.setDescription('Posts League Of Graphs data in #league-of-graphs and updates patch data'),
	async execute(interaction) {
		const enabled = db.statements.feature_get.get('log')?.enabled;
		if(!enabled) {
			await interaction.reply({ content: 'Feature disabled', ephemeral: true });
			return;
		}

		// defer response as web interactions take a while
		await interaction.deferReply({ ephemeral: true });

		const channel_id = db.statements.channel.get('log').channel_id;

		// print date/patch
		const patch = await getPatch();
		await sendDateAndPatch(interaction.client, channel_id, patch);

		// send images
		const data = await datafetcher.log();
		await log(interaction.client, channel_id, data);


		// update patch data
		// formats present date as YYYY-MM-DD
		const today = new Date();
		const date = today.getFullYear() + '-'
					+ ('0' + (today.getMonth() + 1)).slice(-2) + '-'
					+ ('0' + today.getDate()).slice(-2);
		db.statements.log.run(date, patch, data.wr, data.pr, data.br);

		// complete responding to command
		await interaction.editReply('Sent images successfully');
	},
};