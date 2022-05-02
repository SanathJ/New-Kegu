const { Builder, By, until } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const { urls } = require('./constants');
const service = new firefox.ServiceBuilder('./drivers/geckodriver.exe');

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

};