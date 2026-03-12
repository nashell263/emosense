/**
 * EmoSense AI Engine — Multi-Provider
 * Tries: Groq (Llama 3.3 70B) → Gemini → throws error
 * Uses the same deep therapeutic system prompt across all providers.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

const SYSTEM_PROMPT = `You are EmoSense AI Companion — a warm, deeply human-like digital friend for students at Midlands State University (MSU), Zimbabwe. You are NOT just a chatbot; you are a caring companion who remembers, understands, and supports.

PERSONALITY & TONE:
- WARMTH: Speak like a real human friend. Use phrases like "I hear you," "I was just thinking about what you said earlier," or "That sounds tough, how's that been affecting you?"
- EMPATHY FIRST: Always acknowledge the emotion BEFORE offering advice. If a student is hurting, stay in that space with them for a moment.
- ENGAGEMENT: Ask thoughtful follow-up questions that show you're listening.
- HUMANNESS: Vary your sentence structure. Avoid robotic lists. Use subtle Zimbabwean cultural nuances (e.g., mentioning "kombis", university life at MSU Gweru/Zvishavane, or local student challenges).
- PROFESSIONAL BOUNDARY: While a friend, maintain the wisdom of a counselor. If a student is in crisis, prioritize safety.

THERAPEUTIC APPROACH:
1. VALIDATE: Mirror their feelings using their own words. Name emotions they haven't expressed. Say "I hear you" or "That sounds incredibly heavy." NEVER say "don't worry" or "cheer up."
2. EXPLORE: Ask ONE powerful open-ended question using "what" or "how".
3. INSIGHT: Name psychological patterns (catastrophizing, all-or-nothing thinking).
4. TECHNIQUE: Give ONE specific, immediately usable technique (5-4-3-2-1, HALT, TIPP, etc.).
5. EMPOWER: Remind them of their courage. Plant hope without dismissing pain.

MEMORY & CONTEXT:
- You will be provided with [Memory] and [Context] blocks. Use them to personalize your response.
- Example: "You mentioned last time that you were worried about your fees—did you manage to visit the Financial Aid office?"

CRISIS/SELF-HARM:
- Contacts: MSU Counseling (Student Affairs), Emergency 999/112, Befrienders Zimbabwe +263 4 790 652.
- Always ask "Are you safe right now?" if risk is detected.

You are a lifeline. Honor every student's courage with depth, warmth, and genuine care.`;

const MEMORY_EXTRACTION_PROMPT = `Analyze the following conversation turn and extract key personal information about the student (preferences, interests, life events, names mentioned) that should be remembered for future sessions.
Format: JSON array of strings. Example: ["Student is a Level 2.2 Law student", "Has a sister named Tariro", "Loves playing football at MSU grounds"]
If nothing significant is found, return [].

User: {{userMessage}}
AI: {{aiResponse}}`;

// ═══════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════

const conversationHistories = new Map(); // sessionId -> messages[]
let groqKey = null;
let geminiModel = null;
let activeProvider = null;

// ═══════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════

function initAI(config) {
    const { geminiKey, groqApiKey } = config;

    // Try Groq first (best free tier)
    if (groqApiKey) {
        groqKey = groqApiKey;
        activeProvider = 'groq';
        console.log('✅ Groq AI (Llama 3.3 70B) initialized');
    }

    // Also init Gemini as fallback
    if (geminiKey) {
        try {
            const genAI = new GoogleGenerativeAI(geminiKey);
            geminiModel = genAI.getGenerativeModel({
                model: 'gemini-2.0-flash',
                systemInstruction: SYSTEM_PROMPT
            });
            if (!activeProvider) activeProvider = 'gemini';
            console.log('✅ Gemini AI initialized (fallback)');
        } catch (err) {
            console.log('⚠️ Gemini init failed:', err.message);
        }
    }

    return activeProvider !== null;
}

// ═══════════════════════════════════════════════
// GROQ CHAT (OpenAI-compatible API)
// ═══════════════════════════════════════════════

async function groqChat(messages) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages,
            temperature: 0.85,
            max_tokens: 1200,
            top_p: 0.92
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Groq API error ${response.status}: ${err.substring(0, 200)}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// ═══════════════════════════════════════════════
// GEMINI CHAT
// ═══════════════════════════════════════════════

async function geminiChat(history, enrichedMessage, userMessage) {
    const chatSession = geminiModel.startChat({
        history,
        generationConfig: {
            temperature: 0.85,
            topP: 0.92,
            topK: 50,
            maxOutputTokens: 1200,
        }
    });

    const result = await chatSession.sendMessage(enrichedMessage);
    return result.response.text();
}

// ═══════════════════════════════════════════════
// MAIN CHAT FUNCTION (tries Groq → Gemini)
// ═══════════════════════════════════════════════

async function chat(sessionId, userMessage, emotionData) {
    if (!activeProvider) throw new Error('No AI provider initialized');

    if (!conversationHistories.has(sessionId)) {
        conversationHistories.set(sessionId, []);
    }

    // Build emotion-enriched message with memory awareness
    let enrichedMessage = userMessage;

    // Retrieve memories if sessionId looks like a user ID
    let memories = [];
    try {
        const { getDb } = require('./database.cjs');
        const db = getDb();
        const rows = db.prepare('SELECT content FROM user_memories WHERE user_id = ? ORDER BY created_at DESC LIMIT 5').all(sessionId);
        memories = rows.map(r => r.content);
    } catch (e) {
        console.log('Memory fetch error:', e.message);
    }

    const emotionPart = emotionData && emotionData.dominantEmotion && emotionData.dominantEmotion !== 'neutral'
        ? `[Emotion: ${emotionData.dominantEmotion} (${emotionData.confidence}%)${emotionData.isCrisis ? ', ⚠️ CRISIS' : ''}]`
        : '';

    const memoryPart = memories.length > 0
        ? `[Memories: ${memories.join('; ')}]`
        : '';

    enrichedMessage = `${emotionPart} ${memoryPart}\n\n${userMessage}`;

    // Try Groq first
    if (groqKey) {
        try {
            // Build OpenAI-format messages
            const messages = [
                { role: 'system', content: SYSTEM_PROMPT },
                ...history.map(h => ({
                    role: h.role === 'model' ? 'assistant' : h.role,
                    content: h.parts?.[0]?.text || h.content || ''
                })),
                { role: 'user', content: enrichedMessage }
            ];

            const response = await groqChat(messages);

            // Save to history
            history.push(
                { role: 'user', parts: [{ text: userMessage }] },
                { role: 'model', parts: [{ text: response }] }
            );
            if (history.length > 40) history.splice(0, history.length - 40);

            // Trigger background memory extraction
            extractAndSaveMemory(sessionId, userMessage, response).catch(() => { });

            return { response, source: 'groq' };
        } catch (err) {
            console.log('Groq error:', err.message?.substring(0, 150));
            // Fall through to Gemini
        }
    }

    // Try Gemini as fallback
    if (geminiModel) {
        try {
            const geminiHistory = history.filter(h => h.role && h.parts);
            const response = await geminiChat(geminiHistory, enrichedMessage, userMessage);

            // Save to history
            history.push(
                { role: 'user', parts: [{ text: userMessage }] },
                { role: 'model', parts: [{ text: response }] }
            );
            if (history.length > 40) history.splice(0, history.length - 40);

            // Trigger background memory extraction
            extractAndSaveMemory(sessionId, userMessage, response).catch(() => { });

            return { response, source: 'gemini' };
        } catch (err) {
            console.log('Gemini error:', err.message?.substring(0, 150));
            throw err;
        }
    }

    throw new Error('All AI providers failed');
}

/**
 * Extract personal details from chat turn and save to DB.
 */
