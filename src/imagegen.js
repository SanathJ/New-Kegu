const fs = require('fs');
const Jimp = require('jimp');
const screenshotter = require('./screenshotter.js');
const util = require('node:util');
const d3 = require('d3');

const grpc = require('grpc');
const PROTO_PATH = './protos/lol.proto';
const protoLoader = require('@grpc/proto-loader');

const { urls, colors } = require('./constants.js');
const datafetcher = require('./datafetcher.js');

const { createCanvas, registerFont, loadImage } = require('canvas');

// fonts
registerFont(__dirname + '/../fonts/HelveticaNeue-Bold.otf', { family: 'HelveticaNeue', weight: '700' });
registerFont(__dirname + '/../fonts/Roboto-Regular.ttf', { family: 'Roboto', weight: '400' });
registerFont(__dirname + '/../fonts/Roboto-Light.ttf', { family: 'Roboto', weight: '300' });
registerFont(__dirname + '/../fonts/Roboto-Medium.ttf', { family: 'Roboto', weight: '500' });
registerFont(__dirname + '/../fonts/Roboto-Bold.ttf', { family: 'Roboto', weight: '700' });


// set up rpc
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {});
const recognizer = grpc.loadPackageDefinition(packageDefinition).Recognizer;
const rpc_client = new recognizer(
	'localhost:50051',
	grpc.credentials.createInsecure(),
);
const getResponse = util.promisify(rpc_client.GetResponse).bind(rpc_client);

// draws a line in ctx from (x1, y1) to (x2, y2)
function drawLine(ctx, x1, y1, x2, y2) {
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();
}
class logImageGenerator {
	// pie charts for stats
	static async log1(data) {
		const canvas = createCanvas(800, 200);

		const ctx = canvas.getContext('2d');
		ctx.fillStyle = colors.log.bg;
		ctx.fillRect(0, 0, 800, 200);

		const chart = d3.arc().innerRadius(55).outerRadius(60);
		ctx.translate(100, 100);
		chart.context(ctx);

		// pie charts
		const chartColors = [colors.log.blue, colors.log.green, colors.log.red, colors.log.yellow];
		const labelArr = ['Popularity', 'Win Rate', 'Ban Rate', 'Mained By'];
		for(let i = 0; i < 4; i++) {
			const values = [{ value:data[labelArr[i]], index:0 }, { value:100 - data[labelArr[i]], index:1 }];
			const arcs = d3.pie()
				.value(function(d) { return d.value;})
				.sort(function(a, b) { return a.index < b.index; })(values);

			ctx.translate((i ? 200 : 0), 0);
			chart.context(ctx);

			ctx.fillStyle = chartColors[i];
			ctx.beginPath();
			chart(arcs[0]);
			ctx.fill();
			ctx.closePath();

			ctx.beginPath();
			ctx.fillStyle = '#485363';
			chart(arcs[1]);
			ctx.fill();
			ctx.closePath();

			ctx.textBaseline = 'middle';
			ctx.textAlign = 'center';
			ctx.font = '300 24px Roboto';
			ctx.fillStyle = '#ffffff';
			ctx.fillText(data[labelArr[i]] + '%', 0, 0);

			ctx.fillStyle = '#ffffff';
			ctx.font = '300 20px Roboto';
			ctx.fillText(labelArr[i], 0, 80);
		}

		fs.writeFileSync('./images/log1.png', canvas.toBuffer('image/png'));
		return;
	}

