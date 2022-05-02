const fs = require('fs');
const Jimp = require('jimp');
const screenshotter = require('./screenshotter.js');
const util = require('node:util');

const grpc = require('grpc');
const PROTO_PATH = './protos/lol.proto';
const protoLoader = require('@grpc/proto-loader');

const { urls } = require('./constants.js');

// set up rpc
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {});
const recognizer = grpc.loadPackageDefinition(packageDefinition).Recognizer;
const rpc_client = new recognizer(
	'localhost:50051',
	grpc.credentials.createInsecure(),
);
const getResponse = util.promisify(rpc_client.GetResponse).bind(rpc_client);

module.exports = {

	async generate_lol_images() {
		const encodedString = await screenshotter.takeScreenshot('lol');
		fs.writeFileSync('./images/lol.png', encodedString, 'base64');

		let cnt = 2;
		let encodedStrings = await screenshotter.takePartialScreenshots(urls.lolalytics, 'div[class^=\'SimpleGraph_simple\']', 3000);
		await Promise.all(encodedStrings);
		for (const str of encodedStrings) {
			fs.writeFileSync(`./images/lol${cnt}.png`, str, 'base64');
			cnt++;
		}

		encodedStrings = await screenshotter.takePartialScreenshots(urls.lolalytics, 'div[class^=\'Graphs\']', 3000);
		await Promise.all(encodedStrings);
		for (const str of encodedStrings) {
			fs.writeFileSync(`./images/lol${cnt}.png`, str, 'base64');
			cnt++;
		}
		encodedStrings = await screenshotter.takePartialScreenshots(urls.lolalytics, 'div[class^=\'Depth_depth\']', 3000);
		await Promise.all(encodedStrings);
		for (const str of encodedStrings) {
			fs.writeFileSync(`./images/lol${cnt}.png`, str, 'base64');
			cnt++;
		}
		const filename = await getResponse({});
		fs.renameSync(filename.filename, 'images/lol1.png');
	},

	async generate_opgg_images() {
		let cnt = 1;
		let encodedStrings = await screenshotter.takePartialScreenshots(urls.opgg_trends, 'div[class^=\'recharts-responsive\']', 3000, './..');
		await Promise.all(encodedStrings);
		for (const str of encodedStrings) {
			fs.writeFileSync(`./images/opgg${cnt}.png`, str, 'base64');
			cnt++;
		}

		encodedStrings = await screenshotter.takePartialScreenshots(urls.opgg_champions, 'table[class^=\'positionRank\']', 3000, './..');
		await Promise.all(encodedStrings);
		for (const str of encodedStrings) {
			fs.writeFileSync(`./images/opgg${cnt}.png`, str, 'base64');
			cnt++;
		}

		// crop leaderboard image
		const image = await Jimp.read(`images/opgg${cnt - 1}.png`);
		image.crop(0, 0, image.bitmap.width, 728);
		image.write(`images/opgg${cnt - 1}.png`);
	},

	cleanup() {
		fs.readdirSync('./images/')
			.filter(f => f.startsWith('ROI'))
			.map(f => fs.unlinkSync('images/' + f));
		fs.unlinkSync('images/lol.png');
		fs.unlinkSync('images/lol6.png');
	},
};

