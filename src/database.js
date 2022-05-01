const Database = require('better-sqlite3');

const db = {};

async function init() {
	db.cursor = new Database('./data.db');
	console.log('Connected to the data database.');
}

function close() {
	db.cursor.close();
}

async function backup() {
	try{
		await db.cursor.run('VACUUM');
		await db.cursor.run('VACUUM main INTO ?', __dirname + '/../backup.db');
	}
	catch(err) {
		console.log(err);
	}
}

module.exports = {
	db,
	init,
	close,
	backup,
};