const fs = require('fs');
const util = require('node:util');

const grpc = require('grpc');
const PROTO_PATH = './protos/lol.proto';
const protoLoader = require('@grpc/proto-loader');

const screenshotter = require('./screenshotter.js');
const imagegen = require('./imagegen.js');

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
	const getResponse = util.promisify(client.GetResponse).bind(client);

	// set up required directories
	if (!fs.existsSync('./images')) {
		fs.mkdirSync('./images');
	}

	await imagegen.generate_lol_images(getResponse);
	imagegen.cleanup();
	await imagegen.generate_opgg_images();
	screenshotter.shutdown();

})();