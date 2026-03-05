/**
 * EmoSense Advanced Chatbot Engine
 * Contextual conversation management with varied, personalized responses.
 * Tracks conversation flow, avoids repetition, provides follow-ups,
 * and aligns responses with detected emotions (≥80% alignment).
 */

import {
    analyzeEmotion, trackEmotion, getEmotionPatterns,
    resetEmotionHistory, getEmotionLabel, getEmotionEmoji
} from './sentiment-engine.js';

/* ──────────────────────── State ──────────────────────── */

let conversationHistory = [];
let turnCount = 0;
let usedResponseIndices = {};
let lastEmotion = 'neutral';
let userName = null;
let sessionTopics = new Set();
let sessionStartTime = Date.now();

/* ──────────────────────── Response Templates ──────────────────────── */

const GREETINGS = [
    `Hello! I'm EmoSense, your emotion-aware counseling assistant. 💚 I'm here to listen, understand, and support you. This is a completely anonymous and safe space.\n\nYou can share anything that's on your mind - whether it's academic pressure, financial worries, stress, anxiety, or anything else affecting your wellbeing. I'll do my best to understand how you're feeling and provide helpful support.\n\nHow are you feeling today?`,
    `Hi there! Welcome to EmoSense. 🌿 I'm your digital counseling companion, designed to help you navigate emotional challenges.\n\nThis conversation is completely private and anonymous - no one will see what you share here. I use Natural Language Processing to understand your emotions and provide personalized support.\n\nWhat's on your mind today?`,
    `Welcome to EmoSense! 💚 I'm glad you're here.\n\nTaking this step to check in with yourself shows real strength. I'm here to listen without judgment and help you work through whatever you're experiencing.\n\nYou can talk about anything - academics, relationships, finances, or just how your day is going. How are you doing right now?`
];

