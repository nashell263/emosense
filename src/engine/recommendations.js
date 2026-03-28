/**
 * EmoSense Mood-Based Content Recommendations
 * "Netflix for mental health" — suggests exercises, articles, videos
 * based on detected emotion and intensity.
 */

/* ──────────────────────── Content Database ──────────────────────── */

const CONTENT_DB = {
    breathing_exercises: [
        {
            id: 'breath-478',
            title: '4-7-8 Calming Breath',
            description: 'Breathe in for 4 seconds, hold for 7, exhale for 8. Repeat 4 times.',
            type: 'exercise',
            icon: '🫁',
            duration: '3 min',
            moods: ['anxiety', 'stress', 'anger'],
            intensity: [0.3, 1.0],
            steps: ['Sit comfortably and close your eyes', 'Breathe in through your nose for 4 seconds', 'Hold your breath for 7 seconds', 'Exhale slowly through your mouth for 8 seconds', 'Repeat 3-4 times']
        },
        {
            id: 'breath-box',
            title: 'Box Breathing',
            description: 'Square breathing technique used by Navy SEALs. 4 seconds each: in, hold, out, hold.',
            type: 'exercise',
            icon: '🔲',
            duration: '4 min',
            moods: ['stress', 'anxiety', 'academic_pressure'],
            intensity: [0.2, 0.8],
            steps: ['Breathe in slowly for 4 seconds', 'Hold your breath for 4 seconds', 'Exhale for 4 seconds', 'Hold empty for 4 seconds', 'Repeat 4-6 cycles']
        },
        {
            id: 'breath-belly',
            title: 'Deep Belly Breathing',
            description: 'Diaphragmatic breathing to activate your calming nervous system.',
            type: 'exercise',
            icon: '🌬️',
            duration: '5 min',
            moods: ['anxiety', 'stress', 'loneliness'],
            intensity: [0.1, 0.6],
            steps: ['Place one hand on your chest, one on your belly', 'Breathe in slowly — belly should rise, chest stays still', 'Exhale slowly, feeling belly fall', 'Focus only on the breath movement', 'Continue for 5 minutes']
        }
    ],

    grounding_techniques: [
        {
            id: 'ground-54321',
            title: '5-4-3-2-1 Grounding',
            description: 'Use your 5 senses to anchor yourself in the present moment.',
            type: 'exercise',
            icon: '🖐️',
            duration: '3 min',
            moods: ['anxiety', 'stress', 'depression'],
            intensity: [0.4, 1.0],
            steps: ['Name 5 things you can SEE', 'Name 4 things you can TOUCH', 'Name 3 things you can HEAR', 'Name 2 things you can SMELL', 'Name 1 thing you can TASTE']
        },
        {
            id: 'ground-ice',
            title: 'Ice Cube Reset',
            description: 'Hold an ice cube to interrupt panic or overwhelming emotions.',
            type: 'exercise',
            icon: '🧊',
            duration: '2 min',
            moods: ['anxiety', 'anger', 'stress'],
            intensity: [0.6, 1.0],
            steps: ['Get an ice cube or run cold water on your wrists', 'Focus intently on the cold sensation', 'Notice how the feeling changes over 60 seconds', 'Let the intensity ground you in the present']
        },
        {
            id: 'ground-body-scan',
            title: 'Quick Body Scan',
            description: 'Scan from head to toe, releasing tension in each area.',
            type: 'exercise',
            icon: '🧘',
            duration: '5 min',
            moods: ['stress', 'anxiety', 'depression', 'sadness'],
            intensity: [0.2, 0.7],
            steps: ['Sit or lie comfortably', 'Start at the top of your head', 'Slowly move attention down: forehead, jaw, shoulders...', 'Notice tension — breathe into each area', 'End at your toes, feeling grounded']
        }
    ],

    cognitive_techniques: [
        {
            id: 'cog-halt',
            title: 'HALT Check',
            description: 'Are you Hungry, Angry, Lonely, or Tired? Address the root cause.',
            type: 'exercise',
            icon: '🛑',
            duration: '2 min',
            moods: ['stress', 'anger', 'sadness', 'depression', 'loneliness'],
            intensity: [0.1, 0.6],
            steps: ['Ask: Am I Hungry? → Eat something nourishing', 'Am I Angry? → Name the feeling, take 3 breaths', 'Am I Lonely? → Reach out to someone', 'Am I Tired? → Rest if you can, or plan rest soon']
        },
        {
            id: 'cog-reframe',
            title: 'Thought Reframing',
            description: 'Challenge negative thoughts by finding alternative perspectives.',
            type: 'exercise',
            icon: '🔄',
            duration: '5 min',
            moods: ['depression', 'anxiety', 'academic_pressure', 'stress'],
            intensity: [0.3, 0.8],
            steps: ['Write down the negative thought', 'What evidence supports it?', 'What evidence contradicts it?', 'What would you tell a friend thinking this?', 'Write a more balanced thought']
        },
        {
            id: 'cog-gratitude',
            title: 'Gratitude Micro-Journal',
            description: 'Write 3 tiny things you\'re grateful for right now.',
            type: 'exercise',
            icon: '📝',
            duration: '3 min',
            moods: ['sadness', 'depression', 'loneliness'],
            intensity: [0.1, 0.5],
            steps: ['Pause and look around you', 'Name 1 small thing that went okay today', 'Name 1 person who cares about you', 'Name 1 thing about yourself you appreciate', 'Sit with these for a moment']
        }
    ],

    physical_activities: [
        {
            id: 'phys-walk',
            title: 'Mindful 10-Min Walk',
            description: 'Walk slowly, noticing each step and your surroundings.',
            type: 'activity',
            icon: '🚶',
            duration: '10 min',
            moods: ['depression', 'stress', 'sadness', 'loneliness'],
            intensity: [0.2, 0.7],
            steps: ['Step outside or walk in a quiet corridor', 'Walk slowly — feel each foot contact the ground', 'Notice 3 things around you', 'Breathe naturally', 'Return feeling more present']
        },
        {
            id: 'phys-stretch',
            title: 'Desk Stretches for Stress',
            description: 'Quick stretches to release tension — perfect between study sessions.',
            type: 'activity',
            icon: '🤸',
            duration: '5 min',
            moods: ['stress', 'academic_pressure', 'anxiety'],
            intensity: [0.1, 0.5],
            steps: ['Neck rolls: 5 circles each direction', 'Shoulder shrugs: lift, hold 5sec, drop — 5 times', 'Seated twist: each side, hold 15sec', 'Wrist circles and finger stretches', 'Stand up, arms overhead, stretch to each side']
        },
        {
            id: 'phys-tipp',
            title: 'TIPP Technique',
            description: 'Temperature, Intense exercise, Paced breathing, Paired relaxation.',
            type: 'activity',
            icon: '💪',
            duration: '5 min',
            moods: ['anxiety', 'anger', 'stress'],
            intensity: [0.7, 1.0],
            steps: ['T - Splash cold water on your face', 'I - Do 20 jumping jacks or run in place', 'P - Breathe in for 4, out for 6 for 1 min', 'P - Tense each muscle group for 5s, then release']
        }
    ],

    articles: [
        {
            id: 'art-exam-anx',
            title: 'Managing Exam Anxiety at University',
            description: 'Practical strategies for handling test stress without losing your mind.',
            type: 'article',
            icon: '📖',
            duration: '4 min read',
            moods: ['academic_pressure', 'anxiety', 'stress'],
            intensity: [0.2, 0.8],
            content: 'Exam anxiety is one of the most common issues university students face. Here are 5 evidence-based strategies: 1) Start studying early to avoid cramming panic. 2) Use active recall instead of passive re-reading. 3) Take breaks using the Pomodoro technique (25 min study, 5 min break). 4) On exam day, arrive early and do box breathing. 5) Remember: one exam doesn\'t define your entire life or career.'
        },
        {
            id: 'art-loneliness',
            title: 'Feeling Alone at University — You\'re Not Alone',
            description: 'Why university loneliness is so common and what actually helps.',
            type: 'article',
            icon: '📖',
            duration: '5 min read',
            moods: ['loneliness', 'sadness', 'depression'],
            intensity: [0.2, 0.7],
            content: 'Moving to university — especially far from home — can feel incredibly isolating. Studies show that up to 60% of university students experience significant loneliness. What helps: 1) Join one club or society, even if it feels awkward. 2) Study in common areas instead of alone in your room. 3) Be honest with someone about how you feel. 4) Remember that most people around you also feel this way — they\'re just hiding it too.'
        },
        {
            id: 'art-financial',
            title: 'Financial Stress as a Student — Coping Guide',
            description: 'Practical tips for managing money worries while studying in Zimbabwe.',
            type: 'article',
            icon: '📖',
            duration: '4 min read',
            moods: ['financial_stress', 'stress', 'anxiety'],
            intensity: [0.2, 0.8],
            content: 'Financial stress is real and valid. Here\'s what can help: 1) Check if you qualify for bursaries or scholarships — ask your faculty. 2) Create a simple weekly budget. 3) Talk to the student affairs office about hardship funds. 4) Don\'t compare your situation to others. 5) Remember your education is an investment, and this period is temporary.'
        },
        {
            id: 'art-sleep',
            title: 'Sleep Better Tonight — Student Edition',
            description: 'Simple sleep hygiene tips that actually work for busy students.',
            type: 'article',
            icon: '📖',
            duration: '3 min read',
            moods: ['stress', 'anxiety', 'depression'],
            intensity: [0.1, 0.5],
            content: 'Poor sleep worsens every mental health issue. Try: 1) Same bedtime every night (even weekends). 2) No phone 30 minutes before bed. 3) Make your room dark and cool. 4) If you can\'t sleep after 20 minutes, get up and do something calm. 5) Avoid caffeine after 2pm.'
        }
    ],

    affirmations: [
        {
            id: 'aff-stress',
            title: 'Stress Relief Affirmations',
            description: 'Repeat these to yourself during overwhelming moments.',
            type: 'affirmation',
            icon: '💭',
            duration: '2 min',
            moods: ['stress', 'anxiety', 'academic_pressure'],
            intensity: [0.2, 0.7],
            items: [
                'I am doing the best I can, and that is enough.',
                'This feeling is temporary. I have survived hard times before.',
                'I don\'t need to figure everything out right now.',
                'I give myself permission to take a break.',
                'I am more than my grades, my results, or my productivity.'
            ]
        },
        {
            id: 'aff-worth',
            title: 'You Are Worthy',
            description: 'Reminders when depression tells you otherwise.',
            type: 'affirmation',
            icon: '✨',
            duration: '2 min',
            moods: ['depression', 'sadness', 'loneliness'],
            intensity: [0.3, 1.0],
            items: [
                'My feelings are valid, even when I can\'t explain them.',
                'I deserve support and kindness — including from myself.',
                'The darkness I feel now is not the whole truth about me.',
                'Reaching out for help is strength, not weakness.',
                'I matter, even on the days I can\'t feel it.'
            ]
        }
    ]
};