	static async log2(data) {
		const spriteYCoords = {
			Top: 150,
			Mid: 90,
			Support: 120,
			'AD Carry': 0,
			Jungler: 60,
		};

		const canvas = createCanvas(553, 389);
		const ctx = canvas.getContext('2d');
		ctx.fillStyle = colors.log.bg;
		ctx.fillRect(0, 0, 553, 389);

		// Title
		ctx.textBaseline = 'top';
		ctx.textAlign = 'left';
		ctx.font = '500 24px Roboto';
		ctx.fillStyle = '#ffffff';
		ctx.fillText('Roles', 23, 13);

		// divider (x = 22 to x = 525)
		ctx.strokeStyle = colors.log.divider;
		drawLine(ctx, 22, 48, 525, 48);

		// get spritesheet
		const spritesheet = await loadImage(__dirname + '/../assets/logLanes.png');

		// headers
		const start = 37;
		ctx.textAlign = 'left';
		ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';

		// aligns headers to be placed at their category's center
		ctx.textAlign = 'center';
		ctx.font = '400 14px Roboto';
		ctx.fillText('Role', start + 60, 112 - 40);
		ctx.fillText('Winrate', 353 + (150 / 2), 112 - 40);
		// popularity rendered as bold to show its the sorting predicate
		ctx.font = '700 14px Roboto';
		ctx.fillStyle = '#ffffff';
		ctx.fillText('Popularity', 171 + (150 / 2), 112 - 40);

		// chart
		ctx.textAlign = 'left';
		let yOffset = 0;
		ctx.font = '400 12px Roboto';
		for(let i = 0; i < 5; i++) {

			// draw lane
			ctx.drawImage(spritesheet, 0, spriteYCoords[data.roles[i].position], 30, 30,
				171 - 134, 112 - 2 + yOffset, 30, 30);

			// draw label
			ctx.fillStyle = '#ffffff';
			ctx.textBaseline = 'middle';
			ctx.fillText(data.roles[i].position, (171 - 134) + 30 + 4, (112 - 2) + yOffset + (30 / 2));

			ctx.textBaseline = 'top';
			// popularity
			// grey underlying bar
			ctx.fillStyle = '#2f3b4b';
			ctx.fillRect(171, 112 + yOffset, 150, 15);
			// actual data bar
			ctx.fillStyle = colors.log.blue;
			ctx.fillRect(171, 112 + yOffset, data.roles[i].popularity / 100 * 150, 15);
			// label
			ctx.fillStyle = '#ffffff';
			ctx.fillText(parseFloat(data.roles[i].popularity).toFixed(1) + '%', 171, 131 + yOffset);
			// set to default
			ctx.fillStyle = '#2f3b4b';

			// winrate
			// grey underlying bar
			ctx.fillRect(353, 112 + yOffset, 150, 15);
			// actual data bar
			ctx.fillStyle = colors.log.green;
			ctx.fillRect(353, 112 + yOffset, data.roles[i].winrate / 100 * 150, 15);
			// label
			ctx.fillStyle = '#ffffff';
			ctx.fillText(parseFloat(data.roles[i].winrate).toFixed(1) + '%', 353, 131 + yOffset);
			// set to default
			ctx.fillStyle = '#2f3b4b';

			// draw dividers only between categories
			if (i != 4) {
			// divider
				drawLine(ctx, 22, 112 + 44 + yOffset, 525, 112 + 44 + yOffset);
			}

			yOffset += 55;
		}

		fs.writeFileSync('./images/log2.png', canvas.toBuffer('image/png'));
		return;
	}

