const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('channels')
		.setDescription('Set appropriate discord channels.')
		.addStringOption(option =>
			option.setName('type')
				.setDescription('The type of channel.')
				.setRequired(true)
				.addChoices({ name:'Current', value:'current' },
					{ name:'U.GG', value:'ugg' },
					{ name:'OP.GG', value:'opgg' },
					{ name:'Lolalytics', value:'lol' },
					{ name:'League Of Graphs', value:'log' },
					{ name:'Bot Spam', value:'bot' },
					{ name:'General', value:'general' },
					{ name:'Suggestions', value:'suggestions' },
				))
		.addChannelOption(option =>
			option.setName('channel')
				.setDescription('The channel.')
				.setRequired(true)),
	async execute(interaction) {
		const channel = interaction.options.getChannel('channel');
		if (channel.type != 'GUILD_TEXT') {
			await interaction.reply({ content: 'Channel must be a text channel.', ephemeral: true });
			return;
		}
		const { db } = require('../src/database.js');

		db.cursor.prepare('INSERT OR REPLACE INTO channels VALUES(?, ?)').run(channel.id, interaction.options.getString('type'));

		await interaction.reply({ content: 'Successfully set channel.', ephemeral: true });
	},
};