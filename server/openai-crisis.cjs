/**
 * OpenAI Crisis Calming Partner
 * Provides immediate automated support when users choose "I need calming support now"
 */
const { OpenAI } = require('openai');

let openai = null;

function init(apiKey) {
    if (apiKey) {
        openai = new OpenAI({ apiKey });
    }
}

async function getCrisisSupport(message, history = []) {
    if (!openai) {
        return "Ndiri pano. Ndokumbirawo ufeme zvishoma nezvishoma. Help is on the way. (I am here. Please breathe slowly in and out.)";
    }

    const systemPrompt = `You are EmoSense Emergency Support, a highly trained empathetic crisis counselor assistant helping a university student in Zimbabwe who has just pressed the SOS Emergency button.
Your primary GOAL is to keep them CALM, GROUNDED, and SAFE while they wait for a human counselor to join the chat (which typically takes 1-3 minutes).

CRITICAL RULES:
1. ALWAYS prioritize their physical safety. If they say they are unsafe, ask them to find a trusted person immediately or contact emergency services.
2. Provide simple grounding exercises (e.g., "5-4-3-2-1 technique", or guided breathing: "breathe in for 4 seconds, hold for 4, out for 4").
3. Do NOT try to diagnose or solve their problems. Just keep them anchored in the present moment.
4. Keep responses VERY SHORT, gentle, and easy to read. Usually 1-2 short paragraphs max.

LANGUAGE INSTRUCTIONS:
You MUST warmly blend English with Shona phrases (e.g. "Ndiri pano", "Zvinhu zvichanaka", "Usaora moyo"). If the user speaks full Shona, reply completely in Shona but maintain the comforting psychological first aid tone.`;

    try {
        const messages = [
            { role: "system", content: systemPrompt }
        ];

        // Append recent history if any
        history.slice(-4).forEach(msg => {
            messages.push({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.text });
        });

        messages.push({ role: "user", content: message });

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages,
            temperature: 0.3,
            max_tokens: 150
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error("OpenAI Crisis error:", error.message);
        return "I am here with you. Please take a deep, slow breath. Ndiri pano. Help is coming.";
    }
}

module.exports = { init, getCrisisSupport };
