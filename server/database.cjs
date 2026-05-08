/**
 * EmoSense Database — SQLite
 * Tables: counselors, schedules, chat_sessions, messages, feedback, etc.
 */

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_DIR = fs.existsSync('/opt/render/project/src/data')
  ? '/opt/render/project/src/data'
  : path.join(__dirname, '..');
const DB_PATH = path.join(DB_DIR, 'emosense_v4.db');

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
        gender TEXT,
        specialization TEXT,
        bio TEXT,
        photo TEXT,
        is_online INTEGER DEFAULT 0,
        email TEXT UNIQUE,
        password TEXT
      )
    `);

  db.exec(`
      CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        counselor_id INTEGER,
        day_of_week TEXT,
        start_time TEXT,
        end_time TEXT,
        is_available INTEGER DEFAULT 1,
        FOREIGN KEY (counselor_id) REFERENCES counselors (id)
      )
    `);

  // Chat Sessions — includes started_at for dashboard queries
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      counselor_id INTEGER,
      student_alias TEXT,
      status TEXT DEFAULT 'waiting',
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (counselor_id) REFERENCES counselors (id)
    )
  `);

  // Messages — includes attachment and reply support
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      sender_type TEXT,
      content TEXT,
      attachment_url TEXT,
      attachment_type TEXT,
      reply_to_id INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES chat_sessions (id)
    )
  `);

  // User Mood Entries — includes notes and triggers
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_mood_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      mood TEXT,
      intensity REAL,
      notes TEXT DEFAULT '',
      triggers TEXT DEFAULT '',
      source TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User Memories
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      content TEXT,
      importance INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User Preferences — includes camera and voice settings
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id TEXT PRIMARY KEY,
      personality_mode TEXT DEFAULT 'gentle',
      language TEXT DEFAULT 'en',
      camera_enabled INTEGER DEFAULT 0,
      voice_enabled INTEGER DEFAULT 0,
      lite_mode INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User Achievements — matches server.cjs queries
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      achievement_type TEXT,
      title TEXT,
      description TEXT,
      icon TEXT,
      xp_earned INTEGER DEFAULT 0,
      earned_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Counselor Feedback (enhanced with category and anonymous support)
  db.exec(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_type TEXT,
      session_id TEXT,
      rating INTEGER,
      helpful INTEGER,
      comment TEXT,
      category TEXT DEFAULT 'general',
      anonymous INTEGER DEFAULT 1,
      user_alias TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Emotion Logs (Legacy)
  db.exec(`
    CREATE TABLE IF NOT EXISTS emotion_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      emotion TEXT,
      confidence REAL,
      sentiment TEXT,
      sentiment_score REAL,
      is_crisis INTEGER DEFAULT 0,
      message_preview TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Emotion Assessments (New Layer 1 Chatbot Engine)
  db.exec(`
    CREATE TABLE IF NOT EXISTS emotion_assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      message_id TEXT,
      detected_emotion TEXT,
      intensity REAL,
      confidence REAL,
      risk_level TEXT,
      trigger_theme TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Support Recommendations
  db.exec(`
    CREATE TABLE IF NOT EXISTS support_recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      recommended_tone TEXT,
      support_message TEXT,
      escalated INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Crisis Alerts
  db.exec(`
    CREATE TABLE IF NOT EXISTS crisis_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      student_alias TEXT,
      trigger_message TEXT,
      detected_emotion TEXT,
      severity TEXT,
      status TEXT DEFAULT 'new',
      contact_method TEXT,
      contact_info TEXT,
      escalation_level INTEGER DEFAULT 0,
      resolved_at DATETIME,
      acknowledged_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (acknowledged_by) REFERENCES counselors (id)
    )
  `);

  // Safe schema upgrades for existing DBs
  try { db.exec("ALTER TABLE crisis_alerts ADD COLUMN contact_method TEXT"); } catch(e) {}
  try { db.exec("ALTER TABLE crisis_alerts ADD COLUMN contact_info TEXT"); } catch(e) {}
  try { db.exec("ALTER TABLE crisis_alerts ADD COLUMN escalation_level INTEGER DEFAULT 0"); } catch(e) {}
  try { db.exec("ALTER TABLE crisis_alerts ADD COLUMN resolved_at DATETIME"); } catch(e) {}

  // Safe schema upgrades for feedback table
  try { db.exec("ALTER TABLE feedback ADD COLUMN category TEXT DEFAULT 'general'"); } catch(e) {}
  try { db.exec("ALTER TABLE feedback ADD COLUMN anonymous INTEGER DEFAULT 1"); } catch(e) {}
  try { db.exec("ALTER TABLE feedback ADD COLUMN user_alias TEXT"); } catch(e) {}

  // User Activity Logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      activity_type TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Risk Flags (crisis keyword matches + AI-flagged risks)
  db.exec(`
    CREATE TABLE IF NOT EXISTS risk_flags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      flag_type TEXT,
      trigger_phrase TEXT,
      detected_emotion TEXT,
      risk_level TEXT,
      action_taken TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Intake Forms (student triage before counselor chat)
  db.exec(`
    CREATE TABLE IF NOT EXISTS intake_forms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      issue_type TEXT,
      urgency INTEGER DEFAULT 3,
      is_safe INTEGER DEFAULT 1,
      is_anonymous INTEGER DEFAULT 1,
      preferred_gender TEXT,
      preferred_mode TEXT DEFAULT 'chat',
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Session Notes (counselor notes per session)
  db.exec(`
    CREATE TABLE IF NOT EXISTS session_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      counselor_id INTEGER,
      note_type TEXT DEFAULT 'general',
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (counselor_id) REFERENCES counselors (id)
    )
  `);

  // Counselor Feedback (counselor rates session after ending)
  db.exec(`
    CREATE TABLE IF NOT EXISTS counselor_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      counselor_id INTEGER,
      difficulty INTEGER,
      student_emotional_state TEXT,
      outcome TEXT,
      follow_up_needed INTEGER DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (counselor_id) REFERENCES counselors (id)
    )
  `);

  // ── Safe schema upgrades for new columns ──
  // emotion_assessments enhancements
  try { db.exec("ALTER TABLE emotion_assessments ADD COLUMN secondary_emotion TEXT"); } catch(e) {}
  try { db.exec("ALTER TABLE emotion_assessments ADD COLUMN intensity TEXT DEFAULT 'moderate'"); } catch(e) {}
  try { db.exec("ALTER TABLE emotion_assessments ADD COLUMN evidence TEXT"); } catch(e) {}
  try { db.exec("ALTER TABLE emotion_assessments ADD COLUMN recommended_tone TEXT"); } catch(e) {}

  // support_recommendations enhancements
  try { db.exec("ALTER TABLE support_recommendations ADD COLUMN recommendation_items TEXT"); } catch(e) {}
  try { db.exec("ALTER TABLE support_recommendations ADD COLUMN emotion_context TEXT"); } catch(e) {}
  try { db.exec("ALTER TABLE support_recommendations ADD COLUMN trigger_theme TEXT"); } catch(e) {}

  // feedback enhancements
  try { db.exec("ALTER TABLE feedback ADD COLUMN emotional_outcome TEXT"); } catch(e) {}
  try { db.exec("ALTER TABLE feedback ADD COLUMN support_types TEXT"); } catch(e) {}
  try { db.exec("ALTER TABLE feedback ADD COLUMN improvement TEXT"); } catch(e) {}
  try { db.exec("ALTER TABLE feedback ADD COLUMN counselor_id INTEGER"); } catch(e) {}

  // counselors enhancements
  try { db.exec("ALTER TABLE counselors ADD COLUMN max_concurrent_chats INTEGER DEFAULT 3"); } catch(e) {}
  try { db.exec("ALTER TABLE counselors ADD COLUMN specialization_tags TEXT DEFAULT ''"); } catch(e) {}
  try { db.exec("ALTER TABLE counselors ADD COLUMN languages TEXT DEFAULT 'English'"); } catch(e) {}
  try { db.exec("ALTER TABLE counselors ADD COLUMN status TEXT DEFAULT 'available'"); } catch(e) {}

  // chat_sessions enhancements
  try { db.exec("ALTER TABLE chat_sessions ADD COLUMN queue_position INTEGER"); } catch(e) {}
  try { db.exec("ALTER TABLE chat_sessions ADD COLUMN priority INTEGER DEFAULT 3"); } catch(e) {}
  try { db.exec("ALTER TABLE chat_sessions ADD COLUMN intake_id INTEGER"); } catch(e) {}
  try { db.exec("ALTER TABLE chat_sessions ADD COLUMN issue_type TEXT"); } catch(e) {}

  // crisis_alerts enhancements for SOS overhaul
  try { db.exec("ALTER TABLE crisis_alerts ADD COLUMN latitude REAL"); } catch(e) {}
  try { db.exec("ALTER TABLE crisis_alerts ADD COLUMN longitude REAL"); } catch(e) {}
  try { db.exec("ALTER TABLE crisis_alerts ADD COLUMN location_address TEXT"); } catch(e) {}
  try { db.exec("ALTER TABLE crisis_alerts ADD COLUMN quick_message TEXT"); } catch(e) {}
  try { db.exec("ALTER TABLE crisis_alerts ADD COLUMN triage_answers TEXT"); } catch(e) {}
}

function seedData() {
  const count = db.prepare('SELECT COUNT(*) as count FROM counselors').get();
  if (count.count === 0) {
    const hashedPassword = bcrypt.hashSync('counselor123', 10);

    const insert = db.prepare(`
      INSERT INTO counselors (name, gender, specialization, bio, photo, email, password, is_online)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      'Tendai Moyo',
      'female',
      'Student Stress & Anxiety',
      'Senior counselor with 10 years experience in academic wellness.',
      '/counselors/counselor-female-1.png',
      'tendai.moyo@msu.ac.zw',
      hashedPassword,
      1
    );

    insert.run(
      'Tatenda Chirwa',
      'male',
      'Relationship & Family',
      'Specialist in interpersonal dynamics and emotional support.',
      '/counselors/counselor-male-1.png',
      'tatenda.chirwa@msu.ac.zw',
      hashedPassword,
      0
    );

    insert.run(
      'Rutendo Mhaka',
      'female',
      'Career & Life Transitions',
      'Helping students navigate the journey from campus to career.',
      '/counselors/counselor-female-2.png',
      'rutendo.mhaka@msu.ac.zw',
      hashedPassword,
      0
    );

    // Seed sample schedules
    const counselor = db.prepare('SELECT id FROM counselors LIMIT 1').get();
    const insertSched = db.prepare('INSERT INTO schedules (counselor_id, day_of_week, start_time, end_time, is_available) VALUES (?, ?, ?, ?, ?)');
    insertSched.run(counselor.id, 'Monday', '09:00', '14:00', 1);
    insertSched.run(counselor.id, 'Wednesday', '11:00', '15:00', 1);
    insertSched.run(counselor.id, 'Friday', '10:00', '16:00', 1);
  }
}

module.exports = { getDb };
