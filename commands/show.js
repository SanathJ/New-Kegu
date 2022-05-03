const { SlashCommandBuilder } = require('@discordjs/builders');
const { db } = require('../src/database.js');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('show')
		.setDescription('Sends a link')
		.addStringOption(option =>
			option.setName('name')
				.setDescription('The name of the link or \'all\'')),
	async execute(interaction) {
		await interaction.deferReply();
		const name = interaction.options.getString('name');
		let data;
		if(!name || name.toLowerCase() == 'all') {
			data = db.statements.show_all.all();
		}
		else {
			data = [db.statements.show.get(name)];
		}

		if (data.length === 0 || data[0] === undefined) {
			await interaction.editReply('No such link exists.');
		}
		else {
			const text = [];
			for (const datum of data) {
				const entry = `**${datum.name}:** ${datum.link}`;
				text.push(entry);
			}
			const msg = await interaction.editReply(text.join('\n'));
			if (data.length > 1) {
				await msg.suppressEmbeds(true);
			}
		}
	},
};