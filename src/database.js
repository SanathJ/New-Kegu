const { format } = require('util');

const Database = require('better-sqlite3');

const db = {};

async function init() {
	db.cursor = new Database('./data.db');
	console.log('Connected to the data database');

	// commonly executed database statements
	db.statements = {};
	db.statements.channel = db.cursor.prepare('SELECT channel_id FROM channels WHERE name=?');
	// tables
	db.statements.data = {};
	db.statements.data_recent = {};
	for(const table of ['lol', 'opgg', 'ugg', 'log']) {
		db.statements[table] = db.cursor.prepare(format('INSERT OR REPLACE INTO %s VALUES(?, ?, ?, ?, ?)', table));
		db.statements.data[table] = db.cursor.prepare(format('SELECT * FROM %s WHERE Date = ?', table));
		db.statements.data_recent[table] = db.cursor.prepare(format('SELECT * FROM %s ORDER BY Date DESC LIMIT 1', table));
	}

	// links
	db.statements.link_add = db.cursor.prepare('INSERT INTO links VALUES(?, ?)');
	db.statements.link_edit = db.cursor.prepare('UPDATE links SET link = ?, name = ? WHERE name = ?');
	db.statements.link_remove = db.cursor.prepare('DELETE FROM links WHERE name = ?');
	db.statements.show = db.cursor.prepare('SELECT * FROM links WHERE name = ?');
	db.statements.show_all = db.cursor.prepare('SELECT * FROM links');

	// messages
	db.statements.message_add = db.cursor.prepare('INSERT OR REPLACE INTO messages VALUES(?, ?, ?)');
	db.statements.message_get = db.cursor.prepare('SELECT * FROM messages WHERE type = ?');

	// features
	db.statements.feature_set = db.cursor.prepare('INSERT OR REPLACE INTO features VALUES(?, ?)');
	db.statements.feature_get = db.cursor.prepare('SELECT * FROM features WHERE feature = ?');
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