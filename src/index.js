const fs = require('fs');

const screenshotter = require('./screenshotter.js');

const { Client, Collection, Intents } = require('discord.js');

const { token } = require('../config.json');

(async function toplevel() {
	// set up screenshotter
	await screenshotter.init();

	// set up required directories
	if (!fs.existsSync('./images')) {
		fs.mkdirSync('./images');
	}

	const discord_client = new Client({
		intents: [Intents.FLAGS.GUILDS],
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

process.on('beforeExit', screenshotter.shutdown);