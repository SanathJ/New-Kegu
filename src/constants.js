const urls = {
	patch: 'https://cdn.merakianalytics.com/riot/lol/resources/patches.json',
	lolalytics: 'https://lolalytics.com/lol/kayle/build/',
	opgg_trends: 'https://na.op.gg/champions/kayle/top/trends/',
	opgg_champions: 'https://na.op.gg/champions',
	log: 'https://www.leagueofgraphs.com/champions/stats/kayle',
	game_versions: 'http://ddragon.leagueoflegends.com/api/versions.json',
	champion_data: 'https://ddragon.leagueoflegends.com/cdn/%s/data/%s/champion.json',
	ugg: 'https://u.gg/lol/champions/kayle/build?rank=',
};
const colors = {
	log: {
		bg: '#3a4556',
		divider:'#2d3848',
		green:'#2DEB90',
		red:'#ff5859',
		blue:'#2AA3CC',
		yellow: '#FDB05F',
	},
};
const embedOptions = {
	opgg: {
		image: 'https://cdn.discordapp.com/attachments/561116378090700811/711408499388579870/opgg.png',
		url: urls.opgg_trends,
		color: '#ff0000',
	},
	log: {
		image: 'https://cdn.discordapp.com/attachments/561116378090700811/711405113872482334/LoG.png',
		url: urls.log,
		color: '#5775a6',
	},
	lol: {
		image: 'https://cdn.discordapp.com/attachments/561116378090700811/711407080871034932/LoLalytics.png',
		url: urls.lolalytics,
		color: '#d5b240',
	},
	ugg: {
		image: 'https://cdn.discordapp.com/attachments/561116378090700811/711438714290831461/UGG.png',
		url: urls.ugg + 'platinum_plus',
		color: '#0060ff',
	},
};

const emotes = {
	upvote: '749195645658726481',
	downvote: '749195645902127224',
};

module.exports = {
	urls,
	colors,
	embedOptions,
	emotes,
};