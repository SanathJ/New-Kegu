const kegu = require('../commands/kegu');

module.exports = {
	async execute(client) {
		await kegu.kegu(client);
	},
	// everyday
	cronstring: '0 30 23 * * *',
};