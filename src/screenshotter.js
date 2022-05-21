const { Builder, until, By } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const { urls } = require('./constants.js');
const service = new firefox.ServiceBuilder('./drivers/geckodriver.exe');

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function init_driver() {
	const options = new firefox.Options();
	options.headless();
	const driver = await new Builder()
		.forBrowser('firefox')
		.setFirefoxService(service)
		.setFirefoxOptions(options)
		.build();
	await driver.manage().window().fullscreen();
	return driver;
}


module.exports = {
	async takeScreenshot(site) {
		const driver = await init_driver();
		let body;
		switch(site) {

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
		const ss = await body.takeScreenshot(true);

		await driver.quit();

		return ss;
	},
	async takePartialScreenshots(link, element, sleeptime, xpath = '.') {
		const driver = await init_driver();
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
		await driver.quit();
		return images;
	},
	async takeScreenshotByXpath(link, element, xpaths) {
		const driver = await init_driver();
		await driver.get(link);
		await driver.wait(until.elementLocated(By.css(element)), 30000, 'Timed out after 30 seconds', 1000);

		let ele = await driver.findElement(By.css(element));
		for(const xpath of xpaths) {
			ele = await ele.findElement(By.xpath(xpath));
		}

		const ss = await ele.takeScreenshot();

		await driver.quit();
		return ss;
	},
};

