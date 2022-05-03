const { db } = require('../src/database.js');

module.exports = {
	async execute(interaction) {
		const currentValue = interaction.options.getFocused();

		const links = db.statements.show_all.all();
		const responses = [{ name:'all', value:'all' }];
		responses.push(...(links.map(link => link.name)
			.filter(linkname => linkname.startsWith(currentValue))
			.slice(0, 19)
			.sort()
			.map(linkname => {
				return {
					name: linkname,
					value: linkname,
				};
			})));

		await interaction.respond(responses);
	},
};