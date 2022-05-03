const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');


const { db } = require('../src/database.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('link')
		.setDescription('Adjust stored links')
		.addSubcommand(subcommand =>
			subcommand.setName('add')
				.setDescription('Adds a link to database')
				.addStringOption(option =>
					option.setName('name')
						.setDescription('Name to refer to the link')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('link')
						.setDescription('The link')
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand.setName('remove')
				.setDescription('Removes a link from the database')
				.addStringOption(option =>
					option.setName('name')
						.setDescription('Name of the link')
						.setRequired(true))),
	async execute(interaction) {

		if(interaction.options.getSubcommand() == 'add') {
			await interaction.deferReply({ ephemeral: true });
			const link = interaction.options.getString('link');
			const name = interaction.options.getString('name');

			if (name == 'all') {
				await interaction.editReply('Link name cannot be `all`');
				return;
			}

			try {
				db.statements.link_add.run(name, link);
				await interaction.editReply('Added link to database');
				return;
			}
			catch (error) {
				if (error.code == 'SQLITE_CONSTRAINT_PRIMARYKEY') {
					const row = new MessageActionRow()
						.addComponents(
							new MessageButton()
								.setCustomId('yes')
								.setLabel('Yes')
								.setStyle('SUCCESS'),
							new MessageButton()
								.setCustomId('no')
								.setLabel('No')
								.setStyle('DANGER'));

					const sentMsg = await interaction.editReply({
						content: 'A link by this name already exists. Would you like to edit it?',
						components:[row],
						ephemeral:true,
					});
					const collector = sentMsg.createMessageComponentCollector({ componentType: 'BUTTON' });
					collector.on('collect', async (i) => {
						if(i.customId == 'yes') {
							db.statements.link_edit.run(link, name);
							await i.update({ content:'The link was edited', components: [] });
							collector.stop();
						}
						else {
							await i.update({ content:'The link was not edited', components: [] });
							collector.stop();
						}
					});
				}
				else {
					throw error;
				}
			}

		}
		else {
			await interaction.deferReply({ ephemeral: true });
			const name = interaction.options.getString('name');

			const result = db.statements.link_remove.run(name);

			if(result.changes !== 0) {
				await interaction.editReply('Deleted an entry');
			}
			else {
				await interaction.editReply('There was an error. Make sure a link with such a name exists');
			}
		}
	},
};