const backup = require('../commands/backup');

module.exports = {
	async execute(client) {
		await backup.execute(undefined, client);
	},
	// every wednesday
	cronstring: '0 0 0 * * 3',
};