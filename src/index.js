const fs = require('fs');
const util = require('node:util');

const grpc = require('grpc');
const PROTO_PATH = './protos/lol.proto';
const protoLoader = require('@grpc/proto-loader');

const screenshotter = require('./screenshotter.js');

let getResponse;

async function generate_lol_images() {
	const encodedString = await screenshotter.takeScreenshot('lol');
	fs.writeFileSync('./image.png', encodedString, 'base64');

	let cnt = 2;
	let encodedStrings = await screenshotter.takePartialScreenshots('https://lolalytics.com/lol/kayle/build/', 'div[class^=\'SimpleGraph_simple\']', 2000);
	await Promise.all(encodedStrings);
	for (const str of encodedStrings) {
		fs.writeFileSync(`./images/lol${cnt}.png`, str, 'base64');
		cnt++;
	}

	encodedStrings = await screenshotter.takePartialScreenshots('https://lolalytics.com/lol/kayle/build/', 'div[class^=\'Graphs\']', 2000);
	await Promise.all(encodedStrings);
	for (const str of encodedStrings) {
		fs.writeFileSync(`./images/lol${cnt}.png`, str, 'base64');
		cnt++;
	}
	const filename = await getResponse({});
	fs.renameSync(filename.filename, 'images/lol1.png');
	console.log(filename);

}

function cleanup() {
	console.log(fs.readdirSync('./images/').filter(f => f.startsWith('ROI')).map(f => 'images/' + f));
	fs.readdirSync('./images/')
		.filter(f => f.startsWith('ROI'))
		.map(f => fs.unlinkSync('images/' + f));
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

	await generate_lol_images(client);
	cleanup();

	screenshotter.shutdown();

})();