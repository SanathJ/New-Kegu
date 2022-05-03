const fetch = require('node-fetch');
const { Builder, By, until } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const { urls } = require('./constants');
const service = new firefox.ServiceBuilder('./drivers/geckodriver.exe');

const { format } = require('util');

const { JSDOM } = require('jsdom');

let driver;

function findVal(obj, keyToFind) {
	if (obj[keyToFind]) return obj[keyToFind];

	for (const key in obj) {
		if (typeof obj[key] === 'object') {
			const value = findVal(obj[key], keyToFind);
			if (value) return value;
		}
	}
	return false;
}

const championJson = {};

async function getLatestChampionDDragon(language = 'en_US') {
	if (championJson[language]) {
		return championJson[language].data;
	}

	let response;
	let versionIndex = 0;
	// I loop over versions because 9.22.1 is broken
	do {
		const data = await (await fetch(urls.game_versions)).json();
		const version = data[versionIndex++];

		try {
			response = await fetch(format(urls.champion_data, version, language), {});
			break;
		}
		catch {
			console.log('ddragon doesn\'t have data, trying another patch');
		}
	} while(!response);

	championJson[language] = await response.json();
	return championJson[language].data;
}

// NOTE: IN DDRAGON THE ID IS THE CLEAN NAME!!! It's also super-inconsistent, and broken at times.
// Cho'gath => Chogath, Wukong => Monkeyking, Fiddlesticks => Fiddlesticks/FiddleSticks (depending on what mood DDragon is in this patch)
async function getChampionByID(name, language = 'en_US') {
	return (await getLatestChampionDDragon(language))[name];
}

