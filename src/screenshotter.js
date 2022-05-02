const { Builder, until, By } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const { urls } = require('./constants.js');
const service = new firefox.ServiceBuilder('./drivers/geckodriver.exe');

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

let driver;


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
	async takeScreenshot(site) {
		await driver.switchTo().newWindow('tab');
		let body;
		switch (site) {

		case 'opgg':
			await driver.get(urls.opgg_trends);
			await driver.wait(until.elementLocated(By.className('info')), 30000, 'Timed out after 30 seconds', 1000);
			body = await driver.findElement(By.tagName('body'));
			break;

		case 'lol':
			await driver.get(urls.lolalytics);
			await driver.wait(until.elementLocated(By.css('div[class^=\'ChampionStats\']')), 30000, 'Timed out after 30 seconds', 1000);
			body = await driver.findElement(By.tagName('body'));
			break;
		}

		// Wait 2 seconds
		await sleep(2000);

		// Captures the element screenshot
		return await body.takeScreenshot(true);
	},
	async takePartialScreenshots(link, element, sleeptime, xpath = '.') {
		await driver.switchTo().newWindow('tab');
		await driver.get(link);
		await driver.wait(until.elementLocated(By.css(element)), 30000, 'Timed out after 30 seconds', 1000);

		await (await driver.findElement(By.css(element))).click();
		await sleep(sleeptime);
		await driver.actions().move({ x: 5, y: 5 }).pause(1000).perform();

		const ele = await driver.findElements(By.css(element));

		const images = [];
		for(let e of ele) {
			e = await e.findElement(By.xpath(xpath));
			images.push(await e.takeScreenshot(true));
		}
		return images;


	},
	async shutdown() {
		await driver.quit();
	},
};