/* ──────────────────────── Recommendation Engine ──────────────────────── */

/**
 * Get personalized recommendations based on detected emotion.
 * @param {string} emotion - Detected emotion (stress, anxiety, depression, etc.)
 * @param {number} intensity - 0.0 to 1.0
 * @param {number} limit - Max recommendations to return
 * @returns {Array} Ranked recommendations
 */
export function getRecommendations(emotion, intensity = 0.5, limit = 4) {
    if (!emotion) return [];

    const normalizedIntensity = Math.max(0, Math.min(1, intensity));
    const allContent = [];

    // Gather all matching content
    for (const category of Object.values(CONTENT_DB)) {
        for (const item of category) {
            if (item.moods.includes(emotion)) {
                // Score based on intensity match
                const [minI, maxI] = item.intensity;
                let intensityMatch = 0;
                if (normalizedIntensity >= minI && normalizedIntensity <= maxI) {
                    intensityMatch = 1 - Math.abs(normalizedIntensity - (minI + maxI) / 2) / ((maxI - minI) / 2 + 0.01);
                }

                // Primary mood match bonus
                const moodIndex = item.moods.indexOf(emotion);
                const moodScore = moodIndex === 0 ? 1.0 : moodIndex === 1 ? 0.7 : 0.5;

                allContent.push({
                    ...item,
                    relevanceScore: (moodScore * 0.6) + (intensityMatch * 0.4)
                });
            }
        }
    }

    // Sort by relevance, return top N
    allContent.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return allContent.slice(0, limit);
}

/**
 * Get emergency resources for crisis situations.
 */
export function getCrisisResources() {
    return {
        title: '🚨 Immediate Support Available',
        resources: [
            {
                name: 'Befrienders Zimbabwe',
                contact: '+263 (04) 790818',
                type: 'phone',
                icon: '📞'
            },
            {
                name: 'Childline Zimbabwe',
                contact: '116',
                type: 'phone',
                icon: '📞'
            },
            {
                name: 'MSU Student Counseling',
                contact: 'Visit Student Affairs Office',
                type: 'in-person',
                icon: '🏥'
            },
            {
                name: 'EmoSense Counselors',
                contact: 'Go to Counselors page for live chat',
                type: 'online',
                icon: '💬'
            }
        ],
        message: 'You are not alone. Please reach out to any of these resources if you need immediate help.'
    };
}

/**
 * Get all available content categories.
 */
export function getContentCategories() {
    return Object.keys(CONTENT_DB).map(key => ({
        id: key,
        name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count: CONTENT_DB[key].length
    }));
}

/**
 * Get content by category.
 */
export function getContentByCategory(category) {
    return CONTENT_DB[category] || [];
}
