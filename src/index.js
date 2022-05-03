const fs = require('fs');

const screenshotter = require('./screenshotter.js');
const datafetcher = require('./datafetcher.js');
const database = require('./database.js');

const { Client, Collection, Intents } = require('discord.js');

const { token } = require('../config.json');

(async function toplevel() {
	// set up screenshotter and fetcher
	await screenshotter.init();
	await datafetcher.init();

	// set up required directories
	if (!fs.existsSync('./images')) {
		fs.mkdirSync('./images');
	}

	const flags = Intents.FLAGS;
	const discord_client = new Client({
		intents: [
			flags.GUILDS,
			flags.GUILD_MESSAGES,
			flags.GUILD_MESSAGE_REACTIONS,
			flags.DIRECT_MESSAGES,
			flags.GUILD_EMOJIS_AND_STICKERS,
		],
		partials: [
			'CHANNEL',
		],
		allowedMentions: {
			parse: ['users', 'everyone'],
		},
	});


	// command handler
	discord_client.commands = new Collection();
	const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const command = require(`../commands/${file}`);
		discord_client.commands.set(command.data.name, command);
	}

	// autocomplete handler
	discord_client.autocompletes = new Collection();
	const autocompleteFiles = fs.readdirSync('./autocompletes').filter(file => file.endsWith('.js'));
	for (const file of autocompleteFiles) {
		const autocomplete = require(`../autocompletes/${file}`);
		discord_client.autocompletes.set(file.slice(0, -3), autocomplete);
	}

	// event handler
	const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
	for (const file of eventFiles) {
		const event = require(`../events/${file}`);
		if (event.once) {
			discord_client.once(event.name, (...args) => event.execute(...args));
		}
		else {
			discord_client.on(event.name, (...args) => event.execute(...args));
		}
	}

	discord_client.login(token);
})();

process.on('beforeExit', () => {
	screenshotter.shutdown();
	datafetcher.shutdown();
	database.close();
});