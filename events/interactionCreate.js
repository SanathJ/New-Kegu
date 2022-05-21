const { DiscordAPIError } = require('discord.js');

module.exports = {
	name: 'interactionCreate',
	async execute(interaction) {
		// we only serve two interactions
		if(!interaction.isCommand() && !interaction.isAutocomplete()) return;

		// autocomplete handling
		if(interaction.isAutocomplete()) {
			const autocomplete = interaction.client.autocompletes.get(interaction.commandName);
			try {
				await autocomplete.execute(interaction);
			}
			catch(error) {
				console.error(error);
			}
			return;
		}

		// command handling
		const command = interaction.client.commands.get(interaction.commandName);

		if(!command) return;

		try {
			await command.execute(interaction);
		}
		catch(error) {
			console.error(error);
			if(!(error instanceof DiscordAPIError)) {
				await interaction.reply({
					content: `An error occurred while executing command '${interaction.commandName}'`,
					ephemeral: true,
				});
			}
		}
	},
};