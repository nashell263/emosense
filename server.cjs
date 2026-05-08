/**
 * EmoSense Backend Server
 * Express + Socket.io for AI chat, counselor system, and real-time messaging
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDb } = require('./server/database.cjs');
const claude = require('./server/claude.cjs');
const gemini = require('./server/gemini.cjs');
const nlp = require('./server/nlp.cjs');
const growth = require('./server/growth-engine.cjs');
const crisisPredictor = require('./server/crisis-predictor.cjs');
const emergencyManager = require('./server/emergency-manager.cjs');

// Init AI and NLP
nlp.initNLP();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for multimedia
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});
emergencyManager.init(io);

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'emosense_secret';

app.use(cors());
app.use(express.json());

// Initialize DB + AI (Claude → Groq → Gemini)
const db = getDb();
claude.initAI({
    anthropicKey: process.env.ANTHROPIC_API_KEY,
    groqApiKey: process.env.GROQ_API_KEY,
    geminiKey: process.env.GEMINI_API_KEY
});
// Also init legacy gemini module for backwards compat
gemini.initAI({
    groqApiKey: process.env.GROQ_API_KEY,
    geminiKey: process.env.GEMINI_API_KEY
});

// ═══════════════════════════════════════════════════
// TEST SMS ENDPOINT (remove after testing)
// ═══════════════════════════════════════════════════
app.get('/api/test-sms', async (req, res) => {
    try {
        const result = await emergencyManager.sendSMS(
            process.env.ADMIN_PHONE_NUMBER || '+263712155253',
            '🧠 EmoSense Test: If you received this, SMS alerts are working!'
        );
        console.log('📲 Test SMS result:', JSON.stringify(result));
        res.json(result);
    } catch (err) {
        console.error('❌ Test SMS Error:', err.message);
        res.json({ success: false, error: err.message });
    }
});

// ═══════════════════════════════════════════════════
// AUTH MIDDLEWARE
// ═══════════════════════════════════════════════════

function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token provided' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.counselorId = decoded.id;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
}

// ═══════════════════════════════════════════════════
// AI CHAT ENDPOINT
// ═══════════════════════════════════════════════════

app.post('/api/chat', async (req, res) => {
    const { message, sessionId, personalityMode, language } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    try {
        if (claude.isInitialized()) {
            const sid = sessionId || 'default';
            const result = await claude.chat(sid, message, {}, {
                personalityMode: personalityMode || 'gentle',
                language: language || 'en'
            });

            // ═══ AUTO-ESCALATION: Detect high-risk messages ═══
            const dangerKeywords = [
                'kill myself', 'want to die', 'end my life', 'suicide',
                'can\'t take it anymore', 'no reason to live', 'better off dead',
                'hurt myself', 'self harm', 'give up on life', 'ending it all',
                'i want to disappear', 'nothing matters anymore'
            ];
            const msgLower = message.toLowerCase();
            const isHighRisk = dangerKeywords.some(kw => msgLower.includes(kw));
            const emotionRisk = result.emotion && ['crisis', 'suicidal', 'severe_distress'].includes(result.emotion);

            if (isHighRisk || emotionRisk) {
                console.log('🚨 HIGH-RISK MESSAGE DETECTED:', message.substring(0, 80));

                // 1. Alert all connected counselors/supervisors via Socket.io
                if (io) {
                    io.emit('crisis-alert', {
                        type: 'auto_detected',
                        sessionId: sid,
                        message: message.substring(0, 200),
                        emotion: result.emotion,
                        timestamp: new Date().toISOString(),
                        severity: 'high'
                    });
                }

                // 2. Log to database
                try {
                    db.prepare(`INSERT INTO crisis_alerts (student_alias, trigger_message, escalation_level, status)
                        VALUES (?, ?, 'high', 'new')`)
                        .run(sid, message.substring(0, 500));
                } catch (dbErr) { console.error('Crisis log DB error:', dbErr.message); }

                // 3. Send SMS alert to admin
                try {
                    await emergencyManager.sendSMS(
                        process.env.ADMIN_PHONE_NUMBER || '+263712155253',
                        `🚨 EmoSense CRISIS ALERT: High-risk message detected from session ${sid}. Message: "${message.substring(0, 100)}". Please check the system immediately.`
                    );
                } catch (smsErr) { console.error('Crisis SMS error:', smsErr.message); }
            }

            res.json({
                response: result.response,
                source: result.source,
                emotion: result.emotion,
                petStats: result.petStats,
                escalated: isHighRisk || emotionRisk || false
            });
        } else {
            res.json({ response: null, source: 'local' });
        }
    } catch (err) {
        console.error('AI error:', err.message?.substring(0, 150));
        res.json({ response: null, source: 'local' });
    }
});

// MULTIMEDIA UPLOAD ENDPOINT
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url, type: req.file.mimetype });
});

app.post('/api/chat/reset', (req, res) => {
    const { sessionId } = req.body;
    if (sessionId) gemini.clearSession(sessionId);
    res.json({ ok: true });
});

// ═══════════════════════════════════════════════════
// COUNSELOR AUTH
// ═══════════════════════════════════════════════════

app.post('/api/counselors/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const counselor = db.prepare('SELECT * FROM counselors WHERE email = ?').get(email);
    console.log(`[AUTH] Login attempt: ${email} - Found: ${!!counselor}`);

    if (!counselor) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = bcrypt.compareSync(password, counselor.password);
    console.log(`[AUTH] Password match: ${isMatch}`);

    if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Set online + available
    db.prepare('UPDATE counselors SET is_online = 1, status = ? WHERE id = ?').run('available', counselor.id);

    // Clear stale sessions (older than 1 hour or from previous login)
    db.prepare("UPDATE chat_sessions SET status = 'closed' WHERE counselor_id = ? AND status IN ('waiting', 'active') AND started_at < datetime('now', '-1 hour')").run(counselor.id);
    console.log(`[AUTH] Cleared stale sessions for counselor ${counselor.id}`);

    const token = jwt.sign({ id: counselor.id, name: counselor.name }, JWT_SECRET, { expiresIn: '8h' });

    const { password: _, ...counselorData } = counselor;
    counselorData.is_online = 1;

    res.json({ token, counselor: counselorData });
});

app.post('/api/counselors/logout', authMiddleware, (req, res) => {
    db.prepare('UPDATE counselors SET is_online = 0 WHERE id = ?').run(req.counselorId);
    res.json({ ok: true });
});

app.post('/api/counselors/register', (req, res) => {
    const { name, email, password, gender, specialization, bio } = req.body;
    if (!name || !email || !password || !gender) {
        return res.status(400).json({ error: 'Name, email, password, and gender required' });
    }

    const existing = db.prepare('SELECT id FROM counselors WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(
        'INSERT INTO counselors (name, email, password, gender, specialization, bio) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, email, hash, gender, specialization || '', bio || '');

    const token = jwt.sign({ id: result.lastInsertRowid, name }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, counselor: { id: result.lastInsertRowid, name, email, gender, specialization, bio } });
});

// ═══════════════════════════════════════════════════
// COUNSELOR PROFILES (PUBLIC)
// ═══════════════════════════════════════════════════

app.get('/api/counselors', (req, res) => {
    const counselors = db.prepare(
        'SELECT id, name, gender, photo, specialization, bio, is_online, status FROM counselors'
    ).all();

    // Get schedule for each
    const getSchedule = db.prepare(
        'SELECT day_of_week, start_time, end_time FROM schedules WHERE counselor_id = ? AND is_available = 1'
    );

    const result = counselors.map(c => ({
        ...c,
        schedule: getSchedule.all(c.id)
    }));

    res.json(result);
});

// ═══════════════════════════════════════════════════
// COUNSELOR DASHBOARD (PROTECTED)
// ═══════════════════════════════════════════════════

app.get('/api/counselors/me', authMiddleware, (req, res) => {
    const counselor = db.prepare(
        'SELECT id, name, email, gender, photo, specialization, bio, is_online FROM counselors WHERE id = ?'
    ).get(req.counselorId);

    if (!counselor) return res.status(404).json({ error: 'Not found' });

    const schedule = db.prepare(
        'SELECT id, day_of_week, start_time, end_time, is_available FROM schedules WHERE counselor_id = ?'
    ).all(req.counselorId);

    const activeSessions = db.prepare(
        "SELECT id, student_alias, status, started_at FROM chat_sessions WHERE counselor_id = ? AND status IN ('waiting', 'active') ORDER BY started_at DESC"
    ).all(req.counselorId);

    const pastSessions = db.prepare(
        "SELECT id, student_alias, status, started_at, ended_at FROM chat_sessions WHERE counselor_id = ? AND status = 'ended' ORDER BY ended_at DESC LIMIT 20"
    ).all(req.counselorId);

    res.json({ counselor, schedule, activeSessions, pastSessions });
});

app.put('/api/counselors/me', authMiddleware, (req, res) => {
    const { specialization, bio } = req.body;
    db.prepare('UPDATE counselors SET specialization = ?, bio = ? WHERE id = ?')
        .run(specialization || '', bio || '', req.counselorId);
    res.json({ ok: true });
});

app.put('/api/counselors/me/schedule', authMiddleware, (req, res) => {
    const { schedule } = req.body; // [{ day_of_week, start_time, end_time }]
    if (!Array.isArray(schedule)) return res.status(400).json({ error: 'Schedule array required' });

    db.prepare('DELETE FROM schedules WHERE counselor_id = ?').run(req.counselorId);

    const insert = db.prepare(
        'INSERT INTO schedules (counselor_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)'
    );

    schedule.forEach(s => {
        insert.run(req.counselorId, s.day_of_week, s.start_time, s.end_time);
    });

    res.json({ ok: true });
});

// ═══════════════════════════════════════════════════
// CHAT SESSIONS
// ═══════════════════════════════════════════════════

app.post('/api/sessions', (req, res) => {
    const { counselorId } = req.body;
    const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const alias = 'Student-' + Math.floor(1000 + Math.random() * 9000);

    db.prepare(
        'INSERT INTO chat_sessions (id, counselor_id, student_alias, status) VALUES (?, ?, ?, ?)'
    ).run(sessionId, counselorId, alias, 'waiting');

    res.json({ sessionId, alias });
});

app.get('/api/sessions/:id/messages', (req, res) => {
    const messages = db.prepare(
        'SELECT sender_type, content, timestamp FROM messages WHERE session_id = ? ORDER BY timestamp ASC'
    ).all(req.params.id);
    res.json(messages);
});

// ═══════════════════════════════════════════════════
// TRIAGE & QUEUE MANAGEMENT
// ═══════════════════════════════════════════════════

app.post('/api/triage/submit', (req, res) => {
    const { issueType, urgency, isSafe, isAnonymous, preferredGender, preferredMode, description } = req.body;
    if (!issueType) return res.status(400).json({ error: 'Issue type required' });

    const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const alias = 'Student-' + Math.floor(1000 + Math.random() * 9000);
    const priority = isSafe === false ? 5 : Math.min(5, parseInt(urgency) || 3);

    // Save intake form
    const intakeResult = db.prepare(
        'INSERT INTO intake_forms (session_id, issue_type, urgency, is_safe, is_anonymous, preferred_gender, preferred_mode, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(sessionId, issueType, urgency || 3, isSafe !== false ? 1 : 0, isAnonymous !== false ? 1 : 0, preferredGender || null, preferredMode || 'chat', description || '');

    // Smart counselor matching
    const counselors = db.prepare(
        "SELECT id, name, gender, photo, specialization, specialization_tags, is_online, status, max_concurrent_chats FROM counselors WHERE is_online = 1 AND (status IS NULL OR status = 'available')"
    ).all();

    console.log(`[TRIAGE] Online counselors found: ${counselors.length}`, counselors.map(c => `${c.name}(${c.gender},online=${c.is_online},status=${c.status})`));
    console.log(`[TRIAGE] Preferred gender: "${preferredGender}"`);

    // Filter by gender preference first
    const genderFiltered = preferredGender
        ? counselors.filter(c => c.gender === preferredGender)
        : counselors;
    // Fall back to all if no matches for that gender
    const pool = genderFiltered.length > 0 ? genderFiltered : counselors;
    console.log(`[TRIAGE] After gender filter: ${genderFiltered.length}, pool: ${pool.length}`);

    const scored = pool.map(c => {
        let score = 50; // Base score for being online
        const spec = ((c.specialization || '') + ' ' + (c.specialization_tags || '')).toLowerCase();

        // Direct issue-to-specialization mapping (strong match)
        const issueSpecMap = {
            stress:       ['stress', 'academic', 'burnout', 'anxiety', 'exam'],
            anxiety:      ['anxiety', 'stress', 'worry', 'panic', 'overwhelm'],
            depression:   ['depression', 'mood', 'sadness', 'mental health', 'life'],
            relationship: ['relationship', 'family', 'interpersonal', 'social'],
            financial:    ['financial', 'money', 'career', 'life transitions'],
            other:        ['general', 'counselor', 'support', 'life']
        };
        
        const keywords = issueSpecMap[issueType] || [];
        keywords.forEach(kw => { if (spec.includes(kw)) score += 15; });

        // Gender preference bonus
        if (preferredGender && c.gender === preferredGender) score += 10;

        // Availability (check active session count)
        const activeChatCount = db.prepare("SELECT COUNT(*) as c FROM chat_sessions WHERE counselor_id = ? AND status IN ('waiting', 'active')").get(c.id)?.c || 0;
        const maxChats = c.max_concurrent_chats || 3;
        if (activeChatCount >= maxChats) score -= 100; // Over capacity
        else score += (maxChats - activeChatCount) * 5; // More capacity = higher score

        // Urgency bonus for online + available
        if (priority >= 4 && (c.status === 'available' || c.status === null)) score += 15;

        return { ...c, matchScore: score, activeChatCount, maxChats };
    }).filter(c => c.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore);

    // Calculate queue position
    const waitingCount = db.prepare("SELECT COUNT(*) as c FROM chat_sessions WHERE status = 'waiting'").get()?.c || 0;
    const queuePosition = waitingCount + 1;
    const estimatedWait = scored.length > 0 ? Math.max(1, queuePosition * 2) : -1; // -1 means no counselors available

    // Auto-assign best match or queue
    const bestMatch = scored[0];
    const counselorId = bestMatch ? bestMatch.id : null;

    // Create session
    db.prepare(
        'INSERT INTO chat_sessions (id, counselor_id, student_alias, status, priority, queue_position, intake_id, issue_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(sessionId, counselorId, alias, 'waiting', priority, queuePosition, intakeResult.lastInsertRowid, issueType);

    // If unsafe, trigger emergency
    if (isSafe === false) {
        db.prepare(
            'INSERT INTO crisis_alerts (session_id, student_alias, trigger_message, detected_emotion, severity, contact_method) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(sessionId, alias, 'Triage: Student reported feeling unsafe', 'crisis', 'critical', preferredMode || 'chat');
        io.emit('crisis-alert', { id: 0, sessionId, studentAlias: alias, severity: 'critical', trigger_message: 'Student reported feeling unsafe in triage' });
    }

    // Notify assigned counselor
    if (counselorId) {
        const counselorSocket = activeCounselors.get(counselorId);
        if (counselorSocket) {
            io.to(counselorSocket).emit('new-chat-request', { sessionId, alias, issueType, urgency: priority, isSafe: isSafe !== false });
        }
    }

    res.json({
        sessionId, alias, priority,
        assignedCounselor: bestMatch ? { id: bestMatch.id, name: bestMatch.name } : null,
        availableCounselors: scored.slice(0, 5).map(c => ({ id: c.id, name: c.name, photo: c.photo, matchScore: c.matchScore, gender: c.gender, specialization: c.specialization })),
        queue: { position: queuePosition, estimatedWaitMinutes: estimatedWait, totalWaiting: waitingCount },
        noCounselorsAvailable: scored.length === 0
    });
});

app.get('/api/queue/status/:sessionId', (req, res) => {
    const session = db.prepare("SELECT * FROM chat_sessions WHERE id = ?").get(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const aheadCount = db.prepare("SELECT COUNT(*) as c FROM chat_sessions WHERE status = 'waiting' AND priority >= ? AND started_at < ?").get(session.priority || 3, session.started_at)?.c || 0;
    res.json({ status: session.status, queuePosition: aheadCount + 1, estimatedWaitMinutes: Math.max(1, (aheadCount + 1) * 2), counselorAssigned: !!session.counselor_id });
});

// ═══════════════════════════════════════════════════
// SESSION NOTES (Counselor)
// ═══════════════════════════════════════════════════

app.post('/api/sessions/:id/notes', authMiddleware, (req, res) => {
    const { content, noteType } = req.body;
    if (!content) return res.status(400).json({ error: 'Note content required' });
    db.prepare('INSERT INTO session_notes (session_id, counselor_id, note_type, content) VALUES (?, ?, ?, ?)').run(req.params.id, req.counselorId, noteType || 'general', content);
    res.json({ ok: true });
});

app.get('/api/sessions/:id/notes', authMiddleware, (req, res) => {
    const notes = db.prepare('SELECT * FROM session_notes WHERE session_id = ? ORDER BY created_at DESC').all(req.params.id);
    res.json(notes);
});

app.get('/api/sessions/:id/intake', (req, res) => {
    const session = db.prepare('SELECT * FROM chat_sessions WHERE id = ?').get(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const intake = session.intake_id ? db.prepare('SELECT * FROM intake_forms WHERE id = ?').get(session.intake_id) : null;
    res.json({ session, intake });
});

// ═══════════════════════════════════════════════════
// COUNSELOR FEEDBACK (post-session)
// ═══════════════════════════════════════════════════

app.post('/api/feedback/counselor', authMiddleware, (req, res) => {
    const { sessionId, difficulty, studentEmotionalState, outcome, followUpNeeded, notes } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'Session ID required' });
    db.prepare(
        'INSERT INTO counselor_feedback (session_id, counselor_id, difficulty, student_emotional_state, outcome, follow_up_needed, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(sessionId, req.counselorId, difficulty || 3, studentEmotionalState || '', outcome || '', followUpNeeded ? 1 : 0, notes || '');
    res.json({ ok: true });
});

// ═══════════════════════════════════════════════════
// EMOTION PATTERNS API
// ═══════════════════════════════════════════════════

app.get('/api/emotions/patterns/:sessionId', (req, res) => {
    const patterns = claude.analyzeEmotionPatterns(req.params.sessionId);
    res.json(patterns);
});

// ═══════════════════════════════════════════════════
// SUPERVISOR / ADMIN PORTAL
// ═══════════════════════════════════════════════════

app.get('/api/supervisor/dashboard', authMiddleware, (req, res) => {
    // Counselors with active chat counts
    const counselors = db.prepare('SELECT * FROM counselors').all().map(c => {
        const activeChats = db.prepare("SELECT COUNT(*) as c FROM chat_sessions WHERE counselor_id = ? AND status IN ('waiting', 'active')").get(c.id)?.c || 0;
        return { ...c, activeChats };
    });

    // Queue stats
    const totalActive = db.prepare("SELECT COUNT(*) as c FROM chat_sessions WHERE status = 'active'").get()?.c || 0;
    const totalWaiting = db.prepare("SELECT COUNT(*) as c FROM chat_sessions WHERE status = 'waiting'").get()?.c || 0;

    // Recent alerts
    const recentAlerts = db.prepare('SELECT * FROM crisis_alerts ORDER BY created_at DESC LIMIT 20').all();

    // Feedback summary
    const fbStats = db.prepare('SELECT COUNT(*) as total, ROUND(AVG(rating), 1) as avgRating FROM feedback').get();
    const positiveCount = db.prepare('SELECT COUNT(*) as c FROM feedback WHERE rating >= 4').get()?.c || 0;
    const outcomes = db.prepare("SELECT emotional_outcome as outcome, COUNT(*) as count FROM feedback WHERE emotional_outcome IS NOT NULL GROUP BY emotional_outcome").all();
    const feedbackSummary = {
        total: fbStats.total || 0,
        avgRating: fbStats.avgRating || null,
        positivePercent: fbStats.total > 0 ? Math.round((positiveCount / fbStats.total) * 100) : 0,
        outcomes
    };

    // Emotion distribution
    const emotionStats = db.prepare("SELECT detected_emotion as emotion, COUNT(*) as count FROM emotion_assessments GROUP BY detected_emotion ORDER BY count DESC").all();

    res.json({ counselors, queueStats: { totalActive, totalWaiting }, recentAlerts, feedbackSummary, emotionStats });
});

// Counselor status update
app.put('/api/counselors/status', authMiddleware, (req, res) => {
    const { status } = req.body;
    if (!['available', 'busy', 'break'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    db.prepare('UPDATE counselors SET status = ? WHERE id = ?').run(status, req.counselorId);
    res.json({ ok: true });
});


// ═══════════════════════════════════════════════════
// CRISIS / SOS API
// ═══════════════════════════════════════════════════

// SOS endpoint defined below (after emergency manager routes)

app.post('/api/crisis/chat', async (req, res) => {
    const { message, history } = req.body;
    // Simple calming bot using Gemini/Claude
    try {
        const response = await claude.generateCalmingResponse(message, history);
        res.json({ response });
    } catch (err) {
        // Fallback
        res.json({ response: "I'm here with you. Just keep breathing. Help is on the way." });
    }
});


// ═══════════════════════════════════════════════════
// FEEDBACK
// ═══════════════════════════════════════════════════

app.post('/api/feedback', (req, res) => {
    const { sessionType, sessionId, rating, helpful, comment, category, anonymous, userAlias, emotional_outcome, support_types, improvement, counselor_id } = req.body;
    if (!rating) return res.status(400).json({ error: 'Rating required' });

    db.prepare(
        'INSERT INTO feedback (session_type, session_id, rating, helpful, comment, category, anonymous, user_alias, emotional_outcome, support_types, improvement, counselor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(sessionType || 'general', sessionId || null, rating, helpful ? 1 : 0, comment || '', category || 'general', anonymous !== false ? 1 : 0, userAlias || null, emotional_outcome || null, support_types || null, improvement || null, counselor_id || null);

    res.json({ ok: true });
});

app.get('/api/feedback/stats', authMiddleware, (req, res) => {
    const stats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      ROUND(AVG(rating), 1) as avg_rating,
      SUM(CASE WHEN helpful = 1 THEN 1 ELSE 0 END) as helpful_count
    FROM feedback
  `).get();
    res.json(stats);
});

// Public feedback stats (no auth needed) — for the feedback page
app.get('/api/feedback/public-stats', (req, res) => {
    const stats = db.prepare(`
        SELECT 
            COUNT(*) as total,
            ROUND(AVG(rating), 1) as avg_rating,
            SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) as positive_count
        FROM feedback
    `).get();

    const byCategory = db.prepare(`
        SELECT category, COUNT(*) as count, ROUND(AVG(rating), 1) as avg_rating
        FROM feedback
        GROUP BY category
        ORDER BY count DESC
    `).all();

    const recent = db.prepare(`
        SELECT rating, comment, category, created_at,
               CASE WHEN anonymous = 1 THEN 'Anonymous' ELSE COALESCE(user_alias, 'Student') END as display_name
        FROM feedback
        WHERE comment IS NOT NULL AND comment != ''
        ORDER BY created_at DESC
        LIMIT 10
    `).all();

    res.json({ stats, byCategory, recent });
});

// ═══════════════════════════════════════════════════
// EMOTION TRACKING
// ═══════════════════════════════════════════════════

app.post('/api/emotions/log', (req, res) => {
    const { sessionId, emotion, confidence, sentiment, sentimentScore, isCrisis, messagePreview } = req.body;
    if (!sessionId || !emotion) return res.status(400).json({ error: 'sessionId and emotion required' });

    db.prepare(
        'INSERT INTO emotion_logs (session_id, emotion, confidence, sentiment, sentiment_score, is_crisis, message_preview) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(sessionId, emotion, confidence || 0, sentiment || 'neutral', sentimentScore || 0, isCrisis ? 1 : 0, (messagePreview || '').substring(0, 100));

    res.json({ ok: true });
});

app.get('/api/emotions/trends/:sessionId', (req, res) => {
    const logs = db.prepare(
        'SELECT emotion, confidence, sentiment, sentiment_score, is_crisis, created_at FROM emotion_logs WHERE session_id = ? ORDER BY created_at ASC'
    ).all(req.params.sessionId);
    res.json(logs);
});

// ═══════════════════════════════════════════════════
// CRISIS ALERT SYSTEM
// ═══════════════════════════════════════════════════

app.post('/api/crisis/alert', (req, res) => {
    const { sessionId, studentAlias, triggerMessage, detectedEmotion, severity } = req.body;
    if (!sessionId || !triggerMessage) return res.status(400).json({ error: 'sessionId and triggerMessage required' });

    const result = db.prepare(
        'INSERT INTO crisis_alerts (session_id, student_alias, trigger_message, detected_emotion, severity) VALUES (?, ?, ?, ?, ?)'
    ).run(sessionId, studentAlias || 'Anonymous', triggerMessage.substring(0, 500), detectedEmotion || '', severity || 'high');

    const alert = {
        id: result.lastInsertRowid,
        sessionId,
        studentAlias: studentAlias || 'Anonymous',
        severity: severity || 'high',
        detectedEmotion: detectedEmotion || '',
        createdAt: new Date().toISOString()
    };

    // Real-time alert to all online counselors
    io.emit('crisis-alert', alert);

    res.json({ ok: true, alertId: result.lastInsertRowid });
});

app.post('/api/crisis/sos', (req, res) => {
    const { contactMethod, contactInfo, isUnsafe, severity: clientSeverity, quickMessage, triageAnswers, location } = req.body;
    let sessionId = req.body.sessionId || ('sos_' + Date.now());
    const alias = 'Student-' + Math.floor(1000 + Math.random() * 9000);
    const severity = clientSeverity || (isUnsafe ? 'critical' : 'high');
    const triggerMsg = quickMessage || (isUnsafe ? 'User reported: I am unsafe!' : 'SOS Emergency Button');

    const result = db.prepare(
        'INSERT INTO crisis_alerts (session_id, student_alias, trigger_message, detected_emotion, severity, contact_method, contact_info, latitude, longitude, location_address, quick_message, triage_answers) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
        sessionId, alias, triggerMsg, 'crisis', severity,
        contactMethod || 'chat', contactInfo || '',
        location?.lat || null, location?.lng || null, location?.address || null,
        quickMessage || null, triageAnswers || null
    );

    const alert = db.prepare('SELECT * FROM crisis_alerts WHERE id = ?').get(result.lastInsertRowid);
    emergencyManager.triggerSOS(alert);

    // Create session for counselor chat
    try {
        db.prepare(
            'INSERT INTO chat_sessions (id, student_alias, status, priority, issue_type) VALUES (?, ?, ?, ?, ?)'
        ).run(sessionId, alias, 'waiting', severity === 'critical' ? 5 : severity === 'high' ? 4 : 3, 'emergency');
    } catch(e) {}

    // Broadcast enhanced crisis alert to all connected counselors
    io.emit('crisis-alert', {
        id: alert.id,
        sessionId,
        studentAlias: alias,
        severity,
        contact_method: contactMethod,
        trigger_message: triggerMsg,
        quickMessage: quickMessage || '',
        location: location ? { lat: location.lat, lng: location.lng, address: location.address } : null,
        triageAnswers: triageAnswers ? JSON.parse(triageAnswers) : null,
        timestamp: new Date().toISOString()
    });

    res.json({ ok: true, alertId: alert.id, sessionId, alias });
});

app.post('/api/crisis/chat', async (req, res) => {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });
    
    // Use Claude for crisis support (falls back internally to Groq/Gemini)
    try {
        const response = await claude.getCrisisSupport(message, history || []);
        res.json({ response });
    } catch (err) {
        res.json({ response: "Ndiri pano. Please breathe slowly. Help is on the way. (I am here.)" });
    }
});

app.get('/api/crisis/alerts', authMiddleware, (req, res) => {
    const alerts = db.prepare(
        "SELECT ca.*, c.name as acknowledged_by_name FROM crisis_alerts ca LEFT JOIN counselors c ON ca.acknowledged_by = c.id ORDER BY ca.created_at DESC LIMIT 50"
    ).all();
    res.json(alerts);
});

app.put('/api/crisis/alerts/:id/acknowledge', authMiddleware, (req, res) => {
    const alert = db.prepare('SELECT * FROM crisis_alerts WHERE id = ?').get(req.params.id);
    db.prepare(
        "UPDATE crisis_alerts SET status = 'acknowledged', acknowledged_by = ? WHERE id = ?"
    ).run(req.counselorId, req.params.id);
    emergencyManager.acknowledgeSOS(req.params.id);
    
    // Get counselor info
    const counselor = db.prepare('SELECT id, name FROM counselors WHERE id = ?').get(req.counselorId);
    
    // Update the chat session to assign this counselor
    if (alert && alert.session_id) {
        db.prepare("UPDATE chat_sessions SET counselor_id = ?, status = 'active' WHERE id = ?").run(req.counselorId, alert.session_id);
        
        // Emit to the student's session room so their SOS modal closes
        io.to(alert.session_id).emit('sos-accepted', {
            alertId: alert.id,
            sessionId: alert.session_id,
            counselorId: req.counselorId,
            counselorName: counselor?.name || 'Counselor'
        });
        
        // Also emit chat-accepted for the live chat flow
        io.to(alert.session_id).emit('chat-accepted', { sessionId: alert.session_id });
    }
    
    res.json({ ok: true, sessionId: alert?.session_id });
});

app.put('/api/crisis/alerts/:id/resolve', authMiddleware, (req, res) => {
    db.prepare(
        "UPDATE crisis_alerts SET status = 'resolved', acknowledged_by = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(req.counselorId, req.params.id);
    emergencyManager.acknowledgeSOS(req.params.id);
    res.json({ ok: true });
});

// ═══════════════════════════════════════════════════
// VONAGE WEBHOOKS
// ═══════════════════════════════════════════════════

app.post('/api/webhooks/vonage/inbound-sms', async (req, res) => {
    console.log('[Vonage Webhook] Inbound SMS received:', req.body);
    const { msisdn, to, text } = req.body; // msisdn is sender's phone number

    if (!text || !msisdn) {
        return res.status(200).send('OK');
    }

    try {
        // Run Claude 2-layer emotion detection & support on the inbound text
        const emotionData = await nlp.analyzeEmotion(text); // Placeholder for Layer 1
        
        // Very basic response logic (will be upgraded in the chatbot task)
        const replyText = `EmoSense: We received your message: "${text}". A counselor has been notified if this is an emergency.`;
        
        // If it looks like a crisis, escalate it immediately
        if (text.toLowerCase().includes('help') || text.toLowerCase().includes('suicide') || text.toLowerCase().includes('die')) {
             db.prepare(
                'INSERT INTO crisis_alerts (session_id, student_alias, trigger_message, detected_emotion, severity, contact_method, contact_info) VALUES (?, ?, ?, ?, ?, ?, ?)'
            ).run('sms_' + Date.now(), 'SMS User', text, 'crisis', 'critical', 'sms', msisdn);
             console.log(`[Vonage Webhook] SOS Triggered for ${msisdn}`);
             
             // Optionally send an immediate reply
             await emergencyManager.notifyEmergency(['SMS'], {
                 student_alias: 'SMS User',
                 severity: 'critical',
                 trigger_message: text,
                 id: 'sms_' + Date.now()
             }, msisdn);
        }

        res.status(200).send('OK');
    } catch (err) {
        console.error('[Vonage Webhook Error]:', err);
        res.status(500).send('Error processing SMS');
    }
});

// ═══════════════════════════════════════════════════
// COUNSELOR ANALYTICS
// ═══════════════════════════════════════════════════

app.get('/api/analytics/emotions', authMiddleware, (req, res) => {
    const period = req.query.period || '7'; // days
    const stats = db.prepare(`
        SELECT emotion, COUNT(*) as count,
          ROUND(AVG(confidence), 1) as avg_confidence,
          ROUND(AVG(sentiment_score), 2) as avg_sentiment
        FROM emotion_logs
        WHERE created_at >= datetime('now', '-${parseInt(period)} days')
        GROUP BY emotion
        ORDER BY count DESC
    `).all();

    const total = stats.reduce((sum, s) => sum + s.count, 0);
    const result = stats.map(s => ({
        ...s,
        percentage: total > 0 ? Math.round((s.count / total) * 100) : 0
    }));

    res.json({ emotions: result, total, period: parseInt(period) });
});

app.get('/api/analytics/trends', authMiddleware, (req, res) => {
    const period = req.query.period || '7';
    const trends = db.prepare(`
        SELECT DATE(created_at) as date,
          emotion,
          COUNT(*) as count,
          ROUND(AVG(sentiment_score), 2) as avg_sentiment
        FROM emotion_logs
        WHERE created_at >= datetime('now', '-${parseInt(period)} days')
        GROUP BY DATE(created_at), emotion
        ORDER BY date ASC
    `).all();
    res.json(trends);
});

app.get('/api/analytics/summary', authMiddleware, (req, res) => {
    const totalSessions = db.prepare(
        'SELECT COUNT(DISTINCT session_id) as count FROM emotion_logs'
    ).get();

    const totalMessages = db.prepare(
        'SELECT COUNT(*) as count FROM emotion_logs'
    ).get();

    const avgSentiment = db.prepare(
        'SELECT ROUND(AVG(sentiment_score), 2) as avg FROM emotion_logs'
    ).get();

    const crisisCount = db.prepare(
        "SELECT COUNT(*) as count FROM crisis_alerts"
    ).get();

    const activeCrisis = db.prepare(
        "SELECT COUNT(*) as count FROM crisis_alerts WHERE status = 'new'"
    ).get();

    const topEmotion = db.prepare(
        'SELECT emotion, COUNT(*) as count FROM emotion_logs GROUP BY emotion ORDER BY count DESC LIMIT 1'
    ).get();

    const peakHours = db.prepare(`
        SELECT CAST(strftime('%H', created_at) AS INTEGER) as hour, COUNT(*) as count
        FROM emotion_logs
        GROUP BY hour
        ORDER BY count DESC
        LIMIT 5
    `).all();

    res.json({
        totalSessions: totalSessions?.count || 0,
        totalMessages: totalMessages?.count || 0,
        avgSentiment: avgSentiment?.avg || 0,
        crisisCount: crisisCount?.count || 0,
        activeCrisis: activeCrisis?.count || 0,
        topEmotion: topEmotion?.emotion || 'none',
        peakHours
    });
});

// ═══════════════════════════════════════════════════
// MOOD TRACKING (Personal Dashboard)
// ═══════════════════════════════════════════════════

app.post('/api/mood/log', (req, res) => {
    const { userId, mood, intensity, notes, triggers, source } = req.body;
    if (!userId || !mood) return res.status(400).json({ error: 'userId and mood required' });

    db.prepare(
        'INSERT INTO user_mood_entries (user_id, mood, intensity, notes, triggers, source) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(userId, mood, intensity || 0.5, notes || '', triggers || '', source || 'manual');

    // Also log activity
    db.prepare(
        'INSERT INTO user_activity_logs (user_id, activity_type, metadata) VALUES (?, ?, ?)'
    ).run(userId, 'mood_log', JSON.stringify({ mood, intensity }));

    res.json({ ok: true });
});

app.get('/api/mood/history/:userId', (req, res) => {
    const days = parseInt(req.query.days) || 30;
    const entries = db.prepare(
        `SELECT * FROM user_mood_entries WHERE user_id = ? AND created_at >= datetime('now', '-${days} days') ORDER BY created_at DESC`
    ).all(req.params.userId);
    res.json(entries);
});

app.get('/api/mood/trends/:userId', (req, res) => {
    const days = parseInt(req.query.days) || 30;

    // Daily mood averages
    const dailyTrends = db.prepare(`
        SELECT DATE(created_at) as date, mood, 
               ROUND(AVG(intensity), 2) as avg_intensity,
               COUNT(*) as count
        FROM user_mood_entries 
        WHERE user_id = ? AND created_at >= datetime('now', '-${days} days')
        GROUP BY DATE(created_at), mood
        ORDER BY date ASC
    `).all(req.params.userId);

    // Day-of-week patterns (trigger detection)
    const dayOfWeekPattern = db.prepare(`
        SELECT CASE CAST(strftime('%w', created_at) AS INTEGER)
            WHEN 0 THEN 'Sunday' WHEN 1 THEN 'Monday' WHEN 2 THEN 'Tuesday'
            WHEN 3 THEN 'Wednesday' WHEN 4 THEN 'Thursday' WHEN 5 THEN 'Friday'
            WHEN 6 THEN 'Saturday' END as day_name,
            mood, ROUND(AVG(intensity), 2) as avg_intensity, COUNT(*) as count
        FROM user_mood_entries 
        WHERE user_id = ? AND created_at >= datetime('now', '-${days} days')
        GROUP BY day_name, mood
        ORDER BY CAST(strftime('%w', created_at) AS INTEGER)
    `).all(req.params.userId);

    // Hour-of-day patterns
    const hourPattern = db.prepare(`
        SELECT CAST(strftime('%H', created_at) AS INTEGER) as hour,
               mood, ROUND(AVG(intensity), 2) as avg_intensity, COUNT(*) as count
        FROM user_mood_entries 
        WHERE user_id = ? AND created_at >= datetime('now', '-${days} days')
        GROUP BY hour, mood
        ORDER BY hour ASC
    `).all(req.params.userId);

    // Mood distribution
    const distribution = db.prepare(`
        SELECT mood, COUNT(*) as count, ROUND(AVG(intensity), 2) as avg_intensity
        FROM user_mood_entries 
        WHERE user_id = ? AND created_at >= datetime('now', '-${days} days')
        GROUP BY mood ORDER BY count DESC
    `).all(req.params.userId);

    res.json({ dailyTrends, dayOfWeekPattern, hourPattern, distribution });
});

app.get('/api/mood/insights/:userId', (req, res) => {
    const entries = db.prepare(
        `SELECT * FROM user_mood_entries WHERE user_id = ? AND created_at >= datetime('now', '-30 days') ORDER BY created_at ASC`
    ).all(req.params.userId);

    if (entries.length < 3) {
        return res.json({ insights: [], message: 'Keep logging your mood — insights will appear after a few entries!' });
    }

    const insights = [];

    // Day-of-week trigger detection
    const dayMoods = {};
    entries.forEach(e => {
        const day = new Date(e.created_at).toLocaleDateString('en-US', { weekday: 'long' });
        if (!dayMoods[day]) dayMoods[day] = [];
        dayMoods[day].push({ mood: e.mood, intensity: e.intensity });
    });

    for (const [day, moods] of Object.entries(dayMoods)) {
        const negMoods = moods.filter(m => ['stress', 'anxiety', 'depression', 'sadness', 'anger', 'loneliness'].includes(m.mood));
        if (negMoods.length > moods.length * 0.6 && moods.length >= 2) {
            const avgIntensity = negMoods.reduce((s, m) => s + m.intensity, 0) / negMoods.length;
            insights.push({
                type: 'trigger',
                icon: '📅',
                title: `${day} Pattern Detected`,
                description: `You tend to feel worse on ${day}s (${Math.round(avgIntensity * 100)}% avg intensity). Consider planning a calming activity for ${day} evenings.`,
                severity: avgIntensity > 0.7 ? 'high' : 'moderate'
            });
        }
    }

    // Mood streak detection
    const recentMoods = entries.slice(-5).map(e => e.mood);
    const negativeStreak = recentMoods.filter(m => ['stress', 'anxiety', 'depression', 'sadness'].includes(m));
    if (negativeStreak.length >= 4) {
        insights.push({
            type: 'pattern',
            icon: '⚠️',
            title: 'Extended Low Mood Period',
            description: 'You\'ve been feeling down for several days. This is a signal to reach out — consider talking to a counselor or trusted friend.',
            severity: 'high'
        });
    }

    // Improvement detection
    const firstHalf = entries.slice(0, Math.floor(entries.length / 2));
    const secondHalf = entries.slice(Math.floor(entries.length / 2));
    const firstAvg = firstHalf.reduce((s, e) => s + e.intensity, 0) / (firstHalf.length || 1);
    const secondAvg = secondHalf.reduce((s, e) => s + e.intensity, 0) / (secondHalf.length || 1);

    if (secondAvg < firstAvg * 0.8) {
        insights.push({
            type: 'positive',
            icon: '🌟',
            title: 'Your Mood is Improving!',
            description: 'Your recent emotional intensity has decreased compared to earlier. Keep doing what\'s working for you!',
            severity: 'positive'
        });
    }

    // Most common mood
    const moodCounts = {};
    entries.forEach(e => { moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1; });
    const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
    if (topMood) {
        const percentage = Math.round((topMood[1] / entries.length) * 100);
        insights.push({
            type: 'info',
            icon: '📊',
            title: `Most Common Mood: ${topMood[0]}`,
            description: `${percentage}% of your entries are "${topMood[0]}". Understanding your baseline helps you notice changes.`,
            severity: 'info'
        });
    }

    res.json({ insights, totalEntries: entries.length });
});

// ═══════════════════════════════════════════════════
// USER PREFERENCES
// ═══════════════════════════════════════════════════

app.get('/api/preferences/:userId', (req, res) => {
    let prefs = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(req.params.userId);
    if (!prefs) {
        db.prepare('INSERT INTO user_preferences (user_id) VALUES (?)').run(req.params.userId);
        prefs = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(req.params.userId);
    }
    res.json(prefs);
});

app.put('/api/preferences/:userId', (req, res) => {
    const { personalityMode, language, cameraEnabled, voiceEnabled } = req.body;

    // Ensure row exists
    const existing = db.prepare('SELECT user_id FROM user_preferences WHERE user_id = ?').get(req.params.userId);
    if (!existing) {
        db.prepare('INSERT INTO user_preferences (user_id) VALUES (?)').run(req.params.userId);
    }

    if (personalityMode) {
        db.prepare('UPDATE user_preferences SET personality_mode = ? WHERE user_id = ?')
            .run(personalityMode, req.params.userId);
    }
    if (language) {
        db.prepare('UPDATE user_preferences SET language = ? WHERE user_id = ?')
            .run(language, req.params.userId);
    }
    if (cameraEnabled !== undefined) {
        db.prepare('UPDATE user_preferences SET camera_enabled = ? WHERE user_id = ?')
            .run(cameraEnabled ? 1 : 0, req.params.userId);
    }
    if (voiceEnabled !== undefined) {
        db.prepare('UPDATE user_preferences SET voice_enabled = ? WHERE user_id = ?')
            .run(voiceEnabled ? 1 : 0, req.params.userId);
    }

    if (req.body.liteMode !== undefined) {
        db.prepare('UPDATE user_preferences SET lite_mode = ? WHERE user_id = ?')
            .run(req.body.liteMode ? 1 : 0, req.params.userId);
    }

    db.prepare('UPDATE user_preferences SET updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
        .run(req.params.userId);

    const prefs = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(req.params.userId);
    res.json(prefs);
});

// ═══════════════════════════════════════════════════
// CRISIS PREDICTION SYSTEM
// ═══════════════════════════════════════════════════

app.get('/api/crisis/predict/:userId', (req, res) => {
    const userId = req.params.userId;

    const moodEntries = db.prepare(
        "SELECT * FROM user_mood_entries WHERE user_id = ? AND created_at >= datetime('now', '-14 days') ORDER BY created_at ASC"
    ).all(userId);

    const emotionLogs = db.prepare(
        "SELECT * FROM emotion_logs WHERE session_id = ? AND created_at >= datetime('now', '-14 days') ORDER BY created_at ASC"
    ).all(userId);

    const activityLogs = db.prepare(
        "SELECT * FROM user_activity_logs WHERE user_id = ? AND created_at >= datetime('now', '-14 days') ORDER BY created_at ASC"
    ).all(userId);

    const prediction = crisisPredictor.predictCrisisRisk(moodEntries, emotionLogs, activityLogs);

    // If risk is high/critical and we haven't alerted recently, create alert
    if (['high', 'critical'].includes(prediction.riskLevel) && crisisPredictor.shouldSendAlert(db, userId)) {
        db.prepare(
            'INSERT INTO crisis_alerts (session_id, student_alias, trigger_message, detected_emotion, severity) VALUES (?, ?, ?, ?, ?)'
        ).run(userId, 'Student', 'Predictive alert: behavioral pattern analysis', prediction.riskLevel, prediction.riskLevel);
    }

    res.json(prediction);
});

// ═══════════════════════════════════════════════════
// GAMIFIED HEALING JOURNEY
// ═══════════════════════════════════════════════════

app.get('/api/achievements/:userId', (req, res) => {
    let achievements = db.prepare('SELECT * FROM user_achievements WHERE user_id = ?').all(req.params.userId);

    // Auto-check for new achievements
    const moodCount = db.prepare('SELECT COUNT(*) as c FROM user_mood_entries WHERE user_id = ?').get(req.params.userId)?.c || 0;
    const chatCount = db.prepare('SELECT COUNT(*) as c FROM emotion_logs WHERE session_id = ?').get(req.params.userId)?.c || 0;
    const existingTypes = achievements.map(a => a.achievement_type);

    const newAchievements = [];
    if (moodCount >= 1 && !existingTypes.includes('first_mood')) {
        newAchievements.push({ type: 'first_mood', title: 'First Step 🌱', desc: 'Logged your first mood entry!', icon: '🌱', xp: 10 });
    }
    if (moodCount >= 7 && !existingTypes.includes('week_streak')) {
        newAchievements.push({ type: 'week_streak', title: 'Week Warrior 🔥', desc: 'Logged mood for 7 days!', icon: '🔥', xp: 50 });
    }
    if (chatCount >= 10 && !existingTypes.includes('chat_explorer')) {
        newAchievements.push({ type: 'chat_explorer', title: 'Chat Explorer 💬', desc: 'Had 10 conversations with EmoSense!', icon: '💬', xp: 30 });
    }
    if (chatCount >= 50 && !existingTypes.includes('deep_talker')) {
        newAchievements.push({ type: 'deep_talker', title: 'Deep Talker 🗣️', desc: '50 conversations — building a real bond!', icon: '🗣️', xp: 100 });
    }
    if (moodCount >= 30 && !existingTypes.includes('month_champion')) {
        newAchievements.push({ type: 'month_champion', title: 'Monthly Champion 🏆', desc: 'A full month of mood tracking!', icon: '🏆', xp: 200 });
    }

    const insert = db.prepare('INSERT INTO user_achievements (user_id, achievement_type, title, description, icon, xp_earned) VALUES (?, ?, ?, ?, ?, ?)');
    newAchievements.forEach(a => {
        insert.run(req.params.userId, a.type, a.title, a.desc, a.icon, a.xp);
    });

    // Refresh
    achievements = db.prepare('SELECT * FROM user_achievements WHERE user_id = ? ORDER BY earned_at DESC').all(req.params.userId);
    const totalXp = achievements.reduce((s, a) => s + (a.xp_earned || 0), 0);
    const level = Math.floor(totalXp / 100) + 1;

    res.json({ achievements, totalXp, level, newAchievements: newAchievements.map(a => a.title) });
});

// ═══════════════════════════════════════════════════
// ANONYMOUS VOICE ROOMS
// ═══════════════════════════════════════════════════

const voiceRooms = new Map(); // roomId -> Map<socketId, {alias, role, socketId, handRaised}>
const ROOM_TOPICS = [
    { id: 'anxiety', name: 'Anxiety Support', icon: '😟', description: 'A safe space to discuss anxiety and share coping strategies' },
    { id: 'exams', name: 'Exam Stress', icon: '📚', description: 'Support for academic pressure and exam anxiety' },
    { id: 'relationships', name: 'Relationships', icon: '💔', description: 'Breakups, friendships, and relationship struggles' },
    { id: 'loneliness', name: 'Loneliness', icon: '🥺', description: 'You\'re not alone — connect with others who understand' },
    { id: 'general', name: 'General Support', icon: '💚', description: 'Open discussion for any topic — just talk or listen' },
    { id: 'motivation', name: 'Motivation Corner', icon: '💪', description: 'Uplift each other with encouragement and positivity' }
];

app.get('/api/voice-rooms', (req, res) => {
    const rooms = ROOM_TOPICS.map(topic => {
        const members = voiceRooms.get(topic.id);
        const participantList = members ? Array.from(members.values()).map(p => ({
            alias: p.alias, role: p.role, handRaised: p.handRaised || false, socketId: p.socketId
        })) : [];
        return {
            ...topic,
            participants: participantList.length,
            participantList,
            isActive: participantList.length > 0
        };
    });
    res.json(rooms);
});

// ═══════════════════════════════════════════════════
// AI THERAPIST MATCHING
// ═══════════════════════════════════════════════════

app.post('/api/therapist-match', (req, res) => {
    const { issues, preferences } = req.body;
    if (!issues || !Array.isArray(issues)) return res.status(400).json({ error: 'Issues array required' });

    const counselors = db.prepare(
        'SELECT id, name, gender, photo, specialization, bio, is_online FROM counselors'
    ).all();

    // Score each counselor based on issue overlap with their specialization
    const scored = counselors.map(c => {
        let score = 0;
        const spec = (c.specialization + ' ' + c.bio).toLowerCase();

        issues.forEach(issue => {
            const keywords = issue.toLowerCase().split(/\s+/);
            keywords.forEach(kw => {
                if (spec.includes(kw)) score += 10;
            });
        });

        // Preference bonuses
        if (preferences?.gender && c.gender === preferences.gender) score += 5;
        if (c.is_online) score += 15;

        return { ...c, matchScore: score };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);
    res.json({ matches: scored, totalCounselors: counselors.length });
});

// ═══════════════════════════════════════════════════
// SOCKET.IO — REAL-TIME CHAT
// ═══════════════════════════════════════════════════

const activeCounselors = new Map(); // counselorId -> socketId

io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Counselor connects to dashboard
    socket.on('counselor-online', (data) => {
        const { counselorId } = data;
        activeCounselors.set(counselorId, socket.id);
        db.prepare('UPDATE counselors SET is_online = 1, status = ? WHERE id = ?').run('available', counselorId);
        io.emit('counselor-status', { counselorId, isOnline: true });
        console.log(`[SOCKET] Counselor ${counselorId} is now ONLINE (socket: ${socket.id})`);
    });

    // Student requests chat with counselor
    socket.on('student-request-chat', (data) => {
        const { sessionId, counselorId, alias } = data;
        socket.join(sessionId);

        // Notify counselor
        const counselorSocket = activeCounselors.get(counselorId);
        if (counselorSocket) {
            io.to(counselorSocket).emit('new-chat-request', { sessionId, alias });
        }
    });

    // Emergency user joins their session room
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
    });

    // Counselor accepts chat
    socket.on('counselor-accept-chat', (data) => {
        const { sessionId } = data;
        socket.join(sessionId);

        db.prepare("UPDATE chat_sessions SET status = 'active' WHERE id = ?").run(sessionId);
        io.to(sessionId).emit('chat-accepted', { sessionId });
    });

    // Messages
    socket.on('send-message', (data) => {
        const { sessionId, senderType, content, attachmentUrl, attachmentType, replyToId } = data;

        const result = db.prepare(
            'INSERT INTO messages (session_id, sender_type, content, attachment_url, attachment_type, reply_to_id) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(sessionId, senderType, content, attachmentUrl || null, attachmentType || null, replyToId || null);

        io.to(sessionId).emit('new-message', {
            id: result.lastInsertRowid,
            sessionId,
            senderType,
            content,
            attachmentUrl,
            attachmentType,
            replyToId,
            timestamp: new Date().toISOString()
        });
    });

    // End session
    socket.on('end-session', (data) => {
        const { sessionId } = data;
        db.prepare("UPDATE chat_sessions SET status = 'ended', ended_at = CURRENT_TIMESTAMP WHERE id = ?")
            .run(sessionId);
        io.to(sessionId).emit('session-ended', { sessionId });
    });

    // Call signaling
    socket.on('call-initiate', (data) => {
        const { sessionId, type, counselorId, counselorName } = data;
        io.to(sessionId).emit('incoming-call', { sessionId, type, counselorId, counselorName });
    });

    socket.on('call-accept', (data) => {
        const { sessionId } = data;
        io.to(sessionId).emit('call-accepted', { sessionId });
    });

    socket.on('call-end', (data) => {
        const { sessionId } = data;
        io.to(sessionId).emit('call-ended', { sessionId });
    });

    // WebRTC signaling relay
    socket.on('webrtc-offer', (data) => {
        const { sessionId, offer } = data;
        socket.to(sessionId).emit('webrtc-offer', { sessionId, offer });
    });

    socket.on('webrtc-answer', (data) => {
        const { sessionId, answer } = data;
        socket.to(sessionId).emit('webrtc-answer', { sessionId, answer });
    });

    socket.on('webrtc-ice-candidate', (data) => {
        const { sessionId, candidate } = data;
        socket.to(sessionId).emit('webrtc-ice-candidate', { sessionId, candidate });
    });

    // SOS live location relay
    socket.on('sos-location-update', (data) => {
        io.emit('sos-location-update', data);
    });
    // Disconnect
    socket.on('disconnect', () => {
        // Clean up voice rooms
        for (const [roomId, members] of voiceRooms) {
            const member = members.get(socket.id);
            if (member) {
                members.delete(socket.id);
                if (members.size === 0) voiceRooms.delete(roomId);
                const participantList = members.size > 0 ? Array.from(members.values()).map(p => ({ alias: p.alias, role: p.role, handRaised: p.handRaised || false, socketId: p.socketId })) : [];
                io.to(`room-${roomId}`).emit('room-update', {
                    roomId,
                    participants: members.size,
                    participantList,
                    event: 'leave',
                    user: member.alias,
                    role: member.role
                });
            }
        }

        // Find and remove counselor
        for (const [counselorId, socketId] of activeCounselors) {
            if (socketId === socket.id) {
                activeCounselors.delete(counselorId);
                db.prepare('UPDATE counselors SET is_online = 0 WHERE id = ?').run(counselorId);
                io.emit('counselor-status', { counselorId, isOnline: false });
                break;
            }
        }
    });

    // ──── Voice Room Handlers (WebRTC + Roles) ────
    socket.on('voice-room-join', (data) => {
        const { roomId, alias, role } = data; // role: 'counsellor', 'student', 'anonymous'
        socket.join(`room-${roomId}`);

        if (!voiceRooms.has(roomId)) {
            voiceRooms.set(roomId, new Map());
        }
        voiceRooms.get(roomId).set(socket.id, { alias, role: role || 'anonymous', socketId: socket.id, handRaised: false });

        const members = voiceRooms.get(roomId);
        const participantList = Array.from(members.values()).map(p => ({ alias: p.alias, role: p.role, handRaised: p.handRaised, socketId: p.socketId }));

        io.to(`room-${roomId}`).emit('room-update', {
            roomId,
            participants: members.size,
            participantList,
            event: 'join',
            user: alias,
            role: role || 'anonymous'
        });

        console.log(`[VR] ${alias} (${role || 'anonymous'}) joined ${roomId}. Total: ${members.size}`);
    });

    socket.on('voice-room-leave', (data) => {
        const { roomId, alias } = data;
        socket.leave(`room-${roomId}`);

        if (voiceRooms.has(roomId)) {
            voiceRooms.get(roomId).delete(socket.id);
            const members = voiceRooms.get(roomId);
            if (members.size === 0) voiceRooms.delete(roomId);
            const participantList = members.size > 0 ? Array.from(members.values()).map(p => ({ alias: p.alias, role: p.role, handRaised: p.handRaised, socketId: p.socketId })) : [];

            io.to(`room-${roomId}`).emit('room-update', {
                roomId,
                participants: members.size,
                participantList,
                event: 'leave',
                user: alias
            });
        }
    });

    socket.on('voice-room-msg', (data) => {
        const { roomId, alias, text, role } = data;
        io.to(`room-${roomId}`).emit('room-message', { alias, text, role, timestamp: Date.now() });
    });

    // WebRTC Signaling
    socket.on('webrtc-offer', (data) => {
        const { roomId, targetSocketId, offer } = data;
        io.to(targetSocketId).emit('webrtc-offer', { offer, senderSocketId: socket.id });
    });

    socket.on('webrtc-answer', (data) => {
        const { roomId, targetSocketId, answer } = data;
        io.to(targetSocketId).emit('webrtc-answer', { answer, senderSocketId: socket.id });
    });

    socket.on('webrtc-ice-candidate', (data) => {
        const { roomId, targetSocketId, candidate } = data;
        io.to(targetSocketId).emit('webrtc-ice-candidate', { candidate, senderSocketId: socket.id });
    });

    // Raise hand
    socket.on('voice-room-raise-hand', (data) => {
        const { roomId, alias, raised } = data;
        if (voiceRooms.has(roomId)) {
            const member = voiceRooms.get(roomId).get(socket.id);
            if (member) member.handRaised = raised;
            const members = voiceRooms.get(roomId);
            const participantList = Array.from(members.values()).map(p => ({ alias: p.alias, role: p.role, handRaised: p.handRaised, socketId: p.socketId }));
            io.to(`room-${roomId}`).emit('room-update', { roomId, participants: members.size, participantList, event: 'hand', user: alias, raised });
        }
    });

    // Counselor moderation: mute a participant
    socket.on('voice-room-mute', (data) => {
        const { roomId, targetAlias } = data;
        if (voiceRooms.has(roomId)) {
            const requester = voiceRooms.get(roomId).get(socket.id);
            if (requester && requester.role === 'counsellor') {
                io.to(`room-${roomId}`).emit('room-muted', { targetAlias, by: requester.alias });
            }
        }
    });

    // Counselor moderation: kick a participant
    socket.on('voice-room-kick', (data) => {
        const { roomId, targetAlias } = data;
        if (voiceRooms.has(roomId)) {
            const requester = voiceRooms.get(roomId).get(socket.id);
            if (requester && requester.role === 'counsellor') {
                // Find the target socket and remove them
                for (const [sid, member] of voiceRooms.get(roomId)) {
                    if (member.alias === targetAlias) {
                        voiceRooms.get(roomId).delete(sid);
                        io.to(sid).emit('room-kicked', { by: requester.alias });
                        const s = io.sockets.sockets.get(sid);
                        if (s) s.leave(`room-${roomId}`);
                        break;
                    }
                }
                const members = voiceRooms.get(roomId);
                const participantList = Array.from(members.values()).map(p => ({ alias: p.alias, role: p.role, handRaised: p.handRaised, socketId: p.socketId }));
                io.to(`room-${roomId}`).emit('room-update', { roomId, participants: members.size, participantList, event: 'kick', user: targetAlias });
            }
        }
    });

    // File/media sharing in voice rooms
    socket.on('voice-room-file', (data) => {
        const { roomId, alias, fileUrl, fileType, fileName } = data;
        io.to(`room-${roomId}`).emit('room-file', { alias, fileUrl, fileType, fileName, timestamp: Date.now() });
    });
});

// Serve static files from the public folder (for uploads/assets)
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/counselors', express.static(path.join(__dirname, 'public/counselors')));

// Serve static files from the frontend build
app.use(express.static(path.join(__dirname, 'dist')));

// Non-API routes serve index.html for client-side routing
app.get('*any', (req, res) => {
    if (!req.path.startsWith('/api')) {
        const indexPath = path.join(__dirname, 'dist', 'index.html');
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            res.status(404).send('Frontend not built. Please run "npm run build".');
        }
    }
});

// ═══════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════

server.listen(PORT, () => {
    const provider = claude.getProvider();
    const aiStatus = provider === 'claude' ? '✅ Claude (Anthropic) primary'
        : provider === 'groq' ? '✅ Groq (Llama 3.3 70B) primary'
            : provider === 'gemini' ? '✅ Gemini primary'
                : '⚠️ No API key — using local engine';
    console.log(`\n🧠 EmoSense Backend running on http://localhost:${PORT}`);
    console.log(`   AI Chat: ${aiStatus}`);
    console.log(`   Database: ✅ SQLite ready`);
    console.log(`   Emergency: ${process.env.TWILIO_ACCOUNT_SID ? '✅ Twilio SMS/Call active' : '⚠️ Console-only alerts'}\n`);
});
