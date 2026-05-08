/**
 * Update existing counselor photos and genders in the database
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = fs.existsSync('/opt/render/project/src/data')
  ? '/opt/render/project/src/data'
  : __dirname;
const DB_PATH = path.join(DB_DIR, 'emosense_v4.db');

const db = new Database(DB_PATH);

// Update Tendai Moyo - female
db.prepare("UPDATE counselors SET photo = '/counselors/counselor-female-1.png', gender = 'female' WHERE email = 'tendai.moyo@msu.ac.zw'").run();

// Update Tatenda Chirwa - male
db.prepare("UPDATE counselors SET photo = '/counselors/counselor-male-1.png', gender = 'male' WHERE email = 'tatenda.chirwa@msu.ac.zw'").run();

// Update Rutendo Mhaka - female
db.prepare("UPDATE counselors SET photo = '/counselors/counselor-female-2.png', gender = 'female' WHERE email = 'rutendo.mhaka@msu.ac.zw'").run();

// Verify
const counselors = db.prepare('SELECT id, name, gender, photo FROM counselors').all();
console.log('Updated counselors:');
counselors.forEach(c => console.log(`  ${c.id}: ${c.name} (${c.gender}) → ${c.photo}`));

// Clean up duplicate/stale sessions
const deleted = db.prepare("DELETE FROM chat_sessions WHERE status = 'waiting' AND started_at < datetime('now', '-1 hour')").run();
console.log(`\nCleaned up ${deleted.changes} stale waiting sessions`);

db.close();
console.log('Done!');
