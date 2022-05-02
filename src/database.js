const Database = require('better-sqlite3');

const { format } = require('util');

const db = {};

async function init() {
	db.cursor = new Database('./data.db');
	console.log('Connected to the data database.');

	// commonly executed database statements
	db.statements = {};
	db.statements.channel = db.cursor.prepare('SELECT channel_id FROM channels WHERE name=?');
	// tables
	for (const table of ['lol', 'opgg', 'ugg', 'log']) {
		db.statements[table] = db.cursor.prepare(format('INSERT OR REPLACE INTO %s VALUES(?, ?, ?, ?, ?)', table));
	}

}

function close() {
	db.cursor.close();
}

async function backup() {
	try {
		await db.cursor.prepare('VACUUM').run();
		await db.cursor.prepare('VACUUM main INTO ?').run(__dirname + '/../backup.db');
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