const RESPONSES = {
    stress: [
        {
            empathy: "I can really hear the stress you're carrying right now. That pressure is real, and it's completely understandable that you're feeling this way.",
            support: "When stress builds up, it can feel like everything is closing in. But remember - you don't have to tackle everything at once. Breaking things down into smaller steps can make them feel much more manageable.",
            action: "Let me share a technique that can help right now:\n\n**The 5-4-3-2-1 Grounding Technique:**\n• Look around and name **5** things you can see\n• Touch **4** things around you\n• Listen for **3** sounds\n• Notice **2** things you can smell\n• Identify **1** thing you can taste\n\nThis brings you back to the present moment and interrupts the stress cycle. Would you like to try it, or would you prefer to talk about what's specifically causing your stress?"
        },
        {
            empathy: "It sounds like you're dealing with a lot right now, and that accumulated stress can be really draining. Your feelings are completely valid.",
            support: "Stress is your body's way of telling you something needs attention. The fact that you're reaching out is already a positive step - acknowledging stress is the first step to managing it.",
            action: "**Try this stress management approach:**\n\n1. **Pause** - Take 3 deep breaths right now (breathe in for 4 counts, hold for 4, out for 6)\n2. **List** - Write down the 3 biggest things stressing you\n3. **Prioritize** - Which one can you address first? Start small\n4. **Act** - Take one small action on your top priority today\n\nWhat aspects of your life are contributing most to your stress right now? Let's break them down together."
        },
        {
            empathy: "I hear you - stress can feel overwhelming, especially when multiple pressures pile up at once. You're not alone in feeling this way.",
            support: "Many students experience intense stress, and it doesn't mean something is wrong with you. It means you're human and you care about your responsibilities.",
            action: "**Here's a practical stress-reduction exercise:**\n\n**Progressive Muscle Relaxation (2 minutes):**\n• Tense your shoulders up to your ears - hold 5 seconds - release\n• Clench your fists tightly - hold 5 seconds - release\n• Scrunch your face muscles - hold 5 seconds - release\n• Tighten your legs - hold 5 seconds - release\n\nNotice how different tension and relaxation feel. Can you share more about what's causing your stress? I'd like to help you find specific solutions."
        },
        {
            empathy: "That level of stress sounds really difficult to manage. I want you to know that what you're feeling matters, and it's okay to not have everything under control.",
            support: "Sometimes we put so much pressure on ourselves to handle everything perfectly. Giving yourself permission to be imperfect can actually reduce stress significantly.",
            action: "**Consider these stress management strategies:**\n\n• **Time-blocking**: Schedule specific times for work and rest - both are important\n• **The 2-minute rule**: If something takes less than 2 minutes, do it now\n• **Say no**: It's okay to decline additional responsibilities\n• **Physical movement**: Even a 10-minute walk can lower cortisol levels by 15%\n\nI want to understand your situation better. What does a typical stressful day look like for you?"
        }
    ],

    anxiety: [
        {
            empathy: "I hear that you're experiencing anxiety, and I want you to know that what you're feeling is real and valid. Anxiety can be incredibly overwhelming.",
            support: "Anxiety often makes us focus on worst-case scenarios, but thoughts aren't facts - even when they feel absolutely convincing. Your brain is trying to protect you, even if it's working overtime.",
            action: "**Let's try a grounding exercise together right now:**\n\n**Box Breathing (proven to reduce anxiety in 3-4 minutes):**\n• Breathe IN slowly for 4 seconds\n• HOLD for 4 seconds\n• Breathe OUT slowly for 4 seconds\n• HOLD for 4 seconds\n• Repeat 4 times\n\nThis activates your parasympathetic nervous system and signals your body that you're safe. How are your anxiety symptoms presenting right now? I'd like to help you address them specifically."
        },
        {
            empathy: "Anxiety can feel like you're trapped in a cycle of worry that won't stop. I understand how exhausting and scary that can be.",
            support: "You're not weak for feeling anxious - anxiety is a normal human response, and you can learn to manage it. Many successful people deal with anxiety every day.",
            action: "**Try this thought-challenging technique (from CBT):**\n\n1. **Identify the thought**: What specifically are you anxious about?\n2. **Evidence check**: What evidence supports this worry? What evidence contradicts it?\n3. **Realistic outcome**: What's the most likely outcome (not worst case)?\n4. **Friend test**: What would you tell a friend who had this worry?\n5. **Action step**: What's one small thing you can do right now?\n\nCan you share the specific worry that's on your mind? Let's work through these questions together."
        },
        {
            empathy: "The restlessness, the racing thoughts, the feeling that something bad is about to happen - anxiety manifests in so many ways, and all of them are draining.",
            support: "It's important to remember that anxiety about the future often makes us overestimate threats and underestimate our ability to cope. You've handled difficult situations before.",
            action: "**Physical anxiety relief techniques:**\n\n• **Cold water**: Splash cold water on your face or hold ice - this triggers the dive reflex and calms your nervous system\n• **Bilateral stimulation**: Cross your arms and alternately tap your shoulders\n• **Butterfly hug**: Cross your arms over your chest and gently tap alternating sides\n• **Grounding stance**: Press your feet firmly into the floor and focus on that sensation\n\nWhich of these would you like to try? Or tell me more about what's triggering your anxiety."
        },
        {
            empathy: "Living with anxiety can feel like you're constantly waiting for the other shoe to drop. That hyper-vigilance is exhausting.",
            support: "Anxiety lies to us - it tells us we can't handle things, but look at everything you've already handled to get where you are today. You're stronger than anxiety wants you to believe.",
            action: "**The STOP technique for anxious moments:**\n\n• **S** - Stop what you're doing\n• **T** - Take a breath (one deep, slow breath)\n• **O** - Observe what you're thinking and feeling without judgment\n• **P** - Proceed with awareness, choosing a mindful response\n\nHave you experienced anxiety like this before? Understanding your patterns can help us find what works best for you."
        }
    ],

    depression: [
        {
            empathy: "Thank you for sharing that with me. Talking about feeling depressed or hopeless takes real courage. I hear you, and your feelings are valid.",
            support: "What you're experiencing is more common than you might think, and it doesn't define who you are or what your future holds. Dark moments can feel permanent, but they are temporary - even when they don't feel that way.",
            action: "**One small step can start to shift things:**\n\nWhen everything feels heavy, even small actions matter. Can you do one of these right now?\n\n• 💧 Drink a glass of water\n• 🚶 Step outside for just 2 minutes of fresh air\n• 📱 Send a short message to someone you trust\n• ✍️ Write down one thing - anything - you're grateful for today\n\nSmall actions build momentum. You don't need to fix everything at once. Can you tell me more about when these feelings started?"
        },
        {
            empathy: "I'm really glad you reached out. When you're in that dark place, it can feel like no one would understand. But I'm here to listen without judgment.",
            support: "Depression can make you believe that this is how things will always be. That's the depression talking, not reality. Recovery isn't linear, but it is possible.",
            action: "**The HALT check-in can help identify what's contributing to how you feel:**\n\n• **H** - Are you **Hungry**? When did you last eat something nourishing?\n• **A** - Are you **Angry** about something you haven't expressed?\n• **L** - Are you **Lonely**? When did you last connect with someone?\n• **T** - Are you **Tired**? Are you getting enough rest?\n\nSometimes addressing these basics can give you a small but meaningful lift. Which of these resonates most with how you're feeling right now?"
        },
        {
            empathy: "Feeling empty, numb, or like nothing matters is truly painful. I want you to know that you reaching out here is significant - it means a part of you is looking for light.",
            support: "You matter. Even if everything feels grey right now, that doesn't diminish your value. Depression distorts our perception, making us see only darkness.",
            action: "**Behavioral activation (a proven technique for depression):**\n\nWhen we're depressed, we stop doing things we used to enjoy, which makes us feel worse. Breaking this cycle starts with tiny steps:\n\n1. **Today**: Do one thing that involves gentle movement (stretch, walk to the window)\n2. **This week**: Reconnect with one activity you used to enjoy, even briefly\n3. **Ongoing**: Try to maintain one daily routine (eating at regular times, a short walk)\n\n**Important**: If you've been feeling this way for more than two weeks, I'd strongly encourage visiting the MSU Counseling Unit. You deserve professional support. Would you like to talk more about what you're going through?"
        }
    ],

    sadness: [
        {
            empathy: "I can feel the weight of sadness in your words. It's okay to feel sad - it means you've cared deeply about something or someone.",
            support: "Sadness is a natural human emotion, and it's important to allow yourself to feel it rather than pushing it away. Suppressing emotions only makes them stronger.",
            action: "**When sadness feels overwhelming:**\n\n• **Let yourself feel** - It's okay to cry if you need to. Tears actually release stress hormones\n• **Express it** - Write about how you feel, even if no one reads it\n• **Comfort yourself** - What would you say to a friend feeling this way? Say that to yourself\n• **Connect** - Even a brief interaction with someone can help\n\nWould you like to share what's making you sad? Sometimes putting feelings into words can help lighten the load."
        },
        {
            empathy: "Heartache and loss are some of the hardest things to bear. Your sadness tells me that something meaningful is at stake for you.",
            support: "You don't have to rush through grief or sadness. Healing takes its own time, and there's no 'right' timeline.",
            action: "**A journaling exercise that may help:**\n\nTake a few minutes and write about:\n1. What specifically is making you sad\n2. What this situation or person means/meant to you\n3. One memory or aspect that brings even a tiny smile\n4. What you need right now (comfort, distraction, company, space)\n\nSometimes getting things out of your head and onto paper creates a sense of relief. What's weighing on your heart right now?"
        }
    ],

    loneliness: [
        {
            empathy: "Feeling lonely, especially in a place full of people, can be incredibly painful. University life can paradoxically feel very isolating despite being surrounded by thousands of students.",
            support: "Loneliness doesn't mean there's something wrong with you. It's incredibly common among students, especially those adjusting to new environments, living away from home, or dealing with the pressure to 'fit in.'",
            action: "**Steps to build connection (start with what feels comfortable):**\n\n• **Lowest effort**: Study in a common area instead of alone - proximity counts\n• **Small step**: Say hello to someone in your next class or residence\n• **Medium step**: Join one campus club or society that interests you\n• **Bigger step**: Attend a campus event, even if only for 30 minutes\n• **Support**: Visit Student Affairs - they organize social activities specifically for this\n\nConnection starts with small, repeated moments. What feels most comfortable for you to try?"
        },
        {
            empathy: "Being far from home, missing familiar faces, and feeling like you don't belong - that's a heavy combination to carry. Your loneliness is valid.",
            support: "The truth is, many people around you feel the same way but are afraid to show it. University is a time of major transition, and feeling disconnected during that transition is normal.",
            action: "**Ways to maintain existing connections while building new ones:**\n\n• **Home connections**: Schedule regular calls with family or friends from home\n• **Study groups**: Join or start a study group for your courses\n• **Shared interests**: What do you enjoy? There's likely a campus group for it\n• **Volunteering**: Helping others is one of the best ways to feel connected\n• **Residence activities**: Even casual conversations in common areas build bonds over time\n\nDo you feel comfortable sharing more about your situation? I'd like to suggest something specific for you."
        }
    ],

    academic_pressure: [
        {
            empathy: "Academic pressure can feel crushing, especially when your future seems to depend on every grade and every exam. That weight is real, and I understand how overwhelming it can be.",
            support: "Struggling academically doesn't mean you're not smart enough. It often means the system isn't providing enough support, or you haven't yet found the approach that works for you.",
            action: "**Practical strategies for managing academic pressure:**\n\n1. **Identify the specific challenge**: Is it understanding material? Time management? Exam anxiety? Each needs a different approach\n2. **Use the Pomodoro technique**: Study 25 minutes, break 5 minutes. After 4 rounds, take a 15-minute break\n3. **Seek help early**: Visit your lecturer during office hours - they want to help\n4. **Study groups**: Teaching others is one of the best ways to learn\n5. **Be strategic**: Focus on what gives the most marks, not trying to cover everything equally\n\nWhat specific academic challenge are you facing right now? I can offer more targeted advice."
        },
        {
            empathy: "I understand the fear of failing, the weight of expectations, and the pressure to perform. Academic life at MSU can be incredibly demanding.",
            support: "Your worth is not determined by your GPA. Many successful graduates struggled during their university years. What matters is that you keep showing up and keep trying.",
            action: "**Academic survival toolkit:**\n\n• **Break it down**: Turn large assignments into 15-minute tasks\n• **Calendar everything**: Put all deadlines in one place and work backward\n• **Ask for help**: Visit the library, form study groups, attend tutorials\n• **Manage exam anxiety**: Practice past papers under timed conditions\n• **Self-care during exams**: Sleep, eat, and take breaks - your brain needs fuel\n• **Talk to your faculty**: If you're struggling, they may offer extensions or support\n\nRemember: many students at MSU face similar challenges. Which aspect of academics is most difficult for you right now?"
        },
        {
            empathy: "The fear of dropping out, failing exams, or disappointing your family - these are pressures that many students carry silently. You don't have to carry them alone.",
            support: "At MSU, the drop from 1,000 students at Level 1.1 to 300 at Level 2 doesn't mean those students weren't capable - it means the system didn't support them enough. You can be different.",
            action: "**If you're at risk of failing:**\n\n1. **Talk to your department** immediately - don't wait until it's too late\n2. **Check supplementary options** - most courses offer second chances\n3. **Visit the Academic Support Center** if available\n4. **Consider your workload** - is it realistic? Can anything be dropped?\n5. **Get a study partner** who's strong where you're weak\n\n**Remember**: Asking for help is not a sign of weakness - it's a sign of intelligence. What's your most pressing academic concern right now?"
        }
    ],

    financial_stress: [
        {
            empathy: "Financial stress is one of the most pervasive and difficult challenges students face. Worrying about money while trying to focus on studies creates an incredibly tough situation.",
            support: "There is no shame in financial difficulty. Many students at MSU come from backgrounds where funding university is a major sacrifice. The system should support you, not let you fall through the cracks.",
            action: "**Practical financial steps to explore:**\n\n• **Financial Aid Office**: Visit to ask about bursaries, emergency funds, or fee arrangements\n• **Scholarships**: Check your department for any scholarship opportunities\n• **Work-study programs**: Some departments offer campus work opportunities\n• **SRC**: The Student Representative Council may know of support resources\n• **Faculty Dean**: Discuss payment plan options or fee deferrals\n• **Library resources**: Use digital library instead of buying expensive textbooks\n\nWould you like to talk more about your specific financial situation? I can try to suggest the most relevant options."
        },
        {
            empathy: "The stress of not knowing if you can afford to continue, or whether you'll be blocked from exams for unpaid fees - that kind of uncertainty is incredibly anxiety-inducing.",
            support: "Financial challenges don't reflect your worth or your academic ability. Many successful graduates remember financial struggles as part of their journey.",
            action: "**Immediate steps if you're facing financial crisis:**\n\n1. **Don't withdraw in silence** - Talk to your Faculty Dean as soon as possible\n2. **Financial clearance issues** - There may be emergency provisions available\n3. **Food insecurity** - If you're going hungry, speak to Student Affairs confidentially\n4. **Budgeting basics**: Track every dollar for one week to see where money goes\n5. **Avoid loan sharks** - They will make your situation worse, not better\n\n**Remember**: Universities have dealt with students in financial difficulty before. There are often solutions that aren't widely advertised. What's your most pressing financial concern?"
        }
    ],

    anger: [
        {
            empathy: "I can feel the frustration in your words. Anger is a valid emotion - it often signals that something important to you has been violated or that you feel powerless in a situation.",
            support: "It's okay to feel angry. What matters is how you process and channel that anger. Suppressing it or acting on it impulsively can both cause harm, but expressing it constructively is healthy.",
            action: "**Anger management techniques:**\n\n1. **Pause rule**: Before reacting, count slowly to 10 and take deep breaths\n2. **Physical release**: Go for a walk, exercise, or do jumping jacks - movement metabolizes stress hormones\n3. **Express safely**: Write down what's making you angry without filtering\n4. **Perspective check**: Ask yourself \"Will this matter in a week? A month? A year?\"\n5. **Identify the root**: Anger is often a secondary emotion covering hurt, fear, or frustration\n\nWhat specifically triggered these feelings? Understanding the root cause helps us find a better response."
        },
        {
            empathy: "That sounds incredibly frustrating, and your anger makes sense in this context. Feeling mistreated, disrespected, or powerless naturally produces anger.",
            support: "Anger can actually be useful - it tells you where your boundaries are and what matters to you. The key is channeling it productively rather than destructively.",
            action: "**The RAIN technique for processing anger:**\n\n• **R**ecognize: \"I'm feeling angry right now\"\n• **A**llow: \"It's okay to feel this way\"\n• **I**nvestigate: \"What's really underneath this anger? Hurt? Fear? Injustice?\"\n• **N**on-attachment: \"This feeling is temporary. It doesn't define me.\"\n\nAfter processing, you can decide on a constructive response. Do you want to tell me more about what happened?"
        }
    ],

    hopeful: [
        {
            empathy: "That's wonderful to hear! 🌟 It takes strength to recognize and hold onto positive feelings, especially during challenging times.",
            support: "Positive moments matter - they remind us that things can and do get better. You should feel proud of whatever progress you've made to feel this way.",
            action: "**To build on this positive momentum:**\n\n• **Capture it**: Write down what's going well - you can look back on this during tougher times\n• **Share it**: Positive energy is contagious - let someone else benefit from your good mood\n• **Set an intention**: What's one goal you'd like to work toward while feeling motivated?\n• **Practice gratitude**: Name 3 specific things you're grateful for right now\n\nI'd love to hear more about what's contributing to your positive feelings! What's going well?"
        },
        {
            empathy: "It's so good to hear that you're in a positive space right now! These moments are worth celebrating. 💚",
            support: "Resilience isn't about never feeling down - it's about being able to bounce back. The fact that you're feeling hopeful shows real inner strength.",
            action: "**Maintaining positive mental wellness:**\n\n• **Consistency**: Keep doing what's working right now\n• **Connection**: Stay connected with people who lift you up\n• **Self-care routine**: Regular sleep, exercise, and nutrition maintain mood\n• **Mindfulness**: Even 5 minutes of daily meditation builds emotional resilience\n\nWould you like to share what's made a difference? It might help reinforce those positive habits."
        }
    ],

    neutral: [
        {
            empathy: "Thank you for sharing. I'm here to listen and support you in whatever way is most helpful.",
            support: "Sometimes we might not have a clear label for how we feel, and that's completely normal. Talking about it can help clarify things.",
            action: "I'd love to understand more about what's on your mind. You could share about:\n\n• How your day has been\n• Any challenges you're currently dealing with\n• Something that's been nagging at you\n• How you've been feeling in general lately\n\nThere's no wrong way to start. What feels most relevant to you right now?"
        },
        {
            empathy: "I appreciate you taking the time to talk. Even when things seem okay on the surface, it can be helpful to check in with yourself.",
            support: "Mental wellness isn't just about addressing problems - it's also about maintaining and building on the good. Regular emotional check-ins are valuable.",
            action: "**A quick emotional check-in:**\n\nOn a scale of 1-10, how would you rate your:\n• Overall mood today?\n• Stress level?\n• Energy level?\n• Sleep quality recently?\n\nThis can help us identify areas where you might benefit from support. What would you like to focus on?"
        }
    ],

    crisis: [
        {
            empathy: "I'm really concerned about what you've shared, and I want you to hear this clearly: **your life has value and you matter.**",
            support: "What you're experiencing right now is a crisis, and you deserve immediate, professional support. As a digital tool, I cannot provide the level of help you need in this moment.",
            action: "**🆘 Please reach out to one of these services RIGHT NOW:**\n\n• **MSU Counseling Unit** — Student Affairs Building (walk in anytime)\n• **Befrienders Zimbabwe** — +263 4 790 652 (crisis support)\n• **Childline Zimbabwe** — 116 (toll-free)\n• **Zimbabwe Emergency** — 999 / 112\n• **A trusted person** — friend, family member, lecturer, pastor, or mentor\n\n**You are not alone.** People care about you, and trained professionals are ready to help you right now. Please reach out to one of these contacts. Will you do that?"
        }
    ]
};

