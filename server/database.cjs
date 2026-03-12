/**
 * EmoSense Database — SQLite
 * Tables: counselors, schedules, chat_sessions, messages, feedback
 */

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'emosense.db');

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
  db.exec(`
    CREATE TABLE IF NOT EXISTS counselors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      gender TEXT NOT NULL CHECK(gender IN ('male', 'female')),
      photo TEXT DEFAULT '',
      specialization TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      is_online INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      counselor_id INTEGER NOT NULL,
      day_of_week TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      is_available INTEGER DEFAULT 1,
      FOREIGN KEY (counselor_id) REFERENCES counselors(id)
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      counselor_id INTEGER NOT NULL,
      student_alias TEXT NOT NULL,
      status TEXT DEFAULT 'waiting' CHECK(status IN ('waiting', 'active', 'ended')),
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME,
      FOREIGN KEY (counselor_id) REFERENCES counselors(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      sender_type TEXT NOT NULL CHECK(sender_type IN ('student', 'counselor', 'ai')),
      content TEXT NOT NULL,
      attachment_url TEXT,
      attachment_type TEXT,
      reply_to_id INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES chat_sessions(id),
      FOREIGN KEY (reply_to_id) REFERENCES messages(id)
    );

    CREATE TABLE IF NOT EXISTS user_profiles (
      id TEXT PRIMARY KEY,
      name TEXT,
      preferences TEXT,
      interests TEXT,
      emotional_baseline TEXT,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      importance INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user_profiles(id)
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_type TEXT NOT NULL CHECK(session_type IN ('ai', 'counselor')),
      session_id TEXT,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      helpful INTEGER DEFAULT 0,
      comment TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS emotion_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      emotion TEXT NOT NULL,
      confidence INTEGER DEFAULT 0,
      sentiment TEXT DEFAULT 'neutral',
      sentiment_score REAL DEFAULT 0,
      is_crisis INTEGER DEFAULT 0,
      message_preview TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crisis_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      student_alias TEXT NOT NULL,
      trigger_message TEXT NOT NULL,
      detected_emotion TEXT DEFAULT '',
      severity TEXT DEFAULT 'high' CHECK(severity IN ('medium','high','critical')),
      status TEXT DEFAULT 'new' CHECK(status IN ('new','acknowledged','resolved')),
      acknowledged_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (acknowledged_by) REFERENCES counselors(id)
    );
  `);
}

function seedData() {
  const existing = db.prepare('SELECT COUNT(*) as count FROM counselors').get();
  if (existing.count > 0) return;

  const hash = bcrypt.hashSync('counselor123', 10);

  const insert = db.prepare(`
    INSERT INTO counselors (name, email, password, gender, photo, specialization, bio)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSchedule = db.prepare(`
    INSERT INTO schedules (counselor_id, day_of_week, start_time, end_time, is_available)
    VALUES (?, ?, ?, ?, 1)
  `);

  const counselors = [
    {
      name: 'Ms. Tendai Moyo',
      email: 'tendai.moyo@msu.ac.zw',
      gender: 'female',
      photo: '/counselors/counselor-1.png',
      specialization: 'Anxiety & Stress Management',
      bio: 'Registered counseling psychologist with 8 years of experience in student mental health. Specializes in anxiety disorders, academic stress, and adjustment issues. Uses cognitive behavioral therapy (CBT) and mindfulness-based approaches.'
    },
    {
      name: 'Mr. Tatenda Chirwa',
      email: 'tatenda.chirwa@msu.ac.zw',
      gender: 'male',
      photo: '/counselors/counselor-2.png',
      specialization: 'Depression & Emotional Wellness',
      bio: 'Clinical psychologist with focus on depression, grief counseling, and emotional regulation. 10 years of experience working with university students. Approach combines solution-focused therapy with narrative techniques.'
    },
    {
      name: 'Dr. Rutendo Mhaka',
      email: 'rutendo.mhaka@msu.ac.zw',
      gender: 'female',
      photo: '/counselors/counselor-3.png',
      specialization: 'Academic Pressure & Career Guidance',
      bio: 'PhD in Educational Psychology. Specializes in academic burnout, career anxiety, and personal development. 15 years in higher education counseling. Uses integrative psychotherapy and motivational interviewing.'
    }
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  counselors.forEach((c, i) => {
    const result = insert.run(c.name, c.email, hash, c.gender, c.photo, c.specialization, c.bio);
    const counselorId = result.lastInsertRowid;

    // Give each counselor different schedules
    const schedDays = days.slice(i, i + 3).concat(days.slice(0, Math.max(0, (i + 3) - 5)));
    schedDays.forEach(day => {
      insertSchedule.run(counselorId, day, '08:00', '16:00');
    });
  });

  console.log('✅ Seeded 3 demo counselors (password: counselor123)');
}

module.exports = { getDb };
