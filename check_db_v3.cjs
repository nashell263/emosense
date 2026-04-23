const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'emosense_v3.db');
const db = new Database(dbPath);

try {
    const counselors = db.prepare('SELECT id, name, email FROM counselors').all();
    console.log('Counselors in DB:', counselors);
} catch (err) {
    console.error('DB Error:', err.message);
}
db.close();