/* ──────────────────────── Follow-Up Questions ──────────────────────── */

const FOLLOW_UPS = {
    stress: [
        "Tell me more about what's causing you the most stress right now.",
        "How long have you been feeling this level of stress?",
        "What does your typical day look like? I'm curious if we can find areas to reduce pressure.",
        "Have you been able to talk to anyone about your stress?",
        "What has helped you manage stress in the past?",
        "Is there a specific deadline or event that's driving most of the stress?"
    ],
    anxiety: [
        "Can you describe what your anxiety feels like physically?",
        "Is there a specific situation or thought that triggers your anxiety most?",
        "How has anxiety been affecting your daily life - sleep, eating, studying?",
        "Have you experienced anxiety like this before, or is this something new?",
        "What's the worry that's hardest to let go of right now?",
        "Have you tried any coping strategies before? What worked or didn't work?"
    ],
    depression: [
        "How long have you been feeling this way?",
        "Are you still able to do daily activities, or has it become really difficult to function?",
        "Is there anything that still brings you even a small moment of relief or joy?",
        "Have you been sleeping and eating regularly?",
        "Have you talked to anyone about how you've been feeling?",
        "Would you be open to visiting the MSU Counseling Unit? I can tell you more about what to expect."
    ],
    loneliness: [
        "What does your social life look like right now?",
        "Do you have people you can call or text when you need someone?",
        "Are you new to MSU, or has this isolation developed over time?",
        "What kinds of activities or groups interest you?",
        "Is there anything that's preventing you from reaching out to people?"
    ],
    academic_pressure: [
        "Which specific subjects or courses are you struggling with most?",
        "Do you have a study routine, or is it hard to stay organized?",
        "How are you balancing studies with other parts of your life?",
        "Have you spoken to your lecturers about the difficulties you're facing?",
        "What does success look like for you this semester - what's realistic?"
    ],
    financial_stress: [
        "What's your most immediate financial concern - fees, food, accommodation, or something else?",
        "Have you spoken to the Financial Aid Office about your situation?",
        "Are you receiving any financial support currently?",
        "Is the financial stress causing you to consider dropping out?"
    ],
    anger: [
        "What happened that made you feel this way?",
        "Is this a recurring situation, or was this a specific incident?",
        "How did you handle the situation in the moment?",
        "Is there someone specific who's causing these feelings?"
    ],
    general: [
        "How have you been feeling overall this week?",
        "Is there something specific you'd like to talk about?",
        "What does a good day look like for you?",
        "What's one thing you wish were different about your life right now?",
        "Have you been taking care of yourself lately - eating, sleeping, exercising?",
        "Is there anything you've been avoiding dealing with?",
        "What brings you comfort when things get tough?"
    ]
};

