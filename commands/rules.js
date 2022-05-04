const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rules')
		.setDescription('Display rules or a specific rule')
		.addIntegerOption(option =>
			option.setName('rule')
				.setDescription('Rule number')),
	async execute(interaction) {
		const rule_number = interaction.options.getInteger('rule');

		const rules = [
			'#1.) Civility. We would ask for respectful exchanges between server members. We strive for a friendly, non-toxic environment. Treat others as you would like others to treat you.',
			'#2.) Swearing. You can do it, but if you sound like a sailor, you may be overdoing it.',
			'#3.) Do not spam. We want quality content over quantity.',
			'#4.) Negativity. We want to encourage communication, and excessive negativity doesn\'t do anything for anyone.',
			'#5.) Stereotyping and Labels. We look to learn and help grow with our community. This inhibits our mission.',
			'#6.) Channels. Contain things to the appropriate channels. Especially NSFW.',
			'#7.) Hot-button issues. This is a gaming server - Politics, religion and other hot-button issues are disallowed.',
			'#8.) Against Riot\'s TOS. Account selling/buying, boosting and anything else that breaks the Summoner’s code.',
			'#9.) Against Discord\'s TOS. https://discord.com/guidelines',
			'#10.) Dealing with rule breakers. If anyone starts topics that you do not think are appropriate to a gaming server, do not engage with that person -- just report it to the mod',
		];
		if (rule_number !== null) {
			if(rule_number > rules.length || rule_number < 1) {
				await interaction.reply({ content: 'No such rule', ephemeral: true });
				return;
			}
			await interaction.reply(`\`\`\`\nDiscord & Community Rules\n\n${rules[rule_number - 1]}\`\`\``);
		}
		else {
			await interaction.reply(`\`\`\`\nDiscord & Community Rules\n\n${rules.join('\n')}\`\`\``);
		}
	},
};