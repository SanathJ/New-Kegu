const { Builder } = require('selenium-webdriver');
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

};