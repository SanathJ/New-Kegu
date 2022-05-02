const fs = require('fs');

const { MessageAttachment, Formatters } = require('discord.js');
const fetch = require('node-fetch');

const imagegen = require('./imagegen.js');
const { urls } = require('./constants.js');


async function splitAndSendFiles(channel, files) {
	let arr = files.splice(0, 10);
	while(arr.length) {
		await channel.send({ files: arr });
		arr = files.splice(0, 10);
	}
}

module.exports = {
	async getPatch() {
		try {
			const response = await fetch(urls.patch);
			const data = await response.json();
			return data.patches.slice(-1)[0].name;
		}
		catch (error) {
			console.error(error);
		}
	},
	async sendDateAndPatch(interaction, channel_id, patch) {
		const channel = await interaction.client.channels.fetch(channel_id);

		await channel.send(Formatters.codeBlock(
			`${new Intl.DateTimeFormat(['en-US'], { dateStyle: 'medium' }).format(new Date())} - Patch ${patch}`),
		);

	},
	async lol(interaction, channel_id) {
		await imagegen.generate_lol_images();
		imagegen.cleanup();
		const files = fs.readdirSync('./images/')
			.filter(f => f.startsWith('lol'))
			.map(f => new MessageAttachment(
				__dirname + '/../images/' + f,
			));


		interaction.client.channels.fetch(channel_id).then(c => splitAndSendFiles(c, files));
	},
};