async function extractAndSaveMemory(sessionId, userMessage, aiResponse) {
    if (!sessionId || sessionId === 'default') return;

    try {
        const prompt = MEMORY_EXTRACTION_PROMPT
            .replace('{{userMessage}}', userMessage)
            .replace('{{aiResponse}}', aiResponse);

        let extracted = [];
        if (activeProvider === 'groq') {
            const res = await groqChat([{ role: 'user', content: prompt }]);
            try { extracted = JSON.parse(res.substring(res.indexOf('['), res.lastIndexOf(']') + 1)); } catch (e) { }
        } else if (geminiModel) {
            const result = await geminiModel.generateContent(prompt);
            const res = result.response.text();
            try { extracted = JSON.parse(res.substring(res.indexOf('['), res.lastIndexOf(']') + 1)); } catch (e) { }
        }

        if (Array.isArray(extracted) && extracted.length > 0) {
            const { getDb } = require('./database.cjs');
            const db = getDb();
            const insert = db.prepare('INSERT INTO user_memories (user_id, content) VALUES (?, ?)');
            extracted.forEach(m => insert.run(sessionId, m));
        }
    } catch (err) {
        console.log('Memory extraction error:', err.message);
    }
}

function clearSession(sessionId) {
    conversationHistories.delete(sessionId);
}

function isInitialized() {
    return activeProvider !== null;
}

function getProvider() {
    return activeProvider;
}

module.exports = { initAI, chat, clearSession, isInitialized, getProvider };
