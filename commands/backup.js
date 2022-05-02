const { SlashCommandBuilder } = require('@discordjs/builders');

const { backup } = require('../src/database.js');
const fs = require('fs');
const { MessageAttachment } = require('discord.js');
const { ownerID } = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('backup')
		.setDescription('Takes a backup of database and DMs the file'),
	async execute(interaction, argsIgnore) {
		await backup();
		const file = new MessageAttachment(
			__dirname + '/../backup.db',
		);

		if(interaction === undefined) {
			const owner = await argsIgnore.users.fetch(ownerID);
			owner.send({ content:'Backup of the database:', files:[file] })
				.finally(() =>{
					fs.unlinkSync(__dirname + '/../backup.db');
				});
			return;
		}

		await interaction.deferReply({ ephemeral: true });
		interaction.user.send({ content:'Backup of the database:', files:[file] })
			.then(async () => {
				await interaction.editReply('I\'ve sent you a DM with the backup');
			})
			.catch(async error => {
				console.error(`Could not send DM to ${interaction.user.tag}.\n`, error);
				await interaction.editReply('It seems like I can\'t DM you! Do you have DMs disabled?');
			})
			.finally(async () =>{
				fs.unlinkSync(__dirname + '/../backup.db');

				await interaction.editReply('I\'ve sent you a DM with the backup');
			});
	},
};