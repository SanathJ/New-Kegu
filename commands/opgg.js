const { SlashCommandBuilder } = require('@discordjs/builders');

const { opgg, sendDateAndPatch, getPatch } = require('../src/postman.js');
const { db } = require('../src/database.js');
const datafetcher = require('../src/datafetcher.js');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('opgg')
		.setDescription('Posts OP.GG data in #op-gg and updates patch data'),
	async execute(interaction) {
		// defer response as web interactions take a while
		await interaction.deferReply({ ephemeral: true });

		const opggChannelID = db.statements.channel.get('opgg').channel_id;

		// print date/patch
		const patch = await getPatch();
		sendDateAndPatch(interaction.client, opggChannelID, patch);

		// send images
		await opgg(interaction.client, opggChannelID);


		// update patch data
		// formats present date as YYYY-MM-DD
		const today = new Date();
		const date = today.getFullYear() + '-'
					+ ('0' + (today.getMonth() + 1)).slice(-2) + '-'
					+ ('0' + today.getDate()).slice(-2);
		const data = await datafetcher.opgg();
		db.statements.opgg.run(date, patch, data.wr, data.pr, data.br);

		// complete responding to command
		await interaction.editReply('Sent images successfully.');
	},
};