	static async log3(data) {
		const canvas = createCanvas(600, 150);
		const ctx = canvas.getContext('2d');
		ctx.fillStyle = colors.log.bg;
		ctx.fillRect(0, 0, 600, 150);

		// Title
		ctx.textBaseline = 'top';
		ctx.textAlign = 'left';
		ctx.font = '500 24px Roboto';
		ctx.fillStyle = '#ffffff';
		ctx.fillText('Damage Dealt', 20, 15);

		ctx.strokeStyle = colors.log.divider;
		drawLine(ctx, 20 - 2, 15 + 40, 600 - (20 - 2), 15 + 40);

		// full bar width and height
		const barWidth = 600 - 2 * (20 - 2) - 2 * 10;
		const barHeight = 40;

		// draw bars
		// true damage
		ctx.fillStyle = '#aaaaaa';
		ctx.fillRect(20 + 5, 15 + 40 + 15, barWidth, barHeight);
		// magic damage
		ctx.fillStyle = colors.log.blue;
		ctx.fillRect(20 + 5, 15 + 40 + 15, ((data.damage_distribution[0] + data.damage_distribution[1]) / 100) * barWidth, barHeight);
		// physical damage
		ctx.fillStyle = colors.log.red;
		ctx.fillRect(20 + 5, 15 + 40 + 15, (data.damage_distribution[0] / 100) * barWidth, barHeight);

		// legend text
		ctx.fillStyle = '#ffffff';
		ctx.font = '400 12px Roboto';
		const legendSize = 16;
		const leftPadding = 2;
		const rightPadding = 5;

		// draw legend
		// physical
		let textWidth = ctx.measureText('Physical').width;
		ctx.fillText('Physical', 600 / 2 - (legendSize / 2) - rightPadding - textWidth,
			15 + 40 + 15 + barHeight + 10);
		ctx.fillStyle = colors.log.red;
		ctx.fillRect(600 / 2 - (legendSize / 2) - rightPadding - textWidth - leftPadding - legendSize,
			15 + 40 + 15 + barHeight + 10 - 2, legendSize, legendSize);

		// magic
		ctx.fillStyle = '#ffffff';
		ctx.fillText('Magic', 600 / 2 + (legendSize / 2) + leftPadding, 15 + 40 + 15 + barHeight + 10);
		ctx.fillStyle = colors.log.blue;
		ctx.fillRect(600 / 2 - (legendSize / 2), 15 + 40 + 15 + barHeight + 10 - 2,
			legendSize, legendSize);

		// true
		textWidth = ctx.measureText('Magic').width;
		ctx.fillStyle = '#ffffff';
		ctx.fillText('True', 600 / 2 + (legendSize / 2) + leftPadding + textWidth + rightPadding + legendSize + leftPadding,
			15 + 40 + 15 + barHeight + 10);
		ctx.fillStyle = '#aaaaaa';
		ctx.fillRect(600 / 2 + (legendSize / 2) + leftPadding + textWidth + rightPadding, 15 + 40 + 15 + barHeight + 10 - 2,
			legendSize, legendSize);

		fs.writeFileSync('./images/log3.png', canvas.toBuffer('image/png'));
		return;
	}

	static log4helper(ctx, data) {
		const labels = ['Pentakills / match', 'Gold / min', 'CS / min', 'Wards placed / min', 'Damage / min'];
		const indices = ['penta', 'gold', 'minions', 'wards', 'damage'];
		const xOffsets = [0, 0, 420, 0, 420];
		const yOffsets = [0, 210, 210, 420, 420];

		for (let i = 0; i < 5; i++) {
		// value
			ctx.textAlign = 'center';
			ctx.font = '300 56px Roboto';
			ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
			ctx.fillText(data[indices[i]].value, (800 - 40) / 4 + xOffsets[i], 10 + 210 + 170 / 2 + yOffsets[i]);
			// label
			ctx.textAlign = 'left';
			ctx.font = '300 36px Roboto';
			const fullTextWidth = ctx.measureText(labels[i]).width;
			ctx.fillStyle = 'rgba(255, 255, 255, 0.43)';
			ctx.fillText(labels[i], (800 - 40) / 4 - fullTextWidth / 2 + xOffsets[i], 10 + 210 + 170 / 2 + 50 + yOffsets[i]);
		}
	}

