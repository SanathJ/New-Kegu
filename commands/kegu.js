const { SlashCommandBuilder } = require('@discordjs/builders');

const datafetcher = require('../src/datafetcher.js');
const postman = require('../src/postman.js');
const { db } = require('../src/database.js');

async function kegu(client) {
	const patch = await postman.getPatch();
	// update patch data
	// formats present date as YYYY-MM-DD
	const today = new Date();
	const date = today.getFullYear() + '-'
		+ ('0' + (today.getMonth() + 1)).slice(-2) + '-'
		+ ('0' + today.getDate()).slice(-2);

	await Promise.all(['ugg', 'opgg', 'lol', 'log'].map(async (site) => {
		const enabled = db.statements.feature_get.get(site)?.enabled;
		if(!enabled) {
			return;
		}

		const channel_id = db.statements.channel.get(site).channel_id;

		// print date/patch
		await postman.sendDateAndPatch(client, channel_id, patch);

		// send images
		await postman[site](client, channel_id);

		const data = await datafetcher[site]();
		db.statements[site].run(date, patch, data.wr, data.pr, data.br);
	}));
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('kegu')
		.setDescription('Send images from all data sites'),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });

		await kegu(interaction.client);

		await interaction.editReply('Sent images');
	},
	kegu,
};