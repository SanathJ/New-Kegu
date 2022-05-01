const fs = require('fs');
const util = require('node:util');

const Jimp = require('jimp');

const grpc = require('grpc');
const PROTO_PATH = './protos/lol.proto';
const protoLoader = require('@grpc/proto-loader');

const screenshotter = require('./screenshotter.js');

let getResponse;

async function generate_lol_images() {
	const encodedString = await screenshotter.takeScreenshot('lol');
	fs.writeFileSync('./images/lol.png', encodedString, 'base64');

	let cnt = 2;
	let encodedStrings = await screenshotter.takePartialScreenshots('https://lolalytics.com/lol/kayle/build/', 'div[class^=\'SimpleGraph_simple\']', 4000);
	await Promise.all(encodedStrings);
	for (const str of encodedStrings) {
		fs.writeFileSync(`./images/lol${cnt}.png`, str, 'base64');
		cnt++;
	}

	encodedStrings = await screenshotter.takePartialScreenshots('https://lolalytics.com/lol/kayle/build/', 'div[class^=\'Graphs\']', 4000);
	await Promise.all(encodedStrings);
	for (const str of encodedStrings) {
		fs.writeFileSync(`./images/lol${cnt}.png`, str, 'base64');
		cnt++;
	}
	const filename = await getResponse({});
	fs.renameSync(filename.filename, 'images/lol1.png');
	console.log(filename);

}

async function generate_opgg_images() {
	let cnt = 1;
	let encodedStrings = await screenshotter.takePartialScreenshots('https://na.op.gg/champions/kayle/top/trends', 'div[class^=\'recharts-responsive\']', 4000, './..');
	await Promise.all(encodedStrings);
	for (const str of encodedStrings) {
		fs.writeFileSync(`./images/opgg${cnt}.png`, str, 'base64');
		cnt++;
	}

	encodedStrings = await screenshotter.takePartialScreenshots('https://na.op.gg/champions', 'table[class^=\'positionRank\']', 4000, './..');
	await Promise.all(encodedStrings);
	for (const str of encodedStrings) {
		fs.writeFileSync(`./images/opgg${cnt}.png`, str, 'base64');
		cnt++;
	}

	// crop leaderboard image
	const image = await Jimp.read(`images/opgg${cnt - 1}.png`);
	image.crop(0, 0, image.bitmap.width, 907);
	image.write(`images/opgg${cnt - 1}.png`);
}

function cleanup() {
	console.log(fs.readdirSync('./images/').filter(f => f.startsWith('ROI')).map(f => 'images/' + f));
	fs.readdirSync('./images/')
		.filter(f => f.startsWith('ROI'))
		.map(f => fs.unlinkSync('images/' + f));
	fs.unlinkSync('images/lol.png');
}

(async function toplevel() {
	// set up screenshotter
	await screenshotter.init();

	// set up rpc
	const packageDefinition = protoLoader.loadSync(PROTO_PATH, {});
	const recognizer = grpc.loadPackageDefinition(packageDefinition).Recognizer;
	const client = new recognizer(
		'localhost:50051',
		grpc.credentials.createInsecure(),
	);
	getResponse = util.promisify(client.GetResponse).bind(client);

	// set up required directories
	if (!fs.existsSync('./images')) {
		fs.mkdirSync('./images');
	}

	await generate_lol_images();
	cleanup();
	await generate_opgg_images();
	screenshotter.shutdown();

})();