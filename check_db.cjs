const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'emosense_v2.db');

console.log('Checking DB at:', DB_PATH);

if (!fs.existsSync(DB_PATH)) {
    console.log('DB does not exist at this path!');
    process.exit(1);
}

const db = new Database(DB_PATH);
const counselors = db.prepare('SELECT id, name, is_online FROM counselors').all();
console.log('Counselors in DB:', counselors);

const schedules = db.prepare('SELECT * FROM schedules').all();
console.log('Schedules in DB:', schedules);

db.close();
