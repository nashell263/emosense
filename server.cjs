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
const path = require('path');
const { getDb } = require('./server/database.cjs');
const gemini = require('./server/gemini.cjs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'emosense_secret';

app.use(cors());
app.use(express.json());

// Initialize DB + AI (Groq → Gemini)
const db = getDb();
gemini.initAI({
    groqApiKey: process.env.GROQ_API_KEY,
    geminiKey: process.env.GEMINI_API_KEY
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
    const { message, sessionId, emotionData } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    try {
        if (gemini.isInitialized()) {
            const result = await gemini.chat(sessionId || 'default', message, emotionData || null);
            res.json({ response: result.response, source: result.source });
        } else {
            res.json({ response: null, source: 'local' });
        }
    } catch (err) {
        console.error('AI error:', err.message?.substring(0, 150));
        res.json({ response: null, source: 'local' });
    }
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
    if (!counselor) return res.status(401).json({ error: 'Invalid credentials' });

    if (!bcrypt.compareSync(password, counselor.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Set online
    db.prepare('UPDATE counselors SET is_online = 1 WHERE id = ?').run(counselor.id);

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
        'SELECT id, name, gender, photo, specialization, bio, is_online FROM counselors'
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
// FEEDBACK
// ═══════════════════════════════════════════════════

app.post('/api/feedback', (req, res) => {
    const { sessionType, sessionId, rating, helpful, comment } = req.body;
    if (!sessionType || !rating) return res.status(400).json({ error: 'sessionType and rating required' });

    db.prepare(
        'INSERT INTO feedback (session_type, session_id, rating, helpful, comment) VALUES (?, ?, ?, ?, ?)'
    ).run(sessionType, sessionId || null, rating, helpful ? 1 : 0, comment || '');

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

app.get('/api/crisis/alerts', authMiddleware, (req, res) => {
    const alerts = db.prepare(
        "SELECT ca.*, c.name as acknowledged_by_name FROM crisis_alerts ca LEFT JOIN counselors c ON ca.acknowledged_by = c.id ORDER BY ca.created_at DESC LIMIT 50"
    ).all();
    res.json(alerts);
});

app.put('/api/crisis/alerts/:id/acknowledge', authMiddleware, (req, res) => {
    db.prepare(
        "UPDATE crisis_alerts SET status = 'acknowledged', acknowledged_by = ? WHERE id = ?"
    ).run(req.counselorId, req.params.id);
    res.json({ ok: true });
});

app.put('/api/crisis/alerts/:id/resolve', authMiddleware, (req, res) => {
    db.prepare(
        "UPDATE crisis_alerts SET status = 'resolved', acknowledged_by = ? WHERE id = ?"
    ).run(req.counselorId, req.params.id);
    res.json({ ok: true });
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
// SOCKET.IO — REAL-TIME CHAT
// ═══════════════════════════════════════════════════

const activeCounselors = new Map(); // counselorId -> socketId

io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Counselor connects to dashboard
    socket.on('counselor-online', (data) => {
        const { counselorId } = data;
        activeCounselors.set(counselorId, socket.id);
        db.prepare('UPDATE counselors SET is_online = 1 WHERE id = ?').run(counselorId);
        io.emit('counselor-status', { counselorId, isOnline: true });
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

    // Counselor accepts chat
    socket.on('counselor-accept-chat', (data) => {
        const { sessionId } = data;
        socket.join(sessionId);

        db.prepare("UPDATE chat_sessions SET status = 'active' WHERE id = ?").run(sessionId);
        io.to(sessionId).emit('chat-accepted', { sessionId });
    });

    // Messages
    socket.on('send-message', (data) => {
        const { sessionId, senderType, content } = data;

        db.prepare(
            'INSERT INTO messages (session_id, sender_type, content) VALUES (?, ?, ?)'
        ).run(sessionId, senderType, content);

        io.to(sessionId).emit('new-message', {
            sessionId,
            senderType,
            content,
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

    // Disconnect
    socket.on('disconnect', () => {
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
});

// Serve static files from the frontend build
app.use(express.static(path.join(__dirname, 'dist')));

// Non-API routes serve index.html for client-side routing
app.get('*splat', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    }
});

// ═══════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════

server.listen(PORT, () => {
    const provider = gemini.getProvider();
    const aiStatus = provider === 'groq' ? '✅ Groq (Llama 3.3 70B) active'
        : provider === 'gemini' ? '✅ Gemini active'
            : '⚠️ No API key — using local engine';
    console.log(`\n🧠 EmoSense Backend running on http://localhost:${PORT}`);
    console.log(`   AI Chat: ${aiStatus}`);
    console.log(`   Database: ✅ SQLite ready\n`);
});
