const { SlashCommandBuilder } = require('@discordjs/builders');

const { ugg, sendDateAndPatch, getPatch } = require('../src/postman.js');
const { db } = require('../src/database.js');
const datafetcher = require('../src/datafetcher.js');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('ugg')
		.setDescription('Posts U.GG data in #u-gg and updates patch data'),
	async execute(interaction) {
		// defer response as web interactions take a while
		await interaction.deferReply({ ephemeral: true });

		const uggChannelID = db.statements.channel.get('ugg').channel_id;

		// print date/patch
		const patch = await getPatch();
		sendDateAndPatch(interaction, uggChannelID, patch);

		// send images
		await ugg(interaction, uggChannelID);


		// update patch data
		// formats present date as YYYY-MM-DD
		const today = new Date();
		const date = today.getFullYear() + '-'
					+ ('0' + (today.getMonth() + 1)).slice(-2) + '-'
					+ ('0' + today.getDate()).slice(-2);
		const data = await datafetcher.ugg('platinum_plus');
		db.statements.ugg.run(date, patch, data.wr, data.pr, data.br);

		// complete responding to command
		await interaction.editReply('Sent images successfully.');
	},
};