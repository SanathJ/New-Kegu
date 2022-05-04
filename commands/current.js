const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const constants = require('../src/constants');
const { db } = require('../src/database');
const datafetcher = require('../src/datafetcher');
const { getPatch } = require('../src/postman');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('current')
		.setDescription('Refresh kayle stats from all sites in #current'),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral:true });

		for (const site of ['ugg', 'opgg', 'lol', 'log']) {
			const data = await (datafetcher[site]());
			const today = new Date();
			const row = {
				Date: today.getFullYear() + '-'
                + ('0' + (today.getMonth() + 1)).slice(-2) + '-'
                + ('0' + today.getDate()).slice(-2),
				Patch: await getPatch(),
				Winrate: data.wr,
				Pickrate: data.pr,
				Banrate: data.br,
			};

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

			// edit message if exists, else send
			const message_data = db.statements.message_get.get(site);
			if(message_data !== undefined) {
				try {
					const channel = await interaction.client.channels.fetch(message_data.channel_id);
					const message = await channel.messages.fetch(message_data.message_id);
					message.edit({ embeds:[embed] });
					continue;
				}
				catch (error) {
					// if message has been deleted, we send again, else throw error up
					if(error.message != 'Unknown Message') {
						throw error;
					}
				}
			}

			const channel = await interaction.client.channels.fetch(db.statements.channel.get('current').channel_id);
			const sent_message = await channel.send({ embeds:[embed] });
			db.statements.message_add.run(sent_message.id, sent_message.channelId, site);
		}
		await interaction.editReply('Refreshed data');
	},
};