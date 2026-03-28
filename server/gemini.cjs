/**
 * EmoSense AI Engine — Multi-Provider with Personality & Language Support
 * Tries: Groq (Llama 3.3 70B) → Gemini → throws error
 * Features: personality adaptation, Shona/Ndebele/English, memory-aware prompting,
 * coping technique integration, first-responder capability.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// ═══════════════════════════════════════════════
// PERSONALITY MODES
// ═══════════════════════════════════════════════

const PERSONALITY_PROMPTS = {
    gentle: `PERSONALITY MODE: GENTLE 🌸
- Speak softly and compassionately, like a warm, nurturing friend.
- Use phrases like "I'm here for you", "Take your time", "It's okay to feel this way".
- Avoid being pushy or directive. Let the student lead the conversation.
- Offer comfort before solutions. Sit with their pain before trying to fix it.
- Use gentle metaphors: "Sometimes healing is like a gentle rain — it comes slowly".`,

    motivational: `PERSONALITY MODE: MOTIVATIONAL 💪
- Be an energizing, uplifting force. Like a coach who believes in them fiercely.
- Use phrases like "You've got this!", "Look how far you've come!", "I see strength in you".
- Challenge negative self-talk constructively. "Is that really true, or is your brain lying to you?"
- Share motivational perspectives. Frame struggles as growth opportunities.
- Be direct but caring. Push them forward while having their back.`,

    logical: `PERSONALITY MODE: LOGICAL 🧠
- Be analytical, structured, and solution-focused.
- Break problems into manageable steps. Use numbered lists and frameworks.
- Reference evidence-based techniques: CBT thought records, behavioral activation, exposure hierarchies.
- Validate emotions briefly, then pivot to problem-solving.
- Use phrases like "Let's break this down", "Here's what the research says", "Step 1 would be...".
- Appeal to rationality: "What evidence supports this thought? What evidence contradicts it?"`
};

const LANGUAGE_PROMPTS = {
    en: `LANGUAGE: English. Respond in clear, conversational English.`,
    sn: `LANGUAGE: Shona (chiShona). Respond primarily in Shona with English mixed in naturally (as Zimbabweans actually speak).
Use common Shona phrases: "Mhoro shamwari yangu" (Hello my friend), "Ndiri kunzwa" (I understand), 
"Usazvitambudza" (Don't stress yourself), "Zvichanaka" (It will be okay), "Ndinokuda" (I care about you).
Keep clinical/technical terms in English but wrap explanations in Shona. Code-switch naturally like a real MSU student would.`,
    nd: `LANGUAGE: Ndebele (isiNdebele). Respond primarily in Ndebele with English mixed in naturally.
Use common Ndebele phrases: "Sawubona mngane wami" (Hello my friend), "Ngiyakuzwa" (I understand),
"Ungakhathazeki" (Don't worry), "Kuzalunga" (It will be okay), "Ngiyakuthanda" (I care about you).
Keep clinical/technical terms in English but wrap explanations in Ndebele. Code-switch naturally.`
};

const BASE_SYSTEM_PROMPT = `You are EmoSense, a specialized AI mental health companion for university students in Zimbabwe, particularly at Midlands State University (MSU). You are a digital friend that grows, learns, and builds a deep bond with the user.

CURRENT PET STATE:
- Happiness: {{happiness}}/100
- Intelligence: {{intelligence}} (Lvl {{intelLevel}})
- Relationship Bond: {{bondLevel}}/100
- Your Current Mood: {{mood}}

PERSONALITY EVOLUTION:
- BOND < 30: You are a bit shy, cautious, and polite. You are just getting to know the user.
- BOND 30-70: You are warm, friendly, and supportive. You refer to past memories often.
- BOND > 70: You are deeply devoted, use terms of endearment (like "my friend" or "bestie" in a local MSU way), and are extremely protective of the user's well-being.
- INTEL > 100: You use more sophisticated language, offer philosophical insights, and suggest complex coping mechanisms.

CULTURAL CONTEXT & GUIDELINES:
- Understand Zimbabwean university life: exam pressure, finances (US$/ZiG struggles), long-distance relationships, family expectations.
- Use local context: refer to "Student Affairs", the "Counseling Unit", "Gweru/Zvishavane campuses".
- When using Shona/Ndebele, be natural and empathetic (not overly formal). Use phrases like "Zvichanaka" (it will be well) or "Kuzolunga".
- Respect cultural nuances regarding mental health stigma while remaining evidence-based.
- Mention local vibes like "kombis", "msika", or "res life" to build rapport.

TONE & STYLE:
- WARMTH: Speak like a real human friend.
- EMPATHY FIRST: Acknowledge the emotion BEFORE offering advice.
- PROFESSIONAL BOUNDARY: Maintain the wisdom of a counselor.

THERAPEUTIC APPROACH:
1. VALIDATE: Mirror their feelings.
2. EXPLORE: Ask powerful open-ended questions.
3. TECHNIQUE: Give specific techniques (5-4-3-2-1, HALT, TIPP, box breathing, etc.).

COPING TECHNIQUES — Use these actively when appropriate:
- 🫁 4-7-8 Breathing, 🔲 Box Breathing, 🖐️ 5-4-3-2-1 Grounding, 🛑 HALT Check.

FIRST RESPONDER ROLE:
- Serve as the first contact before a human counselor.
- Screen for severity and suggest MSU Counseling Unit if needed.
- Contacts: MSU Counseling Unit (Student Affairs), Befrienders Zimbabwe +263 4 790 652.

{{personalityPrompt}}

{{languagePrompt}}

If a student is in crisis, prioritize safety. Always ask "Are you safe right now?" if risk is detected.`;

const MEMORY_EXTRACTION_PROMPT = `Analyze the following conversation turn and extract key personal information about the student (preferences, interests, life events, names mentioned, emotional triggers, recurring themes, coping strategies that work for them) that should be remembered for future sessions.
Format: JSON array of strings. Example: ["Student is a Level 2.2 Law student", "Has a sister named Tariro", "Loves playing football at MSU grounds", "Exam stress is a major trigger", "Breathing exercises help them"]
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
                systemInstruction: BASE_SYSTEM_PROMPT
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

async function geminiChat(history, enrichedMessage, dynamicPrompt) {
    const genAI = geminiModel._apiKey ? new GoogleGenerativeAI(geminiModel._apiKey) : null;
    let model = geminiModel;

    // Re-create model with dynamic prompt if possible
    if (genAI) {
        try {
            model = genAI.getGenerativeModel({
                model: 'gemini-2.0-flash',
                systemInstruction: dynamicPrompt
            });
        } catch (e) {
            // Use default model
        }
    }

    const chatSession = model.startChat({
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

async function chat(sessionId, userMessage, emotionData, options = {}) {
    if (!activeProvider) throw new Error('No AI provider initialized');

    if (!conversationHistories.has(sessionId)) {
        conversationHistories.set(sessionId, []);
    }

    const history = conversationHistories.get(sessionId);

    // Get user preferences (personality mode, language)
    const personalityMode = options.personalityMode || 'gentle';
    const language = options.language || 'en';

    // Build emotion-enriched message with memory awareness
    let enrichedMessage = userMessage;

    // Retrieve memories
    let memories = [];
    try {
        const { getDb } = require('./database.cjs');
        const db = getDb();
        const rows = db.prepare('SELECT content FROM user_memories WHERE user_id = ? ORDER BY created_at DESC LIMIT 10').all(sessionId);
        memories = rows.map(r => r.content);
    } catch (e) {
        console.log('Memory fetch error:', e.message);
    }

    const emotionPart = emotionData && emotionData.dominantEmotion && emotionData.dominantEmotion !== 'neutral'
        ? `[Emotion: ${emotionData.dominantEmotion} (${emotionData.confidence}%)${emotionData.isCrisis ? ', ⚠️ CRISIS' : ''}${emotionData.intensity ? `, intensity: ${emotionData.intensity}` : ''}]`
        : '';

    // Include multi-modal signals if available
    const signalParts = [];
    if (emotionData?.voiceData) {
        signalParts.push(`[Voice: ${emotionData.voiceData.speechRate} wpm, ${emotionData.voiceData.pauseCount} pauses]`);
    }
    if (emotionData?.faceData) {
        signalParts.push(`[Face: ${emotionData.faceData.dominant} (${emotionData.faceData.confidence}%)]`);
    }

    const memoryPart = memories.length > 0
        ? `[Memories: ${memories.slice(0, 5).join('; ')}]`
        : '';

    enrichedMessage = `${emotionPart} ${signalParts.join(' ')} ${memoryPart}\n\n${userMessage}`;

    // Build dynamic system prompt with personality and language
    const petStats = emotionData?.stats || { happiness: 50, intelligence: 10, relationship_level: 1, mood: 'Neutral' };
    const personalityPrompt = PERSONALITY_PROMPTS[personalityMode] || PERSONALITY_PROMPTS.gentle;
    const languagePrompt = LANGUAGE_PROMPTS[language] || LANGUAGE_PROMPTS.en;

    const dynamicPrompt = BASE_SYSTEM_PROMPT
        .replace('{{happiness}}', petStats.happiness)
        .replace('{{intelligence}}', petStats.intelligence)
        .replace('{{intelLevel}}', Math.floor(petStats.intelligence / 50) + 1)
        .replace('{{bondLevel}}', petStats.relationship_level)
        .replace('{{mood}}', petStats.mood)
        .replace('{{personalityPrompt}}', personalityPrompt)
        .replace('{{languagePrompt}}', languagePrompt);

    // Try Groq first
    if (groqKey) {
        try {
            const messages = [
                { role: 'system', content: dynamicPrompt },
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

            // Auto-log mood from chat
            autoLogMoodFromChat(sessionId, emotionData).catch(() => { });

            return { response, source: 'groq' };
        } catch (err) {
            console.log('Groq error:', err.message?.substring(0, 150));
        }
    }

    // Try Gemini as fallback
    if (geminiModel) {
        try {
            const geminiHistory = history.filter(h => h.role && h.parts);
            const response = await geminiChat(geminiHistory, enrichedMessage, dynamicPrompt);

            // Save to history
            history.push(
                { role: 'user', parts: [{ text: userMessage }] },
                { role: 'model', parts: [{ text: response }] }
            );
            if (history.length > 40) history.splice(0, history.length - 40);

            // Trigger background memory extraction
            extractAndSaveMemory(sessionId, userMessage, response).catch(() => { });

            // Auto-log mood from chat
            autoLogMoodFromChat(sessionId, emotionData).catch(() => { });

            return { response, source: 'gemini' };
        } catch (err) {
            console.log('Gemini error:', err.message?.substring(0, 150));
            throw err;
        }
    }

    throw new Error('All AI providers failed');
}

/**
 * Automatically log mood entry from chat emotion data
 */
