const Sentiment = require('sentiment');
const sentimentAnalyzer = new Sentiment();

let classifier;
let transformersAvailable = false;

async function initNLP() {
    try {
        const { pipeline } = await import('@xenova/transformers'); // Dynamic import if possible or just require
        console.log('⌛ Loading emotion classification model...');
        classifier = await pipeline('text-classification', 'Xenova/distilbert-base-uncased-emotion', {
            device: 'cpu'
        });
        transformersAvailable = true;
        console.log('✅ Emotion model loaded');
    } catch (err) {
        console.error('⚠️ Advanced emotion model failed to load, falling back to basic sentiment:', err.message);
        transformersAvailable = false;
    }
}

async function analyzeEmotion(text) {
    if (transformersAvailable && classifier) {
        try {
            const results = await classifier(text);
            const top = results[0];
            return {
                dominantEmotion: top.label,
                confidence: Math.round(top.score * 100)
            };
        } catch (err) {
            console.error('Emotion analysis error:', err.message);
        }
    }

    // Fallback to basic sentiment
    const result = sentimentAnalyzer.analyze(text);
    const score = result.score;
    let emotion = 'neutral';
    if (score > 2) emotion = 'joy';
    else if (score < -2) emotion = 'sadness';

    return {
        dominantEmotion: emotion,
        confidence: 70, // Generic confidence for fallback
        isFallback: true
    };
}

module.exports = { initNLP, analyzeEmotion };