module.exports = {
	async init() {
		const options = new firefox.Options();
		options.headless();
		driver = await new Builder()
			.forBrowser('firefox')
			.setFirefoxService(service)
			.setFirefoxOptions(options)
			.build();
		await driver.manage().window().fullscreen();
	},
	async lol() {
		await driver.get(urls.lolalytics);
		const result = await driver.executeScript('return precache');
		return findVal(result, 'header');
	},
	async opgg() {
		const element = 'div[class^=\'recharts-responsive\']';
		await driver.get(urls.opgg_trends);
		await driver.wait(until.elementLocated(By.css(element)), 30000, 'Timed out after 30 seconds', 1000);

		await (await driver.findElement(By.css(element))).click();
		await driver.actions().move({ x: 5, y: 5 }).pause(1000).perform();

		let ele = await driver.findElements(By.css(element));

		ele = await Promise.all(ele.map(async e => {
			e = await e.findElement(By.xpath('./../div/div'));
			return await e.getText();
		}));

		ele = ele.flatMap(e => e.split('\n'));

		ele = ele.filter(e => {
			return e.endsWith('%');
		});
		ele = ele.map(e => parseFloat(e.slice(0, -1)));

		const data = {};
		data.wr = ele[0];
		data.pr = ele[1];
		data.br = ele[2];

		return data;
	},
	async ugg(tier) {
		const dom = await JSDOM.fromURL(urls.ugg + tier, {});
		const arr = {};

		const positions = ['jungle', 'supp', 'adc', 'top', 'mid'];
		const champId = (await getChampionByID('Kayle')).key;

		// figure out popular position
		let rgx = RegExp('"' + champId + '" *: *\[[0-5 ,]+]');
		const preferred = JSON.parse('{' + dom.serialize().match(rgx).toString() + '}');
		const pos = positions[preferred[champId.toString()][0] - 1];

		rgx = RegExp('world_' + tier + '_' + pos + '": *{[\n "a-zA-Z0-9:,_.]*?"counters":');

		let fullJson;

		try {
			fullJson = JSON.parse(dom.serialize().match(rgx).toString().replace(/, *"counters" *: */, '}')
				.replace(RegExp('world_' + tier + '_' + pos + '": *'), ''));
		}
		catch {
			return;
		}

		arr.wr = parseFloat(fullJson.win_rate);
		arr.rank = `${fullJson.rank !== null ? fullJson.rank : '?'} / ${fullJson.total_rank !== null ? fullJson.total_rank : '?'}`;
		arr.pr = parseFloat(fullJson.pick_rate);
		arr.br = parseFloat(fullJson.ban_rate);
		arr.matches = new Intl.NumberFormat('en-US').format(fullJson.matches);

		return arr;
	},
	async log() {
		const data = {};
		const dom = await JSDOM.fromURL(urls.log, {});

		// champ data
		const labelArr = ['Popularity', 'Win Rate', 'Ban Rate', 'Mained By'];
		for(let i = 0; i < 4; i++) {
			data[labelArr[i]] = Number((dom.window.document.getElementById('graphDD' + (i + 1)).innerHTML).trim().replace('%', ''));
		}

		// data about role popularity and win rate
		data.roles = [];
		const coll = dom.window.document.getElementsByTagName('progressbar');
		for(let i = 0; i < coll.length / 2; i++) {
			data.roles[i] = {};
			data.roles[i].popularity = coll[2 * i].getAttribute('data-value') * 100;
			data.roles[i].winrate = coll[2 * i + 1].getAttribute('data-value') * 100;
		}
		const rowColl = dom.window.document.getElementsByClassName('sortable_table')[0]
			.getElementsByTagName('tbody')[0]
			.getElementsByTagName('tr');

		for(let i = 1; i < rowColl.length; i++) {
			data.roles[i - 1].position = rowColl[i].getElementsByTagName('td')[0].getElementsByTagName('a')[0].textContent.trim();
		}

		// Damage Dealt
		data.damage_distribution = [];
		const bars = dom.window.document.getElementsByClassName('stacked_bar')[0]
			.getElementsByClassName('stacked_bar_area');
		for(const i of bars) {
			data.damage_distribution.push(parseFloat(i.getAttribute('tooltip')));
		}

		// Misc Stats
		data.misc = {
			kda: {},
			penta: {},
			gold: {},
			minions: {},
			wards: {},
			damage: {},
			multiKills: {
				quadra: {},
				triple: {},
				double: {},
			},
		};
		data.misc.kda.kills = dom.window.document.getElementsByClassName('kills')[0].innerHTML;
		data.misc.kda.deaths = dom.window.document.getElementsByClassName('deaths')[0].innerHTML;
		data.misc.kda.assists = dom.window.document.getElementsByClassName('assists')[0].innerHTML;

		const labels = ['penta', 'gold', 'minions', 'wards', 'damage'];
		for(let i = 2; i < dom.window.document.getElementsByClassName('number').length; i++) {
			data.misc[labels[i - 2]].value = dom.window.document.getElementsByClassName('number')[i].innerHTML.trim();
		}
		const smallLabels = ['quadra', 'triple', 'double'];
		for(let i = 1; i < dom.window.document.getElementsByClassName('number-small').length; i++) {
			data.misc.multiKills[smallLabels[i - 1]].value = parseFloat(dom.window.document.getElementsByClassName('number-small')[i].textContent).toFixed(4);
		}
		for(let i = 0; i < dom.window.document.getElementsByClassName('number-legend-small').length; i++) {
			data.misc.multiKills[smallLabels[i]].rank = dom.window.document.getElementsByClassName('number-legend-small')[i].innerHTML.trim();
		}


		// data for graphs
		const rgx = /data: \[\[.+]]/g;
		const matches = dom.serialize().match(rgx);

		const graph_data_labels = [
			'popularity_history', 'winrate_history', 'banrate_history',
			'gold', 'minions', 'kills_and_assists', 'deaths',
			'winrate_duration', 'winrate_games',
		];
		for(let i = 0; i < 9; i++) {
			data[graph_data_labels[i]] = JSON.parse(('{' + matches[i] + '}').replace('data', '"data"')).data;
		}

		return data;
	},

};