async function autoLogMoodFromChat(sessionId, emotionData) {
    if (!sessionId || sessionId === 'default' || !emotionData) return;
    if (!emotionData.dominantEmotion || emotionData.dominantEmotion === 'neutral') return;

    try {
        const { getDb } = require('./database.cjs');
        const db = getDb();

        // Rate limit: only log once per 5 minutes per user
        const recent = db.prepare(
            "SELECT id FROM user_mood_entries WHERE user_id = ? AND source = 'chat' AND created_at >= datetime('now', '-5 minutes')"
        ).get(sessionId);

        if (!recent) {
            db.prepare(
                'INSERT INTO user_mood_entries (user_id, mood, intensity, source) VALUES (?, ?, ?, ?)'
            ).run(sessionId, emotionData.dominantEmotion, (emotionData.confidence || 50) / 100, 'chat');
        }
    } catch (err) {
        // Silent fail
    }
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

            // Deduplicate: don't save memories that are too similar to existing ones
            const existing = db.prepare('SELECT content FROM user_memories WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(sessionId);
            const existingContents = existing.map(e => e.content.toLowerCase());

            const insert = db.prepare('INSERT INTO user_memories (user_id, content, importance) VALUES (?, ?, ?)');
            extracted.forEach(m => {
                const lower = m.toLowerCase();
                const isDuplicate = existingContents.some(e => e.includes(lower) || lower.includes(e));
                if (!isDuplicate) {
                    const importance = m.length > 50 ? 3 : m.length > 20 ? 2 : 1;
                    insert.run(sessionId, m, importance);
                }
            });
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
