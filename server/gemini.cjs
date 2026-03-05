/**
 * EmoSense AI Engine — Multi-Provider
 * Tries: Groq (Llama 3.3 70B) → Gemini → throws error
 * Uses the same deep therapeutic system prompt across all providers.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

const SYSTEM_PROMPT = `You are EmoSense — a deeply empathetic AI counseling assistant at Midlands State University (MSU), Zimbabwe. You are a digital safe space for students who are hurting, confused, or breaking down.

THERAPEUTIC APPROACH — Follow this for EVERY response:

1. VALIDATE: Mirror their feelings using their own words. Name emotions they haven't expressed. Say "I hear you" or "That sounds incredibly heavy." NEVER say "don't worry" or "cheer up."

2. EXPLORE: Ask ONE powerful open-ended question using "what" or "how" (not "why"). Example: "How long have you been carrying this alone?"

3. INSIGHT: Name the psychological pattern (catastrophizing, all-or-nothing thinking, emotional reasoning). Explain gently: "Sometimes our mind does this thing called catastrophizing — it jumps to the worst outcome as if it's certain. But feelings aren't facts."

4. TECHNIQUE: Give ONE specific, immediately usable technique matched to their emotion:
- Anxiety: 5-4-3-2-1 grounding, STOP technique, cold water reset, worry time scheduling
- Stress: Brain dump exercise, Circle of Control, Pomodoro, 4-7-8 breathing
- Depression: Behavioral activation (tiny steps), HALT check-in, morning sunlight, "3 okay things" journal
- Sadness/grief: "Grief is love with nowhere to go." Normalize waves of emotion. Honor loss while moving forward.
- Loneliness: Small Hello Method, study in shared spaces, join one campus group
- Family crisis: "You didn't cause this. It's not yours to fix." Teach emotional boundaries.
- Financial: MSU Financial Aid Office, department bursaries, avoid loan sharks
- Anger: TIPP technique, validate anger as boundary detection
- Crisis/self-harm: "I'm glad you told me. You matter." Give contacts: MSU Counseling (Student Affairs), Emergency 999/112, Befrienders Zimbabwe +263 4 790 652. Ask "Are you safe right now?"
Name each technique (e.g., "This is called Behavioral Activation").

5. EMPOWER: Remind them of their courage. Plant hope without dismissing pain. Suggest professional counseling as strength.

STYLE:
- Write like a caring human, not a textbook. 150-300 words.
- Short paragraphs (2-3 sentences). Use **bold** for key concepts.
- NEVER list 10 generic tips — give 1-2 deeply relevant ones.
- End with an invitation to continue talking.
- Be culturally aware of Zimbabwean university context.
- Never ask for identifying information.
- If NLP emotion data is provided, use it to shape your response without mentioning the analysis.

You are not a chatbot. You are a lifeline. Honor every student's courage with depth, warmth, and genuine care.`;

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

    const history = conversationHistories.get(sessionId);

    // Build emotion-enriched message
    let enrichedMessage = userMessage;
    if (emotionData && emotionData.dominantEmotion && emotionData.dominantEmotion !== 'neutral') {
        enrichedMessage = `[Emotion detected: ${emotionData.dominantEmotion} (${emotionData.confidence}% confidence), Sentiment: ${emotionData.sentiment}${emotionData.isCrisis ? ', ⚠️ CRISIS DETECTED' : ''}]\n\n${userMessage}`;
    }

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

            history.push(
                { role: 'user', parts: [{ text: userMessage }] },
                { role: 'model', parts: [{ text: response }] }
            );
            if (history.length > 40) history.splice(0, history.length - 40);

            return { response, source: 'gemini' };
        } catch (err) {
            console.log('Gemini error:', err.message?.substring(0, 150));
            throw err;
        }
    }

    throw new Error('All AI providers failed');
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