	static async log4(data) {
		const canvas = createCanvas(800, 800);
		const ctx = canvas.getContext('2d');

		// background
		ctx.fillStyle = colors.log.bg;
		ctx.fillRect(0, 0, 800, 800);

		// dividers
		ctx.fillStyle = colors.log.divider;
		ctx.fillRect(0, 170, 800, 40);
		ctx.fillRect(0, 170 + 210, 800, 40);
		ctx.fillRect(0, 170 + 420, 800, 40);
		ctx.fillRect(800 / 2 - 40 / 2, 170, 40, 800 - 170);


		/**
		 * KDA
		 */
		ctx.fillStyle = colors.log.green;
		ctx.font = '400 56px Roboto';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'bottom';
		const fullTextWidth = ctx.measureText(data.misc.kda.kills + ' / ' + data.misc.kda.deaths + ' / ' + data.misc.kda.assists).width;
		ctx.textAlign = 'left';
		// kills
		ctx.fillText(data.misc.kda.kills, 800 / 2 - fullTextWidth / 2, 170 / 2 + 10);
		// separator
		ctx.font = '300 56px Roboto';
		ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
		let partialTextWidth = ctx.measureText(data.misc.kda.kills + ' ').width;
		ctx.fillText('/', 800 / 2 - fullTextWidth / 2 + partialTextWidth, 170 / 2 + 10);
		// deaths
		ctx.font = '400 56px Roboto';
		ctx.fillStyle = colors.log.red;
		partialTextWidth = ctx.measureText(data.misc.kda.kills + ' / ').width;
		ctx.fillText(data.misc.kda.deaths, 800 / 2 - fullTextWidth / 2 + partialTextWidth, 170 / 2 + 10);
		// separator
		ctx.font = '300 56px Roboto';
		ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
		partialTextWidth = ctx.measureText(data.misc.kda.kills + ' / ' + data.misc.kda.deaths + ' ').width;
		ctx.fillText('/', 800 / 2 - fullTextWidth / 2 + partialTextWidth, 170 / 2 + 10);
		// assists
		ctx.font = '400 56px Roboto';
		ctx.fillStyle = colors.log.yellow;
		partialTextWidth = ctx.measureText(data.misc.kda.kills + ' / ' + data.misc.kda.deaths + ' / ').width;
		ctx.fillText(data.misc.kda.assists, 800 / 2 - fullTextWidth / 2 + partialTextWidth, 170 / 2 + 10);
		// label
		ctx.textAlign = 'center';
		ctx.font = '300 36px Roboto';
		ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
		ctx.fillText('Average KDA', 800 / 2, 170 / 2 + 60);


		// draw most data except multikills
		this.log4helper(ctx, data.misc);

		/**
		 * multikills
		 */
		const initialX = 15 + (800 - 40) / 2 + 40;
		// can get centered y values by: topY + (boxSize / 6)(2n + 1)
		const topY = 170 + 40;
		ctx.textBaseline = 'middle';
		const types = ['Quadra', 'Triple', 'Double'];

		for (let i = 0; i < 3; i++) {
			const currentY = topY + (170 / 6) * (2 * i + 1);
			// value
			ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
			ctx.font = '300 32px Roboto';
			ctx.fillText(parseFloat(data.misc.multiKills[types[i].toLowerCase()].value).toFixed(4), initialX, currentY);
			partialTextWidth = ctx.measureText(parseFloat(data.misc.multiKills[types[i].toLowerCase()].value).toFixed(4) + ' ').width;
			// label
			ctx.fillStyle = 'rgba(255, 255, 255, 0.43)';
			ctx.font = '300 24px Roboto';
			ctx.fillText(types[i] + 'kills / match', initialX + partialTextWidth, currentY);
			partialTextWidth += ctx.measureText(types[i] + 'kills / match').width;
		}

		fs.writeFileSync('./images/log4.png', canvas.toBuffer('image/png'));
		return;
	}