/* ──────────────────────── Personalized Recommendations ──────────────────────── */

const RECOMMENDATIONS = {
    stress: [
        "📱 Try a guided meditation app like Insight Timer (free) for 5 minutes before bed",
        "📝 Start a worry journal - write for 5 minutes each evening to offload your thoughts",
        "🏃 Get 20 minutes of movement daily - walking counts!",
        "⏰ Set boundaries on study/work hours - rest is not laziness",
        "🎵 Create a calming playlist for study breaks",
        "🫁 Practice 4-7-8 breathing when stress peaks (inhale 4s, hold 7s, exhale 8s)"
    ],
    anxiety: [
        "📵 Reduce social media time to 30 minutes per day",
        "🧊 Keep ice cubes handy - holding one can interrupt panic",
        "📓 Track your anxiety triggers for one week to find patterns",
        "🎯 Challenge one anxious thought per day using the evidence technique",
        "🧘 Try progressive muscle relaxation before bed",
        "⏰ Establish a consistent morning routine for stability"
    ],
    depression: [
        "☀️ Get 15 minutes of sunlight each morning",
        "🚶 Take a short walk outside, even if it's just 10 minutes",
        "📅 Schedule one enjoyable activity this week, no matter how small",
        "🤝 Reach out to one person today - even a brief message counts",
        "📝 Write down 3 things that went okay today (not great, just okay)",
        "🏥 Consider visiting the MSU Counseling Unit - it's free and confidential"
    ],
    academic_pressure: [
        "📊 Use a planner to map all deadlines for the semester",
        "⏱️ Study in 25-minute focused blocks (Pomodoro technique)",
        "👥 Join or create a study group for your hardest subject",
        "🏫 Visit your lecturer's office hours this week",
        "📚 Use past exam papers for practice under timed conditions",
        "💤 Don't sacrifice sleep for studying - sleep consolidates memory"
    ],
    financial_stress: [
        "🏛️ Visit the Financial Aid Office this week",
        "📋 Check your department's scholarship notice board",
        "💰 Create a simple weekly budget tracking income and expenses",
        "📚 Use the university library's digital resources instead of buying textbooks",
        "🤝 Ask the SRC about emergency student funds"
    ]
};

