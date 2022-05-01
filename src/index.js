const fs = require('fs');

const grpc = require('grpc');
const PROTO_PATH = './protos/lol.proto';
const protoLoader = require('@grpc/proto-loader');

const screenshotter = require('./screenshotter.js');

(async function toplevel() {
	await screenshotter.init();
	const encodedString = await screenshotter.takeScreenshot('lol');
	fs.writeFileSync('./image.png', encodedString, 'base64');
	screenshotter.shutdown();

	const packageDefinition = protoLoader.loadSync(PROTO_PATH, {});
	const recognizer = grpc.loadPackageDefinition(packageDefinition).Recognizer;
	const client = new recognizer(
		'localhost:50051',
		grpc.credentials.createInsecure(),
	);

	client.GetResponse({}, (error, filename) => {
		if (error) {
			console.error(error);
			throw error;
		}

		console.log(filename);
	});
})();