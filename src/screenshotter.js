const { Builder, until, By } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const service = new firefox.ServiceBuilder('./drivers/geckodriver.exe');

const { sleep } = require('./util.js');

let options;
let driver;


module.exports = {
	async init() {
		options = new firefox.Options();
		driver = await new Builder()
			.forBrowser('firefox')
			.setFirefoxService(service)
			.setFirefoxOptions(options)
			.build();
		await driver.manage().window().fullscreen();
	},
	async takeScreenshot(site) {
		let body;
		switch (site) {

		case 'opgg':
			await driver.get('https://na.op.gg/champions/kayle/top/trends');
			await driver.wait(until.elementLocated(By.className('info')), 30000, 'Timed out after 30 seconds', 1000);
			body = await driver.findElement(By.tagName('body'));
			break;

		case 'lol':
			await driver.get('https://lolalytics.com/lol/kayle/build/');
			await driver.wait(until.elementLocated(By.css('div[class^=\'ChampionStats\']')), 30000, 'Timed out after 30 seconds', 1000);
			body = await driver.findElement(By.tagName('body'));
			break;
		}

		// Wait 2 seconds
		await sleep(2000);

		// Captures the element screenshot
		return await body.takeScreenshot(true);
	},
	async shutdown() {
		await driver.quit();
	},
};

