const { getDb } = require('./database.cjs');

/**
 * Pet Growth Engine
 * Manages stats like Happiness, Intelligence, and Relationship Bond.
 */

async function updatePetStats(userId, userMessage, sentiment) {
    const db = getDb();

    // Get current stats or create default
    let stats = db.prepare('SELECT * FROM pet_stats WHERE user_id = ?').get(userId);

    if (!stats) {
        db.prepare('INSERT INTO pet_stats (user_id) VALUES (?)').run(userId);
        stats = db.prepare('SELECT * FROM pet_stats WHERE user_id = ?').get(userId);
    }

    let { happiness, intelligence, relationship_level, mood } = stats;

    // 1. Calculate Happiness Change
    // Positive sentiment increases happiness, negative slightly decreases it unless empathetic
    if (sentiment === 'positive') happiness += 5;
    if (sentiment === 'negative') happiness -= 2;

    // 2. Intelligence Change
    // Long, deep messages increase intelligence
    if (userMessage.length > 100) intelligence += 2;
    if (userMessage.includes('?') || userMessage.length > 200) intelligence += 3;

    // 3. Relationship / Bond Logic
    // Frequent interactions build bond
    const now = new Date();
    const lastInteraction = new Date(stats.last_interaction);
    const hoursSinceLast = (now - lastInteraction) / (1000 * 60 * 60);

    if (hoursSinceLast > 0.1) { // Cap bond growth frequency
        relationship_level += 1;
    }

    // Decay Logic: Large gaps reduce happiness
    if (hoursSinceLast > 24) {
        happiness -= 10;
        mood = 'Lonely';
    } else if (sentiment === 'positive') {
        mood = 'Happy';
    } else if (sentiment === 'negative') {
        mood = 'Sad';
    } else {
        mood = 'Calm';
    }

    // Clamp values
    happiness = Math.max(0, Math.min(100, happiness));
    intelligence = Math.min(1000, intelligence);
    relationship_level = Math.min(100, relationship_level);

    // Save back to DB
    db.prepare(`
        UPDATE pet_stats 
        SET happiness = ?, intelligence = ?, relationship_level = ?, mood = ?, last_interaction = CURRENT_TIMESTAMP
        WHERE user_id = ?
    `).run(happiness, intelligence, relationship_level, mood, userId);

    return { happiness, intelligence, relationship_level, mood };
}

async function getPetStats(userId) {
    const db = getDb();
    return db.prepare('SELECT * FROM pet_stats WHERE user_id = ?').get(userId) || {
        happiness: 50,
        intelligence: 10,
        mood: 'Neutral',
        relationship_level: 1
    };
}

module.exports = { updatePetStats, getPetStats };
