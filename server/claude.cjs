/**
 * EmoSense AI Engine v2 — Two-Layer Hybrid Pipeline
 * Layer 1: Rule-based pre-check + Claude emotion classification
 * Layer 2: Support message generation grounded in detected emotion
 * Falls back: Claude → Groq → Gemini → local
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// ═══════════════════════════════════════════════
// CRISIS KEYWORDS (Rule-based pre-check)
// ═══════════════════════════════════════════════

const CRISIS_PHRASES = [
  'i want to die', 'i want to disappear', 'i want to hurt myself',
  'i want to kill myself', 'no point in living', 'end my life',
  'i can\'t do this anymore', 'i don\'t want to be here',
  'i wish i was dead', 'nobody would miss me', 'better off dead',
  'i\'m going to hurt myself', 'suicide', 'self-harm', 'cut myself',
  'overdose', 'i give up on life', 'there is no hope',
  'i feel like ending it', 'jump off', 'hang myself'
];

const DISTRESS_KEYWORDS = {
  stress: ['stressed', 'overwhelmed', 'pressure', 'burnout', 'exhausted', 'overloaded', 'deadline', 'too much work'],
  anxiety: ['anxious', 'worried', 'panic', 'nervous', 'fear', 'scared', 'can\'t breathe', 'racing thoughts', 'restless'],
  low_mood: ['depressed', 'sad', 'hopeless', 'empty', 'numb', 'crying', 'worthless', 'useless', 'no energy'],
  loneliness: ['lonely', 'alone', 'isolated', 'no friends', 'nobody cares', 'abandoned', 'left out'],
  frustration: ['angry', 'frustrated', 'furious', 'annoyed', 'unfair', 'hate', 'sick of']
};

// ═══════════════════════════════════════════════
// PROMPTS
// ═══════════════════════════════════════════════

const PERSONALITY_PROMPTS = {
  gentle: `PERSONALITY: GENTLE 🌸 — Speak softly, compassionately. Use phrases like "I'm here for you", "Take your time". Offer comfort before solutions.`,
  motivational: `PERSONALITY: MOTIVATIONAL 💪 — Be energizing, uplifting. Challenge negative self-talk constructively. Frame struggles as growth.`,
  logical: `PERSONALITY: LOGICAL 🧠 — Be analytical, structured. Break problems into steps. Reference CBT techniques. Validate briefly then problem-solve.`
};

const LANGUAGE_PROMPTS = {
  en: `Respond in clear, conversational English.`,
  sn: `Respond in Shona with English mixed naturally. Use: "Mhoro shamwari", "Ndiri kunzwa", "Usazvitambudza", "Zvichanaka".`,
  nd: `Respond in Ndebele with English mixed naturally. Use: "Sawubona mngane", "Ngiyakuzwa", "Ungakhathazeki", "Kuzalunga".`
};

const EMOTION_DETECTION_PROMPT = `You are an expert mental health emotion classifier for university students.
Analyze the student's message and return ONLY valid JSON (no markdown):
{
  "primary_emotion": "stress" | "anxiety" | "low mood" | "neutral" | "frustration" | "loneliness",
  "secondary_emotion": string or null,
  "risk_level": "low" | "moderate" | "high",
  "confidence": number 0-1,
  "intensity": "low" | "moderate" | "high",
  "evidence": ["phrase1", "phrase2"],
  "trigger_theme": "academics" | "relationships" | "loneliness" | "family" | "finances" | "uncertainty" | "general",
  "recommended_tone": "calm, supportive, non-judgmental"
}
Rules:
- Classify into: stress, anxiety, low mood, neutral, frustration, loneliness
- Flag risk_level "high" if self-harm, hopelessness, panic, abuse, or crisis language
- DO NOT diagnose mental illness
- Identify evidence phrases from user text
- Estimate intensity based on language severity`;

const SUPPORT_GENERATION_PROMPT = `You are EmoSense, a mental health companion for MSU Zimbabwe students.

EMOTION CLASSIFICATION (from analysis):
{{emotionJson}}

EMOTION PATTERN (last messages):
{{patternData}}

RULES:
1. EMPATHY FIRST — acknowledge the emotion BEFORE offering advice
2. Generate a warm, brief, student-friendly response (2-3 paragraphs)
3. Suggest 2-4 practical self-help steps matched to BOTH emotion AND trigger:
   - Stress + academics → time-blocking, short breaks, breathing, reduce overload
   - Anxiety + uncertainty → grounding exercise, reduce catastrophizing, one-step action plan
   - Low mood + isolation → gentle activity, message a friend, sunlight/walk, counselor option
   - Frustration + relationships → perspective-taking, boundary setting, journaling
   - Loneliness + any → reach out to one person, join a group activity, voice room suggestion
4. If risk_level is "high" → STOP normal advice, show crisis message, urge Emergency Help button or counselor
5. DO NOT diagnose mental illness
6. If pattern shows repeated distress (3+ negative), mention the pattern gently and suggest professional support
7. Use local context: MSU, exam pressure, res life, kombis

{{personalityPrompt}}
{{languagePrompt}}

If crisis, ALWAYS suggest clicking Emergency Help button or contacting a counselor.`;

const CRISIS_SYSTEM_PROMPT = `You are EmoSense Emergency Support for a Zimbabwe university student who pressed SOS.
GOAL: Keep them CALM, GROUNDED, SAFE while waiting for a human counselor (1-3 mins).
RULES:
1. Prioritize physical safety
2. Provide grounding: "5-4-3-2-1 technique" or breathing: "in 4s, hold 4s, out 4s"
3. Do NOT diagnose or solve problems
4. Keep responses SHORT (1-2 paragraphs)
5. Blend English with Shona: "Ndiri pano", "Zvinhu zvichanaka", "Usaora moyo"`;

const MEMORY_EXTRACTION_PROMPT = `Extract key personal info from this conversation turn.
Return JSON array of strings. Example: ["Student is Level 2.2 Law", "Has sister named Tariro"]
If nothing found, return [].
User: {{userMessage}}
AI: {{aiResponse}}`;

// ═══════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════

const conversationHistories = new Map();
let claudeApiKey = null;
let groqKey = null;
let geminiModel = null;
let activeProvider = null;

// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════

function initAI(config) {
  const { anthropicKey, geminiKey, groqApiKey } = config;
  const isReal = (key) => key && !key.includes('your_') && !key.includes('_here') && key.length > 10;

  if (isReal(anthropicKey)) { claudeApiKey = anthropicKey; activeProvider = 'claude'; console.log('✅ Claude AI (Anthropic) initialized — primary provider'); }
  if (isReal(groqApiKey)) { groqKey = groqApiKey; if (!activeProvider) activeProvider = 'groq'; console.log(`✅ Groq AI (Llama 3.3 70B) initialized${activeProvider === 'groq' ? '' : ' (fallback)'}`); }
  if (isReal(geminiKey)) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      if (!activeProvider) activeProvider = 'gemini';
      console.log(`✅ Gemini AI initialized${activeProvider === 'gemini' ? '' : ' (fallback)'}`);
    } catch (err) { console.log('⚠️ Gemini init failed:', err.message); }
  }
  if (!activeProvider) console.log('⚠️ No valid AI provider configured — add a real API key to .env');
  return activeProvider !== null;
}

// ═══════════════════════════════════════════════
// API CALLERS
// ═══════════════════════════════════════════════

async function claudeChat(systemPrompt, messages) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': claudeApiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1500, system: systemPrompt, messages, temperature: 0.85, top_p: 0.92 })
  });
  if (!response.ok) { const err = await response.text(); throw new Error(`Claude ${response.status}: ${err.substring(0, 200)}`); }
  const data = await response.json();
  return data.content[0].text;
}

async function groqChat(messages) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, temperature: 0.85, max_tokens: 1200, top_p: 0.92 })
  });
  if (!response.ok) { const err = await response.text(); throw new Error(`Groq ${response.status}: ${err.substring(0, 200)}`); }
  const data = await response.json();
  return data.choices[0].message.content;
}

async function aiCall(systemPrompt, userContent) {
  if (claudeApiKey) {
    try { return { text: await claudeChat(systemPrompt, [{ role: 'user', content: userContent }]), source: 'claude' }; } catch (e) { console.log('Claude error:', e.message?.substring(0, 100)); }
  }
  if (groqKey) {
    try { return { text: await groqChat([{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }]), source: 'groq' }; } catch (e) { console.log('Groq error:', e.message?.substring(0, 100)); }
  }
  if (geminiModel) {
    try { const r = await geminiModel.generateContent(`${systemPrompt}\n\nUser: ${userContent}`); return { text: r.response.text(), source: 'gemini' }; } catch (e) { console.log('Gemini error:', e.message?.substring(0, 100)); }
  }
  return null;
}

// ═══════════════════════════════════════════════
// RULE-BASED PRE-CHECK
// ═══════════════════════════════════════════════

function crisisPreCheck(text) {
  const lower = text.toLowerCase();
  for (const phrase of CRISIS_PHRASES) {
    if (lower.includes(phrase)) {
      return { isCrisis: true, matchedPhrase: phrase, riskLevel: 'high' };
    }
  }

  // Check distress keywords
  let maxScore = 0; let detectedEmotion = 'neutral';
  for (const [emotion, keywords] of Object.entries(DISTRESS_KEYWORDS)) {
    const score = keywords.filter(kw => lower.includes(kw)).length;
    if (score > maxScore) { maxScore = score; detectedEmotion = emotion; }
  }

  return { isCrisis: false, matchedPhrase: null, riskLevel: maxScore >= 3 ? 'moderate' : 'low', preDetectedEmotion: detectedEmotion, distressScore: maxScore };
}

// ═══════════════════════════════════════════════
// PATTERN ENGINE
// ═══════════════════════════════════════════════

function analyzeEmotionPatterns(sessionId) {
  try {
    const { getDb } = require('./database.cjs');
    const db = getDb();
    const recent = db.prepare(
      'SELECT detected_emotion, secondary_emotion, intensity, confidence, risk_level, trigger_theme, created_at FROM emotion_assessments WHERE session_id = ? ORDER BY created_at DESC LIMIT 10'
    ).all(sessionId);

    if (recent.length < 2) return { hasPattern: false, messageCount: recent.length, trend: 'insufficient_data' };

    const emotions = recent.map(r => r.detected_emotion);
    const negativeEmotions = ['stress', 'anxiety', 'low mood', 'frustration', 'loneliness'];
    const negCount = emotions.filter(e => negativeEmotions.includes(e)).length;
    const consecutiveNeg = emotions.findIndex(e => !negativeEmotions.includes(e));
    const streak = consecutiveNeg === -1 ? emotions.length : consecutiveNeg;

    // Dominant emotion
    const freq = {};
    emotions.forEach(e => { freq[e] = (freq[e] || 0) + 1; });
    const dominant = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];

    // Intensity trend
    const intensities = recent.map(r => r.intensity === 'high' ? 3 : r.intensity === 'moderate' ? 2 : 1);
    const recentAvg = intensities.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(3, intensities.length);
    const olderAvg = intensities.slice(3).reduce((a, b) => a + b, 0) / Math.max(1, intensities.slice(3).length);
    const trend = recentAvg > olderAvg + 0.3 ? 'worsening' : recentAvg < olderAvg - 0.3 ? 'improving' : 'stable';

    return {
      hasPattern: negCount >= 3,
      messageCount: recent.length,
      negativeRatio: Math.round((negCount / recent.length) * 100),
      consecutiveNegative: streak,
      dominantEmotion: dominant[0],
      dominantCount: dominant[1],
      trend,
      recentTriggers: [...new Set(recent.filter(r => r.trigger_theme).map(r => r.trigger_theme))],
      riskEscalating: streak >= 4 && trend === 'worsening'
    };
  } catch (e) {
    return { hasPattern: false, error: e.message };
  }
}

// ═══════════════════════════════════════════════
// LAYER 1: EMOTION DETECTION
// ═══════════════════════════════════════════════

async function detectEmotion(userMessage, sessionId, preCheck) {
  // If crisis pre-check triggered, return immediately
  if (preCheck.isCrisis) {
    return {
      primary_emotion: 'crisis',
      secondary_emotion: null,
      risk_level: 'high',
      confidence: 0.99,
      intensity: 'high',
      evidence: [preCheck.matchedPhrase],
      trigger_theme: 'crisis',
      recommended_tone: 'urgent, calming, grounding',
      source: 'rule_engine'
    };
  }

  // Call AI for nuanced classification
  const result = await aiCall(EMOTION_DETECTION_PROMPT, userMessage);
  if (result) {
    try {
      let raw = result.text;
      if (raw.includes('```json')) raw = raw.split('```json')[1].split('```')[0].trim();
      else if (raw.includes('```')) raw = raw.split('```')[1].split('```')[0].trim();
      const parsed = JSON.parse(raw);

      // Backend confidence threshold: if AI confidence < 0.4, fall back to rule-based
      if (parsed.confidence < 0.4 && preCheck.distressScore > 0) {
        parsed.primary_emotion = preCheck.preDetectedEmotion.replace('_', ' ');
        parsed.confidence = 0.5;
      }

      parsed.source = result.source;
      return parsed;
    } catch (e) {
      console.error('Layer 1 JSON parse error:', e.message);
    }
  }

  // Fallback to rule-based
  return {
    primary_emotion: preCheck.preDetectedEmotion?.replace('_', ' ') || 'neutral',
    secondary_emotion: null,
    risk_level: preCheck.riskLevel,
    confidence: 0.5,
    intensity: preCheck.distressScore >= 3 ? 'high' : preCheck.distressScore >= 1 ? 'moderate' : 'low',
    evidence: [],
    trigger_theme: 'general',
    recommended_tone: 'calm, supportive',
    source: 'rule_fallback'
  };
}

// ═══════════════════════════════════════════════
// LAYER 2: SUPPORT GENERATION
// ═══════════════════════════════════════════════

async function generateSupport(sessionId, userMessage, emotionJson, patternData, options = {}) {
  const personalityPrompt = PERSONALITY_PROMPTS[options.personalityMode || 'gentle'] || PERSONALITY_PROMPTS.gentle;
  const languagePrompt = LANGUAGE_PROMPTS[options.language || 'en'] || LANGUAGE_PROMPTS.en;

  const dynamicPrompt = SUPPORT_GENERATION_PROMPT
    .replace('{{emotionJson}}', JSON.stringify(emotionJson, null, 2))
    .replace('{{patternData}}', JSON.stringify(patternData, null, 2))
    .replace('{{personalityPrompt}}', personalityPrompt)
    .replace('{{languagePrompt}}', languagePrompt);

  // Get conversation history
  if (!conversationHistories.has(sessionId)) conversationHistories.set(sessionId, []);
  const history = conversationHistories.get(sessionId);

  // Retrieve memories
  let memoryPart = '';
  try {
    const { getDb } = require('./database.cjs');
    const db = getDb();
    const rows = db.prepare('SELECT content FROM user_memories WHERE user_id = ? ORDER BY created_at DESC LIMIT 5').all(sessionId);
    if (rows.length > 0) memoryPart = `[Memories: ${rows.map(r => r.content).join('; ')}]\n\n`;
  } catch (e) {}

  const enrichedMessage = `${memoryPart}${userMessage}`;
  let response = '', source = '';

  // Try Claude
  if (claudeApiKey) {
    try {
      const msgs = history.map(h => ({ role: h.role === 'model' ? 'assistant' : h.role, content: h.parts?.[0]?.text || h.content || '' }));
      msgs.push({ role: 'user', content: enrichedMessage });
      response = await claudeChat(dynamicPrompt, msgs);
      source = 'claude';
    } catch (e) { console.log('Claude L2 error:', e.message?.substring(0, 80)); }
  }

  // Groq fallback
  if (!response && groqKey) {
    try {
      const msgs = [{ role: 'system', content: dynamicPrompt }, ...history.map(h => ({ role: h.role === 'model' ? 'assistant' : h.role, content: h.parts?.[0]?.text || h.content || '' })), { role: 'user', content: enrichedMessage }];
      response = await groqChat(msgs);
      source = 'groq';
    } catch (e) {}
  }

  // Gemini fallback
  if (!response && geminiModel) {
    try {
      const r = await geminiModel.generateContent(`${dynamicPrompt}\n\nUser: ${enrichedMessage}`);
      response = r.response.text();
      source = 'gemini';
    } catch (e) {}
  }

  if (!response) throw new Error('All AI providers failed');

  // Update history
  history.push({ role: 'user', parts: [{ text: userMessage }] }, { role: 'model', parts: [{ text: response }] });
  if (history.length > 40) history.splice(0, history.length - 40);

  return { response, source };
}

// ═══════════════════════════════════════════════
// MAIN CHAT — FULL PIPELINE
// ═══════════════════════════════════════════════

async function chat(sessionId, userMessage, fallbackEmotionData, options = {}) {
  if (!activeProvider) throw new Error('No AI provider initialized');

  // ── Step 1: Pre-processing ──
  const rawMessage = userMessage;
  const normalized = userMessage.trim();

  // ── Step 2: Rule-based crisis pre-check ──
  const preCheck = crisisPreCheck(normalized);

  // Log crisis keyword match
  if (preCheck.isCrisis) {
    logRiskFlag(sessionId, 'keyword_match', preCheck.matchedPhrase, 'crisis', 'high', 'crisis_pathway_activated');
  }

  // ── Step 3: Layer 1 — Emotion Detection ──
  const emotionJson = await detectEmotion(normalized, sessionId, preCheck);

  // Save to DB
  saveEmotionAssessment(sessionId, emotionJson);

  // ── Step 4: Pattern Engine ──
  const patternData = analyzeEmotionPatterns(sessionId);

  // Check if pattern escalation is needed
  if (patternData.riskEscalating && emotionJson.risk_level !== 'high') {
    emotionJson.risk_level = 'moderate';
    logRiskFlag(sessionId, 'pattern_escalation', `${patternData.consecutiveNegative} consecutive negative`, patternData.dominantEmotion, 'moderate', 'pattern_warning_added');
  }

  // ── Step 5: Layer 2 — Support Generation ──
  const { response, source } = await generateSupport(sessionId, normalized, emotionJson, patternData, options);

  // ── Step 6: Save support recommendation ──
  saveSupportRecommendation(sessionId, emotionJson, response);

  // ── Step 7: Crisis trigger if high risk ──
  if (emotionJson.risk_level === 'high') {
    triggerSOSFromChat(sessionId, rawMessage, emotionJson);
  }

  // ── Background: Memory extraction ──
  extractAndSaveMemory(sessionId, rawMessage, response).catch(() => {});

  // ── Step 8: Growth stats ──
  let petStats = fallbackEmotionData?.stats || { relationship_level: 1 };
  try {
    const growth = require('./growth-engine.cjs');
    petStats = await growth.updatePetStats(sessionId, rawMessage, emotionJson.primary_emotion === 'neutral' ? 'positive' : 'neutral');
  } catch (e) {}

  return {
    response,
    source,
    emotion: {
      ...emotionJson,
      pattern: patternData
    },
    petStats
  };
}

// ═══════════════════════════════════════════════
// DB HELPERS
// ═══════════════════════════════════════════════

function saveEmotionAssessment(sessionId, emo) {
  try {
    const { getDb } = require('./database.cjs');
    const db = getDb();
    db.prepare(
      'INSERT INTO emotion_assessments (session_id, detected_emotion, secondary_emotion, intensity, confidence, risk_level, trigger_theme, evidence, recommended_tone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(sessionId, emo.primary_emotion || 'neutral', emo.secondary_emotion || null, emo.intensity || 'moderate', emo.confidence || 0, emo.risk_level || 'low', emo.trigger_theme || 'general', JSON.stringify(emo.evidence || []), emo.recommended_tone || '');
  } catch (e) { console.error('saveEmotionAssessment:', e.message); }
}

function saveSupportRecommendation(sessionId, emo, responseText) {
  try {
    const { getDb } = require('./database.cjs');
    const db = getDb();
    db.prepare(
      'INSERT INTO support_recommendations (session_id, recommended_tone, support_message, escalated, emotion_context, trigger_theme) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(sessionId, emo.recommended_tone || '', responseText.substring(0, 2000), emo.risk_level === 'high' ? 1 : 0, emo.primary_emotion || 'neutral', emo.trigger_theme || 'general');
  } catch (e) { console.error('saveSupportRecommendation:', e.message); }
}

function logRiskFlag(sessionId, flagType, phrase, emotion, level, action) {
  try {
    const { getDb } = require('./database.cjs');
    const db = getDb();
    db.prepare(
      'INSERT INTO risk_flags (session_id, flag_type, trigger_phrase, detected_emotion, risk_level, action_taken) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(sessionId, flagType, phrase, emotion, level, action);
  } catch (e) { console.error('logRiskFlag:', e.message); }
}

function triggerSOSFromChat(sessionId, userMessage, emotionJson) {
  try {
    const { getDb } = require('./database.cjs');
    const emergencyManager = require('./emergency-manager.cjs');
    const db = getDb();
    const alias = 'Student-' + Math.floor(1000 + Math.random() * 9000);
    const result = db.prepare(
      'INSERT INTO crisis_alerts (session_id, student_alias, trigger_message, detected_emotion, severity, contact_method) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(sessionId, alias, userMessage.substring(0, 500), emotionJson.primary_emotion, 'high', 'chat');
    const alert = db.prepare('SELECT * FROM crisis_alerts WHERE id = ?').get(result.lastInsertRowid);
    emergencyManager.triggerSOS(alert);
  } catch (e) { console.error('triggerSOSFromChat:', e.message); }
}

// ═══════════════════════════════════════════════
// CRISIS SUPPORT
// ═══════════════════════════════════════════════

async function getCrisisSupport(message, history = []) {
  const msgs = history.slice(-4).map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }));
  msgs.push({ role: 'user', content: message });

  if (claudeApiKey) { try { return await claudeChat(CRISIS_SYSTEM_PROMPT, msgs); } catch (e) {} }
  if (groqKey) { try { return await groqChat([{ role: 'system', content: CRISIS_SYSTEM_PROMPT }, ...msgs]); } catch (e) {} }
  if (geminiModel) { try { const r = await geminiModel.generateContent(`${CRISIS_SYSTEM_PROMPT}\n\nUser: ${message}`); return r.response.text(); } catch (e) {} }
  return "Ndiri pano. Ndokumbirawo ufeme zvishoma nezvishoma. Help is on the way. (I am here. Please breathe slowly.)";
}

// ═══════════════════════════════════════════════
// MEMORY EXTRACTION
// ═══════════════════════════════════════════════

async function extractAndSaveMemory(sessionId, userMessage, aiResponse) {
  if (!sessionId || sessionId === 'default') return;
  try {
    const prompt = MEMORY_EXTRACTION_PROMPT.replace('{{userMessage}}', userMessage).replace('{{aiResponse}}', aiResponse);
    const result = await aiCall('Extract memories. Return only valid JSON array.', prompt);
    if (!result) return;
    let extracted = [];
    try { extracted = JSON.parse(result.text.substring(result.text.indexOf('['), result.text.lastIndexOf(']') + 1)); } catch (e) { return; }
    if (!Array.isArray(extracted) || extracted.length === 0) return;

    const { getDb } = require('./database.cjs');
    const db = getDb();
    const existing = db.prepare('SELECT content FROM user_memories WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(sessionId);
    const existingLower = existing.map(e => e.content.toLowerCase());
    const insert = db.prepare('INSERT INTO user_memories (user_id, content, importance) VALUES (?, ?, ?)');
    extracted.forEach(m => {
      const lower = m.toLowerCase();
      if (!existingLower.some(e => e.includes(lower) || lower.includes(e))) {
        insert.run(sessionId, m, m.length > 50 ? 3 : m.length > 20 ? 2 : 1);
      }
    });
  } catch (e) {}
}

async function generateCalmingResponse(message, history) {
  if (!activeProvider) return "I'm here with you. Just keep breathing. Help is on the way.";

  const systemPrompt = `You are EmoSense SOS, a specialized emergency stabilization AI. A student is in distress and waiting for a human counselor to connect (1-2 minutes).
Your ONLY goal is to keep the student calm, present, and safe until the human arrives.
DO NOT offer solutions, advice, or therapy.
DO use grounding techniques (e.g., 5-4-3-2-1 method, deep breathing, focusing on the present).
DO be extremely empathetic, warm, and concise. Keep responses under 3 sentences.
Always end with a gentle reassurance that help is almost here.`;

  const msgs = (history || []).slice(-4).map(h => ({ role: h.sender === 'user' ? 'user' : 'assistant', content: h.text }));
  msgs.push({ role: 'user', content: message });

  try {
    if (claudeApiKey) {
      return await claudeChat(systemPrompt, msgs);
    } else if (groqKey) {
      return await groqChat([{ role: 'system', content: systemPrompt }, ...msgs]);
    } else if (geminiModel) {
      const r = await geminiModel.generateContent(`${systemPrompt}\n\nUser: ${message}`);
      return r.response.text();
    }
  } catch (err) {
    console.error("SOS AI Error:", err.message);
  }
  return "I'm here with you. Just keep breathing. Help is on the way.";
}

function clearSession(sessionId) { conversationHistories.delete(sessionId); }
function isInitialized() { return activeProvider !== null; }
function getProvider() { return activeProvider; }

module.exports = { initAI, chat, clearSession, isInitialized, getProvider, getCrisisSupport, analyzeEmotionPatterns, crisisPreCheck, generateCalmingResponse };
