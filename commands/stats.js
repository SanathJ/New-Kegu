const { MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

const constants = require('../src/constants.js');
const datafetcher = require('../src/datafetcher.js');
const { db } = require('../src/database.js');
const { getPatch } = require('../src/postman.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stats')
		.setDescription('Display kayle stats')
		.addStringOption(option =>
			option.setName('site')
				.setDescription('The data site')
				.setRequired(true)
				.addChoices(
					{ name: 'U.GG', value: 'ugg' },
					{ name: 'OP.GG', value: 'opgg' },
					{ name: 'Lolalytics', value: 'lol' },
					{ name: 'League Of Graphs', value: 'log' },
				))
		.addStringOption(option =>
			option.setName('date')
				.setDescription('Date of stats (DD-MM-YYYY)')),
	async execute(interaction) {
		await interaction.deferReply();

		const date_string = interaction.options.getString('date');
		const site = interaction.options.getString('site');

		let row;
		if(date_string) {
			const arr = date_string.split('-');
			if(date_string.length != 10 || arr.length != 3) {
				return await interaction.editReply('That\'s not a valid date! The correct format is `DD-MM-YYYY`');
			}
			let reversed_date_string = arr[2] + '-' + arr[1] + '-' + arr[0];
			try {
				let chk = new Date(reversed_date_string).toISOString();
				chk = new Date(reversed_date_string);
				reversed_date_string = chk.getFullYear() + '-'
					+ ('0' + (chk.getMonth() + 1)).slice(-2) + '-'
					+ ('0' + chk.getDate()).slice(-2);
			}
			catch(err) {
				return interaction.editReply('That\'s not a valid date! The correct format is `DD-MM-YYYY`');
			}

			row = db.statements.data[site].get(reversed_date_string);

			if(!row) {
				await interaction.editReply('No data was found for ' + date_string + '!');
				return;
			}
		}
		else {
			const enabled = db.statements.feature_get.get(site)?.enabled;
			if(!enabled) {
				await interaction.editReply('Feature disabled');
				return;
			}

			const data = await (datafetcher[site]());
			const today = new Date();
			row = {
				Date: today.getFullYear() + '-'
					+ ('0' + (today.getMonth() + 1)).slice(-2) + '-'
					+ ('0' + today.getDate()).slice(-2),
				Patch: await getPatch(),
				Winrate: data.wr,
				Pickrate: data.pr,
				Banrate: data.br,
			};
		}

		const embedOptions = constants.embedOptions[site];

		const embed = new MessageEmbed()
			.setColor(embedOptions.color)
			.setTitle('Kayle Data')
			.setURL(embedOptions.url)
			.setImage(embedOptions.image)
			.addField('Date', row.Date, true)
			.addField('Patch', row.Patch, true)
			.addField('\u200b', '\u200b')
			.addField('Winrate', row.Winrate + '%', true)
			.addField('Pickrate', row.Pickrate + '%', true)
			.addField('Banrate', row.Banrate + '%', true);

		interaction.editReply({ embeds: [embed] })
			.then(msg => {
				if(msg.guild && msg.channel.id != db.statements.channel.get('bot').channel_id) {
					setTimeout(async () => {
						try {
							await interaction.deleteReply();
						}
						catch(error) {
							// ignore errors
						}
					}, 120000);
				}
			});
	},
};