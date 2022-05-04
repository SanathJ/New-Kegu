const current = require('../commands/current');

module.exports = {
	async execute(client) {
		await current.current(client);
	},
	// everyday
	cronstring: '0 30 23 * * *',
};