	static async postLogGraph(n, data, options) {
	// initialise options
		if(options.yDomainStart === undefined) {
			options.yDomainStart = d3.min(data, d => d[1]);
		}
		let tickFormatter;
		if(options.tickFormat === 'float') {
			tickFormatter = d => d.toFixed(1);
		}
		else if(options.tickFormat === 'percent') {
			tickFormatter = d => d.toString() + '%';
		}
		else {
			tickFormatter = d => d.toString();
		}

		// initialise canvas
		const width = 500;
		const height = 400;
		const canvas = createCanvas(width, height);
		const ctx = canvas.getContext('2d');
		ctx.fillStyle = colors.log.bg;
		ctx.fillRect(0, 0, width, height);

		// Title
		ctx.textBaseline = 'top';
		ctx.textAlign = 'left';
		ctx.font = '500 24px Roboto';
		ctx.fillStyle = '#ffffff';
		ctx.fillText(options.title, 23, 13);

		// divider
		ctx.strokeStyle = colors.log.divider;
		const margin = {
			left: 50,
			right: 20,
			top: 70,
			bottom: height - 30,
		};
		drawLine(ctx, margin.left / 2, 50, width - margin.right / 2, 50);

		let x;
		if(options.scaleFunction === 'utc') {
			x = d3.scaleUtc()
				.domain(d3.extent(data, d => d[0]))
				.range([margin.left, width - margin.right]);
		}
		else {
			x = d3.scaleLinear()
				.domain(d3.extent(data, d => d[0]))
				.range([margin.left, width - margin.right]);
		}

		const y = d3.scaleLinear()
			.domain([options.yDomainStart, Math.ceil(d3.max(data, d => d[1]) / options.tickIntervals.y) * options.tickIntervals.y])
			.range([margin.bottom, margin.top]);


		ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
		ctx.font = '400 12px Roboto';

		// y-axis
		ctx.textBaseline = 'middle';
		ctx.strokeStyle = 'rgba(45, 56, 72, 0.7)';
		ctx.textAlign = 'right';

		const yslope = (margin.top - margin.bottom) / (Math.ceil(d3.max(data, d => d[1]) / options.tickIntervals.y) * options.tickIntervals.y - options.yDomainStart);
		const yc = margin.top - (Math.ceil(d3.max(data, d => d[1]) / options.tickIntervals.y) * options.tickIntervals.y) * yslope;
		let f = d => yslope * d + yc;

		for(let d = Math.ceil(d3.max(data, e => e[1]) / options.tickIntervals.y) * options.tickIntervals.y; f(d) < margin.bottom; d -= options.tickIntervals.y) {
			drawLine(ctx, margin.left, f(d), width - margin.right, f(d));
			ctx.fillText(tickFormatter(d), margin.left - 5, f(d));
		}

		ctx.strokeStyle = colors.log.divider;
		drawLine(ctx, margin.left, margin.bottom, width - margin.right, margin.bottom);
		if(options.tickStarts.y !== undefined) {
			ctx.fillText(tickFormatter(options.tickStarts.y), margin.left - 5, f(options.tickStarts.y));
		}
		drawLine(ctx, margin.left, margin.top, width - margin.right, margin.top);

		// x-axis
		ctx.textBaseline = 'top';
		ctx.strokeStyle = 'rgba(45, 56, 72, 0.7)';
		ctx.textAlign = 'center';

		const xslope = (width - margin.right - margin.left) / (d3.max(data, d => d[0]) - d3.min(data, d => d[0]));
		const xc = width - margin.right - d3.max(data, d => d[0]) * xslope;
		f = d => xslope * d + xc;

		if(options.tickStarts.x === 'year') {
		// starts at 2015, 1 per year
			for(let d = 1420070400000, year = 2015; d < d3.max(data, e => e[0]); d += options.tickIntervals.x, year++) {
				drawLine(ctx, f(d), margin.bottom, f(d), margin.top);
				ctx.fillText(year.toString(), f(d), margin.bottom + 6);
			}
		}
		else {
			for(let d = d3.min(data, e => e[0]); d <= d3.max(data, e => e[0]); d += options.tickIntervals.x) {
				drawLine(ctx, f(d), margin.bottom, f(d), margin.top);
				ctx.fillText(d, f(d), margin.bottom + 6);
			}
		}

		ctx.strokeStyle = colors.log.divider;
		drawLine(ctx, margin.left, margin.bottom, margin.left, margin.top);
		drawLine(ctx, width - margin.right, margin.bottom, width - margin.right, margin.top);

		const line = d3.line()
			.x(d => x(d[0]))
			.y(d => y(d[1]))
			.context(ctx);

		ctx.strokeStyle = options.color;
		ctx.lineWidth = 2;
		ctx.beginPath();
		line(data);
		ctx.stroke();

		// gradient
		const gradient = ctx.createLinearGradient(margin.left, margin.bottom, margin.left, margin.top);
		const gradColor = d3.color(options.color);
		gradColor.opacity = 0.1;
		gradient.addColorStop(0, gradColor.toString());
		gradColor.opacity = 0.6;
		gradient.addColorStop(1, gradColor.toString());

		const area = d3.area()
			.x(d => x(d[0]))
			.y1(d => y(d[1]))
			.y0(margin.bottom)
			.context(ctx);

		ctx.fillStyle = gradient;
		ctx.beginPath();
		area(data);
		ctx.fill();

		fs.writeFileSync(`./images/log${n}.png`, canvas.toBuffer('image/png'));
		return;
	}
}

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
		const encodedStrings = await screenshotter.takePartialScreenshots(urls.opgg_trends, 'div[class^=\'recharts-responsive\']', 3000, './..');
		await Promise.all(encodedStrings);
		for (const str of encodedStrings) {
			fs.writeFileSync(`./images/opgg${cnt}.png`, str, 'base64');
			cnt++;
		}

		const str = await screenshotter.takeScreenshotByXpath(urls.opgg_champions, 'body', ['//*[contains(text(), \'Champion Statistics\')]', './..']);
		fs.writeFileSync(`./images/opgg${cnt}.png`, str, 'base64');
		cnt++;

		// crop leaderboard image
		const image = await Jimp.read(`images/opgg${cnt - 1}.png`);
		image.crop(0, 0, image.bitmap.width, 520);
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

	async generate_log_images(data) {
		await logImageGenerator.log1(data);
		await logImageGenerator.log2(data);
		await logImageGenerator.log3(data);
		await logImageGenerator.log4(data);

		const options = {
			title: 'Winrate History',
			tickIntervals: {
				x: 31536000000,
				y: 5,
			},
			yDomainStart: undefined,
			tickFormat: 'percent',
			scaleFunction: 'utc',
			color: colors.log.green,
			tickStarts: {
				x: 'year',
				y: undefined,
			},
		};
		await logImageGenerator.postLogGraph(5, data.winrate_history, options);

		options.title = 'Popularity History';
		options.color = colors.log.blue;
		options.tickStarts.y = 1;
		// may be changed by postLogGraph if undefined, so we reset
		options.yDomainStart = undefined;
		await logImageGenerator.postLogGraph(6, data.popularity_history, options);

		options.title = 'BanRate History';
		options.color = colors.log.red;
		options.tickStarts.y = 0;
		options.tickIntervals.y = 20;
		// may be changed by postLogGraph if undefined, so we reset
		options.yDomainStart = undefined;
		await logImageGenerator.postLogGraph(7, data.banrate_history, options);

		options.title = 'Gold / Game duration';
		options.color = colors.log.green;
		options.tickStarts.x = undefined;
		options.tickStarts.y = 0;
		options.tickIntervals = {
			x: 5,
			y: 2500,
		};
		options.yDomainStart = 0;
		options.tickFormat = 'raw';
		options.scaleFunction = 'linear';
		await logImageGenerator.postLogGraph(8, data.gold, options);

		options.title = 'Kills + Assists / Game duration';
		options.tickFormat = 'float';
		options.tickIntervals.y = 2.5;
		await logImageGenerator.postLogGraph(9, data.kills_and_assists, options);

		options.title = 'Deaths / Game duration';
		options.tickFormat = 'raw';
		options.color = colors.log.red;
		options.tickIntervals.y = 1;
		await logImageGenerator.postLogGraph(10, data.deaths, options);

		options.title = 'Winrate / Game Duration';
		options.tickFormat = 'percent';
		options.color = colors.log.green;
		options.tickIntervals.y = 10;
		await logImageGenerator.postLogGraph(11, data.winrate_duration, options);

		options.title = 'Winrate / Ranked Games Played';
		options.tickIntervals = {
			x: 10,
			y: 2,
		};
		options.tickStarts.y = undefined;
		options.yDomainStart = undefined;
		await logImageGenerator.postLogGraph(12, data.winrate_games, options);

		options.title = 'Minions / Game duration';
		options.tickIntervals.y = 50;
		options.tickStarts.y = 0;
		options.yDomainStart = 0;
		options.tickFormat = 'raw';
		await logImageGenerator.postLogGraph(13, data.minions, options);
	},

	cleanup() {
		fs.readdirSync('./images/')
			.filter(f => f.startsWith('ROI'))
			.map(f => fs.unlinkSync('images/' + f));
		fs.unlinkSync('images/lol.png');
		fs.unlinkSync('images/lol6.png');
	},
};

