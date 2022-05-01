const fs = require('fs');

const CronJob = require('cron').CronJob;

const database = require('../src/database.js');

module.exports = {
	name: 'ready',
	once: true,
	async execute(client) {
		// sets up timers
		const timerFiles = fs.readdirSync('./timers').filter(file => file.endsWith('.js'));
		for (const file of timerFiles) {
			const { execute, cronstring } = require(`../timers/${file}`);
			const job = new CronJob(cronstring, async function() {
				execute(client);
			});
			job.start();
		}
		console.log(`Logged in as ${client.user.tag}`);
		await database.init();
	},
};