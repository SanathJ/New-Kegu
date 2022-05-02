const fs = require('fs');
const Jimp = require('jimp');
const screenshotter = require('./screenshotter.js');
const util = require('node:util');

const grpc = require('grpc');
const PROTO_PATH = './protos/lol.proto';
const protoLoader = require('@grpc/proto-loader');

const { urls } = require('./constants.js');
const datafetcher = require('./datafetcher.js');

const { createCanvas, registerFont } = require('canvas');

// fonts
registerFont(__dirname + '/../fonts/HelveticaNeue-Bold.otf', { family: 'HelveticaNeue', weight: '700' });


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

	async generate_ugg_images() {


		const tierList = [
			'platinum',
			'platinum_plus',
			'diamond',
			'diamond_plus',
			'diamond_2_plus',
			'master',
			'master_plus',
			'grandmaster',
			'challenger',
			'overall',
		];

		const xCoords = [121, 315, 507, 700, 893];
		const labels = ['Win Rate', 'Rank', 'Pick Rate', 'Ban Rate', 'Matches'];
		const wrColors = { 'shinggo-tier' : '#ff4e50', 'meh-tier':'#ffa1a2',
			'okay-tier': '#ffffff', 'good-tier':'#75cdff',
			'great-tier':'#08a6ff', 'volxd-tier':'#ff9b00',
		};

		for (let i = 0; i < tierList.length; i++) {
			const data = await datafetcher.ugg(tierList[i]);

			const canvas = createCanvas(1015, 90);
			const ctx = canvas.getContext('2d');

			ctx.fillStyle = '#222238';
			ctx.fillRect(0, 0, 1015, 90);

			ctx.textBaseline = 'top';
			ctx.textAlign = 'center';

			ctx.font = '700 18px HelveticaNeue';

			// color win rate appropriately
			const winrateTier = !data.wr || isNaN(data.wr) ? '' : data.wr < 45 ?
				'shinggo-tier' : data.wr < 48.5 ? 'meh-tier' : data.wr < 51.5 ?
					'okay-tier' : data.wr < 53 ? 'good-tier' : data.wr < 55 ? 'great-tier' : 'volxd-tier';

			ctx.fillStyle = String(wrColors[winrateTier]);
			ctx.fillText(data.wr + '%', xCoords[0], 30);

			const arr = [data.wr, data.rank, data.pr, data.br, data.matches];

			ctx.fillStyle = '#ffffff';
			for(let j = 1; j < 5; j++) {
				ctx.fillText(arr[j], xCoords[j], 30);
			}


			ctx.fillStyle = '#92929d';
			ctx.font = '700 11px HelveticaNeue';
			for(let j = 0; j < 5; j++) {
				ctx.fillText(labels[j], xCoords[j], 51);
			}

			fs.writeFileSync(`./images/ugg${i}.png`, canvas.toBuffer('image/png'));
		}
	},


	cleanup() {
		fs.readdirSync('./images/')
			.filter(f => f.startsWith('ROI'))
			.map(f => fs.unlinkSync('images/' + f));
		fs.unlinkSync('images/lol.png');
		fs.unlinkSync('images/lol6.png');
	},
};

