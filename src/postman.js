const fs = require('fs');

const { MessageAttachment, Formatters } = require('discord.js');
const fetch = require('node-fetch');

const imagegen = require('./imagegen.js');
const { urls } = require('./constants.js');
const datafetcher = require('./datafetcher.js');


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
	async sendDateAndPatch(client, channel_id, patch) {
		const channel = await client.channels.fetch(channel_id);

		await channel.send(Formatters.codeBlock(
			`${new Intl.DateTimeFormat(['en-US'], { dateStyle: 'medium' }).format(new Date())} - Patch ${patch}`),
		);

	},
	async lol(client, channel_id) {
		await imagegen.generate_lol_images();
		imagegen.cleanup();
		const files = fs.readdirSync('./images/')
			.filter(f => f.startsWith('lol'))
			.map(f => new MessageAttachment(
				__dirname + '/../images/' + f,
			));

		client.channels.fetch(channel_id).then(c => splitAndSendFiles(c, files));
	},
	async opgg(client, channel_id) {
		const titles = [
			'Top Kayle Win Rate',
			'Top Kayle Pick Rate',
			'Kayle Ban Rate',
			'Kayle Win Rate by Game Length',
			'Leaderboard',
		];
		await imagegen.generate_opgg_images();
		const files = fs.readdirSync('./images/')
			.filter(f => f.startsWith('opgg'))
			.map(f => new MessageAttachment(
				__dirname + '/../images/' + f,
			));

		const zip = (a, b) => a.map((k, i) => [k, b[i]]);
		const channel = await client.channels.fetch(channel_id);

		for (const pair of zip(titles, files)) {
			await channel.send({ content: pair[0], files: [pair[1]] });
		}
	},
	async ugg(client, channel_id) {
		const titles = [
			'Platinum',
			'Platinum+',
			'Diamond',
			'Diamond+',
			'Diamond 2+',
			'Master',
			'Master+',
			'Grandmaster',
			'Challenger',
			'Overall',
		];

		await imagegen.generate_ugg_images();
		const files = fs.readdirSync('./images/')
			.filter(f => f.startsWith('ugg'))
			.map(f => new MessageAttachment(
				__dirname + '/../images/' + f,
			));

		const zip = (a, b) => a.map((k, i) => [k, b[i]]);
		const channel = await client.channels.fetch(channel_id);

		for (const pair of zip(titles, files)) {
			await channel.send({ content: pair[0], files: [pair[1]] });
		}
	},
	async log(client, channel_id, data) {
		if (data === undefined) {
			data = await datafetcher.log();
		}

		await imagegen.generate_log_images(data);
		const files = fs.readdirSync('./images/')
			.filter(f => f.startsWith('log'))
			.sort((a, b) => {
				return parseInt(a.slice(3, -4)) - parseInt(b.slice(3, -4));
			})
			.map(f => new MessageAttachment(
				__dirname + '/../images/' + f,
			));

		client.channels.fetch(channel_id).then(c => splitAndSendFiles(c, files));
	},
};