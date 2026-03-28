/**
 * EmoSense Database — SQLite
 * Tables: counselors, schedules, chat_sessions, messages, feedback
 */

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_DIR = fs.existsSync('/opt/render/project/src/data')
  ? '/opt/render/project/src/data'
  : path.join(__dirname, '..');
const DB_PATH = path.join(DB_DIR, 'emosense.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables();
    seedData();
  }
  return db;
}

function initTables() {
  // Counselors table
  db.exec(`
    CREATE TABLE IF NOT EXISTS counselors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      specialty TEXT,
      experience TEXT,
      bio TEXT,
      image TEXT,
      is_online INTEGER DEFAULT 0,
      email TEXT UNIQUE,
      password TEXT
    )
  `);

  // Schedules table
  db.exec(`
    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      counselor_id INTEGER,
      day TEXT,
      time_slots TEXT,
      FOREIGN KEY (counselor_id) REFERENCES counselors (id)
    )
  `);

  // Chat Sessions
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      user_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Messages
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      sender TEXT, -- 'user' or 'ai'
      content TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES chat_sessions (id)
    )
  `);

  // User Mood Entries (for trends over time)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_mood_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      mood TEXT,
      intensity REAL,
      source TEXT, -- 'chat', 'voice', 'manual'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User Memories (AI remembers details)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      content TEXT,
      importance INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User Preferences
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id TEXT PRIMARY KEY,
      personality_mode TEXT DEFAULT 'gentle',
      language TEXT DEFAULT 'en',
      lite_mode INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User Achievements
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      achievement_key TEXT,
      unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, achievement_key)
    )
  `);

  // Counselor Feedback
  db.exec(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      counselor_id INTEGER,
      rating INTEGER,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (counselor_id) REFERENCES counselors (id)
    )
  `);
}

function seedData() {
  const count = db.prepare('SELECT COUNT(*) as count FROM counselors').get();
  if (count.count === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);

    // Seed default counselor
    const insert = db.prepare(`
      INSERT INTO counselors (name, specialty, experience, bio, image, email, password, is_online)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      'Dr. Mercy Chidemo',
      'Trauma & Anxiety',
      '12 years',
      'Expert in student mental health and academic stress management.',
      '/assets/counselor1.jpg',
      'mercy@msu.ac.zw',
      hashedPassword,
      1
    );

    insert.run(
      'Tatenda Mukaro',
      'Relationships & Careers',
      '8 years',
      'Dedicated to helping students navigate life transitions.',
      '/assets/counselor2.jpg',
      'tatenda@msu.ac.zw',
      hashedPassword,
      0
    );

    // Seed sample schedules
    const counselor = db.prepare('SELECT id FROM counselors LIMIT 1').get();
    const insertSched = db.prepare('INSERT INTO schedules (counselor_id, day, time_slots) VALUES (?, ?, ?)');
    insertSched.run(counselor.id, 'Monday', JSON.stringify(['09:00', '10:00', '14:00']));
    insertSched.run(counselor.id, 'Wednesday', JSON.stringify(['11:00', '13:00', '15:00']));
  }
}

module.exports = { getDb };
