const { pipeline } = require('@xenova/transformers');

let classifier;

async function initNLP() {
    try {
        console.log('⌛ Loading emotion classification model...');
        classifier = await pipeline('text-classification', 'Xenova/distilbert-base-uncased-emotion', {
            device: 'cpu'
        });
        console.log('✅ Emotion model loaded');
    } catch (err) {
        console.error('❌ Failed to load emotion model:', err.message);
    }
}

async function analyzeEmotion(text) {
    if (!classifier) return { dominantEmotion: 'neutral', confidence: 0 };

    try {
        const results = await classifier(text);
        // Xenova returns [{ label: 'joy', score: 0.99 }]
        const top = results[0];
        return {
            dominantEmotion: top.label,
            confidence: Math.round(top.score * 100)
        };
    } catch (err) {
        console.error('Emotion analysis error:', err.message);
        return { dominantEmotion: 'neutral', confidence: 0 };
    }
}

module.exports = { initNLP, analyzeEmotion };