/* ──────────────────────── Core Functions ──────────────────────── */

/**
 * Get a response that hasn't been used recently for this emotion.
 */
function getUniqueResponse(emotion) {
    const pool = RESPONSES[emotion] || RESPONSES.neutral;
    if (!usedResponseIndices[emotion]) {
        usedResponseIndices[emotion] = [];
    }

    // Find an unused response
    const available = pool
        .map((r, i) => i)
        .filter(i => !usedResponseIndices[emotion].includes(i));

    let idx;
    if (available.length === 0) {
        // Reset and pick randomly
        usedResponseIndices[emotion] = [];
        idx = Math.floor(Math.random() * pool.length);
    } else {
        idx = available[Math.floor(Math.random() * available.length)];
    }

    usedResponseIndices[emotion].push(idx);
    return pool[idx];
}

/**
 * Format response parts into a message string.
 */
function formatResponse(response) {
    if (typeof response === 'string') return response;
    return `${response.empathy}\n\n${response.support}\n\n${response.action}`;
}

/**
 * Get a contextual follow-up for an emotion.
 */
function getFollowUp(emotion) {
    const pool = FOLLOW_UPS[emotion] || FOLLOW_UPS.general;
    return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Get personalized recommendations based on emotion.
 */
function getRecommendations(emotion) {
    const pool = RECOMMENDATIONS[emotion];
    if (!pool) return null;
    // Pick 3 random recommendations
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
}

/**
 * Check if message is a greeting.
 */
function isGreeting(text) {
    const greetings = [
        'hi', 'hello', 'hey', 'howdy', 'greetings', 'good morning',
        'good afternoon', 'good evening', 'sup', 'yo', "what's up",
        'how are you', 'help', 'start', 'hie', 'heya', 'hiya'
    ];
    const lower = text.toLowerCase().trim();
    return lower.length < 30 && greetings.some(g =>
        lower === g || lower.startsWith(g + ' ') || lower.startsWith(g + ',') ||
        lower.startsWith(g + '!') || lower.startsWith(g + '.')
    );
}

/**
 * Check if message is a thank you / farewell.
 */
function isFarewell(text) {
    const farewells = ['thank', 'thanks', 'bye', 'goodbye', 'take care', 'gotta go', 'see you'];
    const lower = text.toLowerCase().trim();
    return farewells.some(f => lower.includes(f));
}

/**
 * Process user message and generate a contextual, personalized response.
 */
export function processMessage(userMessage) {
    turnCount++;

    // Analyze emotion
    const analysis = analyzeEmotion(userMessage);
    trackEmotion(analysis);

    // Store in history
    conversationHistory.push({
        role: 'user',
        text: userMessage,
        analysis,
        timestamp: Date.now()
    });

    // Track topics discussed
    if (analysis.dominantEmotion !== 'neutral') {
        sessionTopics.add(analysis.dominantEmotion);
    }

    let response;

    // Greeting on first turn
    if (turnCount === 1 && isGreeting(userMessage)) {
        response = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    }
    // Farewell
    else if (isFarewell(userMessage)) {
        response = generateFarewell();
    }
    // Crisis (always takes priority)
    else if (analysis.isCrisis) {
        response = formatResponse(RESPONSES.crisis[0]);
    }
    // Emotion-based response
    else if (analysis.dominantEmotion !== 'neutral' && RESPONSES[analysis.dominantEmotion]) {
        const responseObj = getUniqueResponse(analysis.dominantEmotion);
        let base = formatResponse(responseObj);

        // After 3+ turns on same emotion, provide recommendations
        const patterns = getEmotionPatterns();
        if (patterns && patterns.isRecurring && turnCount > 3) {
            const recs = getRecommendations(analysis.dominantEmotion);
            if (recs) {
                base += `\n\n**Personalized recommendations for you:**\n${recs.map(r => `• ${r}`).join('\n')}`;
            }
        }

        // If escalating, add professional referral
        if (patterns && patterns.isEscalating) {
            base += `\n\n**I've noticed a pattern of distress in our conversation.** While I'm here to support you, I'd really encourage you to visit the **MSU Counseling Unit** at the Student Affairs Building. They provide free, confidential professional support. You deserve that level of care.`;
        }

        response = base;
    }
    // Neutral or unclear - provide contextual follow-up
    else {
        if (turnCount <= 2) {
            response = formatResponse(getUniqueResponse('neutral'));
        } else {
            // Use follow-up questions based on conversation context
            const recentEmotion = lastEmotion !== 'neutral' ? lastEmotion : null;
            if (recentEmotion) {
                response = getFollowUp(recentEmotion);
            } else {
                response = getFollowUp('general');
            }
        }
    }

    lastEmotion = analysis.dominantEmotion;

    // Store bot response
    conversationHistory.push({
        role: 'bot',
        text: response,
        timestamp: Date.now()
    });

    return {
        response,
        analysis
    };
}

/**
 * Generate farewell message with session summary.
 */
function generateFarewell() {
    const duration = Math.round((Date.now() - sessionStartTime) / 60000);
    const topics = [...sessionTopics];
    const topicLabels = topics.map(t => getEmotionLabel(t)).join(', ');

    let farewell = "Thank you for talking with me today. 💚 Remember, it takes courage to open up about how you're feeling.\n\n";

    if (topics.length > 0) {
        farewell += `**During our conversation, we discussed:** ${topicLabels}\n\n`;
    }

    farewell += "**Some reminders:**\n";
    farewell += "• You can come back anytime - I'm available 24/7\n";
    farewell += "• If things get really tough, please visit the MSU Counseling Unit\n";
    farewell += "• Track your mood regularly using the Mood Tracker\n";
    farewell += "• Check the Resources page for self-help guides\n\n";
    farewell += "Take care of yourself. You deserve it. 🌿";

    return farewell;
}

/**
 * Get initial greeting message.
 */
export function getGreeting() {
    return GREETINGS[0];
}

/**
 * Reset conversation state for new chat.
 */
export function resetConversation() {
    conversationHistory = [];
    turnCount = 0;
    usedResponseIndices = {};
    lastEmotion = 'neutral';
    userName = null;
    sessionTopics = new Set();
    sessionStartTime = Date.now();
    resetEmotionHistory();
}

/**
 * Get conversation summary data.
 */
export function getConversationSummary() {
    const patterns = getEmotionPatterns();
    return {
        turnCount,
        topics: [...sessionTopics],
        patterns,
        duration: Math.round((Date.now() - sessionStartTime) / 60000),
        history: conversationHistory.length
    };
}

/**
 * Get conversation history.
 */
export function getHistory() {
    return [...conversationHistory];
}
