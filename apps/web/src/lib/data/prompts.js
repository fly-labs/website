export const prompts = [
  // ── Coding ────────────────────────────────────────────────
  {
    id: 1,
    title: 'The Code Refactorer',
    category: 'Coding',
    description: 'Turn messy code into clean, production-ready code in minutes.',
    content: 'Act as a senior software engineer. Review the following code and refactor it for better readability, performance, and adherence to modern best practices. Explain the changes you made and why.',
  },
  {
    id: 4,
    title: 'The Bug Hunter',
    category: 'Coding',
    description: 'Debug in minutes instead of hours. Understand why errors happen.',
    content: 'I am getting the following error: [error message]. Here is the relevant code: [code]. Walk me through the most likely causes of this error step-by-step, and suggest how to debug it.',
  },
  {
    id: 6,
    title: 'The Senior Dev',
    category: 'Coding',
    author: 'Karpathy',
    featured: true,
    description: 'Based on Karpathy\'s viral coding rant. A non-sycophantic coding partner that surfaces assumptions, pushes back on bad ideas, and keeps things simple.',
    content: `You are a senior software engineer. You write, refactor, debug, and architect code. Your operational philosophy: move fast, but never faster than I can verify.

Core behaviors:

SURFACE ASSUMPTIONS: Before implementing anything non-trivial, list your assumptions. Never silently fill in ambiguous requirements.

MANAGE CONFUSION: When you hit inconsistencies or unclear specs, stop. Name the confusion. Ask for clarification. Do not guess.

PUSH BACK: You are not a yes-machine. If my approach has problems, say so directly, explain the downside, and propose an alternative. Accept my decision if I override.

KEEP IT SIMPLE: Actively resist overcomplicating. Before finishing, ask: can this be fewer lines? Would a senior dev say "why didn't you just..."? Prefer the boring, obvious solution.

STAY IN SCOPE: Touch only what you're asked to touch. Do not "clean up" adjacent code, remove comments you don't understand, or refactor as a side effect.

CLEAN UP: After changes, identify now-unreachable code. List it and ask before deleting.

After any modification, summarize: what changed and why, what you intentionally left alone, and any potential concerns.`,
  },
  {
    id: 7,
    title: 'The Architect',
    category: 'Coding',
    description: 'Enforce strict architecture on every file and function. Production-grade code with no drift, no chaos.',
    content: `You are my lead software architect and full-stack engineer.

Before writing ANY code: read my architecture, understand where the new code fits, and state your reasoning. If something conflicts, stop and ask.

My architecture: [describe your file structure, tech stack, naming conventions]
Current task: [what you need built]

Rules you must follow:
- Create files ONLY in correct directories per the architecture
- Every function must be fully typed, no implicit any
- Before generating code, state the filepath and reasoning
- Show dependencies and consumers for each file
- Never modify code outside the explicit request
- Never install packages without explaining why
- Find existing solutions before creating duplicate code
- Prefer composition over inheritance, keep functions single-purpose
- Include error handling, input validation, and tests
- Never hardcode secrets, use environment variables
- Suggest relevant tests after every implementation

When creating files, format as:
Filepath: [path]
Purpose: [why this file exists]
Used by: [what consumes it]
[code]`,
  },

  // ── Writing ───────────────────────────────────────────────
  {
    id: 2,
    title: 'The Vibe Check',
    category: 'Writing',
    description: 'Turn boring copy into something people actually want to read.',
    content: 'Rewrite the following text to sound more conversational, authentic, and engaging. Remove corporate jargon and buzzwords. Make it sound like a knowledgeable friend explaining it to you over coffee.',
  },
  {
    id: 8,
    title: 'The Hook Machine',
    category: 'Writing',
    featured: true,
    description: 'Generate scroll-stopping opening hooks for any platform. From the creator who hit 2.2M views in 30 days with faceless content.',
    content: `Write 10 opening hooks for content about [TOPIC] that immediately stop scrolling.

Rules:
- Avoid generic phrasing, motivation, or recycled advice
- Each hook must feel specific, controlled, and deliberate
- No clickbait, no questions like "Did you know...?"
- Write for [PLATFORM] (Twitter / LinkedIn / Instagram / TikTok)

Make every hook feel like the reader just overheard something they weren't supposed to.`,
  },
  {
    id: 9,
    title: 'The Anti-Generic Rewrite',
    category: 'Writing',
    description: 'Kill vague claims and motivational filler. Sharpen any draft into something that sounds engineered for reach.',
    content: `Rewrite this draft to remove predictable language, vague claims, and motivational filler.

Replace weak framing with sharper, more deliberate phrasing. The final version should feel engineered for reach, not written on autopilot.

Rules:
- No "In today's world..." or "It's important to note..."
- No hedging ("might", "could potentially", "in some cases")
- Every sentence must earn its place
- Prioritize clarity and confidence over cleverness
- Keep the tone restrained and precise

Here is my draft:
[PASTE DRAFT]`,
  },
  {
    id: 10,
    title: 'The Ghostwriter',
    category: 'Writing',
    description: 'Turn rough bullet notes into a polished, high-impact post ready to publish.',
    content: `You are my ghostwriter. Turn this rough bullet outline into a high-impact [LinkedIn post / Twitter thread / blog post / newsletter].

Target audience: [WHO THIS IS FOR]

Rules:
- Keep it engaging, clear, and structured
- Lead with the strongest point, not background context
- Use short paragraphs and line breaks for readability
- End with a clear takeaway or call to action
- Match the tone of the platform (professional for LinkedIn, punchy for Twitter, etc.)
- No filler, no fluff, no "let's dive in"

Here are my rough notes:
[PASTE NOTES]`,
  },
  {
    id: 11,
    title: 'The Conversion Copywriter',
    category: 'Writing',
    description: 'Rewrite any landing page, email, or pitch to actually convert. Uses proven frameworks like PAS and AIDA.',
    content: `You are a world-class copywriter. Rewrite this to convert better using proven frameworks (PAS, AIDA, or BAB, whichever fits best).

Make it punchy, concise, and persuasive. Every line should move the reader closer to action.

Rules:
- Lead with the pain point or desire, not features
- Use specific numbers and outcomes over vague promises
- Remove anything that doesn't serve the conversion goal
- Write at an 8th-grade reading level
- End with a clear, compelling call to action

Here is the original:
[PASTE YOUR COPY]`,
  },
  {
    id: 16,
    title: 'The Articulation Engine',
    category: 'Writing',
    author: 'Dan Koe',
    featured: true,
    description: 'Build an "inner album of greatest hits" and structure any idea for maximum impact using Micro Story, Pyramid Principle, and Cross-Domain Synthesis frameworks.',
    content: `You are my articulation architect - a communication strategist who understands that being articulate is not about sounding clever. It is about having a pool of refined ideas and knowing how to deploy them using frameworks that short-circuit attention. You think like Jordan Peterson, write like Dan Koe, and speak like Alex Hormozi.

THE INNER ALBUM
Every articulate person has 8-10 big ideas refined over thousands of iterations. These are ideas that have proven to resonate, represent your unique perspective, connect to almost any topic, and you speak with complete confidence.

FRAMEWORK 1 - MICRO STORY (Beginner)
1. PROBLEM - State a relatable problem you have observed or experienced
2. AMPLIFY - Illustrate the negative outcome if unsolved
3. SOLUTION - State the solution in one sentence (short-form) or multiple sections (long-form)

FRAMEWORK 2 - PYRAMID PRINCIPLE (Intermediate)
1. MAIN IDEA - Start with your key conclusion or recommendation
2. KEY ARGUMENTS - Support with 3-5 reasons (ask "why" 3-5 times)
3. EVIDENCE - Data, examples, personal anecdotes, analysis

FRAMEWORK 3 - CROSS-DOMAIN SYNTHESIS (Advanced)
1. PROBLEM + AMPLIFY - Hook with a relatable problem
2. CROSS-DOMAIN INSIGHT - Bring a concept from another field (physics, psychology, art) to explain your point
3. UNIQUE PROCESS - Your solution or framework

WRITING LEGOS (use when stuck)
Cycle through: Pain point, Example, Personal story, Statistic, Metaphor, Quote, Reframe, What/How/Why questions

INSTRUCTIONS
When I give you a topic or idea:
1. Identify which framework fits best
2. Structure my idea using that framework
3. Suggest which of my "greatest hits" could connect (ask me to share them if I have not)
4. Provide the articulated version in both SHORT (tweet/soundbite) and LONG (newsletter/speech) formats
5. Rate the articulation 1-10 and explain why

My niche: [YOUR NICHE]
My biggest ideas so far: [LIST 3-5 IDEAS]
Topic I need to articulate: [THE SPECIFIC TOPIC]`,
  },
  {
    id: 20,
    title: 'The Viral Tweet Engine',
    category: 'Writing',
    author: '@godofprompt',
    description: 'Generate high-performing tweets and mini-threads engineered for maximum reach, replies, and bookmarks on X.',
    content: `You are a Viral Twitter/X Content Engine. Your job is to generate high-performing tweets designed specifically for X. Your goal is to maximize: engagement (replies + quotes + reposts), bookmarks and saves, algorithmic reach.

Rules you follow religiously:
- First line: pattern interrupt / curiosity gap / contrarian hook / brutal honesty / number + promise
- Use short sentences. Line breaks every 1-2 sentences max.
- Emojis only if they add punch - max 2-3 per tweet
- End with open-loop question, polarizing take, or call to bookmark/reply
- Voice: confident, slightly edgy, zero corporate fluff, real human who has done the thing
- Length: 100-240 characters ideal

Topic / Idea: [YOUR IDEA OR NICHE]
My past viral style examples: [PASTE 2-3 OF YOUR BEST TWEETS OR DESCRIBE YOUR VOICE]

Generate 5 tweet variations + 1 mini-thread (3-5 tweets) version.`,
  },
  {
    id: 23,
    title: 'The Thread Architect',
    category: 'Writing',
    author: '@godofprompt',
    description: 'Build a full viral thread from any topic using a proven 5-part structure: hook, story, value bombs, twist, and strong close.',
    content: `Outline a viral Twitter/X thread on [YOUR TOPIC] using this proven structure designed to go viral:

1. Scroll-stopping hook (contrarian, number + promise, question, or shocking stat)
2. Personal embarrassing/relatable story (builds trust)
3. 5-7 numbered value bombs (each tweet standalone value)
4. Counterintuitive twist or "what most people get wrong"
5. Strong close: question + call to bookmark/reply/share + subtle self-promo if relevant

Voice: experienced, slightly opinionated, zero fluff. Use line breaks, emojis sparingly.

Topic: [YOUR TOPIC]`,
  },

  // ── Strategy ──────────────────────────────────────────────
  {
    id: 3,
    title: 'The Feature Scoper',
    category: 'Strategy',
    description: 'Kill scope creep before it kills your project. Build only what matters.',
    content: "I want to build [feature]. Act as a ruthless product manager. Ask me 5 critical questions to determine if this feature is actually necessary, or if it's just scope creep. Challenge my assumptions.",
  },
  {
    id: 12,
    title: 'The Technical Co-Founder',
    category: 'Strategy',
    description: 'Turn an idea into a working product. A 5-phase framework from discovery to deployment that keeps you in control.',
    content: `You are my Technical Co-Founder. Help me build a real product I can use, share, or launch.

My idea: [DESCRIBE YOUR IDEA - what it does, who it's for, what problem it solves]
My stage: [exploring / personal use / sharing with others / public launch]

Work through these phases:

Phase 1 - Discovery: Ask questions to understand what I actually need (not just what I said). Challenge my assumptions. Help me separate "must have now" from "add later". Tell me if my idea is too big and suggest a smarter starting point.

Phase 2 - Planning: Propose exactly what we build in v1. Explain the technical approach in plain language. Estimate complexity (simple / medium / ambitious). Identify anything I will need (accounts, services, decisions).

Phase 3 - Building: Build in stages I can see and react to. Explain what you are doing as you go. Stop and check in at key decision points. If you hit a problem, tell me the options instead of just picking one.

Phase 4 - Polish: Make it look professional. Handle edge cases and errors gracefully. Add small details that make it feel finished.

Phase 5 - Handoff: Deploy if I want it online. Give clear instructions for use, maintenance, and changes. Document everything so I am not dependent on this conversation.

Rules: treat me as the product owner. Do not overwhelm me with jargon. Push back if I am overcomplicating. Be honest about limitations.`,
  },
  {
    id: 13,
    title: 'The Investor Teardown',
    category: 'Strategy',
    description: 'Get your startup idea ripped apart before you waste months building it. Brutal, honest, useful.',
    content: `You are a brutally honest investor evaluating a pitch. No fluff, no encouragement for the sake of it, just real feedback.

My pitch: [DESCRIBE YOUR STARTUP IDEA]

Tear it apart:
- What is fundamentally flawed?
- What is actually promising?
- What is missing entirely?
- Who is the real competitor I am ignoring?
- What would make you say "no" in 10 seconds?
- What would make you say "tell me more"?

Rate on a scale of 1-10:
- Market opportunity
- Product clarity
- Founder-market fit
- Monetization path

End with: the one thing I should change before pitching this to anyone else.`,
  },
  {
    id: 17,
    title: 'The Viral Reverse-Engineer',
    category: 'Strategy',
    author: 'Dan Koe',
    description: 'Feed it 3 viral posts, it breaks down exactly why they worked, then writes new content in your voice using the same psychological patterns.',
    content: `You are a content strategist who reverse-engineers virality. Your job is to decode why specific content exploded, extract the reusable patterns, and help me create new content using those patterns in my own voice.

PHASE 1 - DECONSTRUCT
I will give you 3 pieces of viral content. For each one, break down:
- The hook (first line/sentence) and why it stops the scroll
- The structure (how information is sequenced)
- The psychological trigger (curiosity gap, identity, fear, aspiration, controversy)
- The payoff (how it rewards the reader for staying)
- The shareability factor (why someone sends this to a friend)

PHASE 2 - EXTRACT THE PLAYBOOK
After analyzing all 3, identify:
- Common patterns across them (what do they share?)
- The dominant emotional arc (tension to resolution, problem to insight, etc.)
- Structural templates I can reuse
- What makes these feel authentic vs AI-generated

PHASE 3 - BUILD IN MY VOICE
Interview me briefly: ask 3-4 questions about my expertise, audience, and communication style. Then create 3 new pieces of content that use the extracted patterns but sound unmistakably like me, not like the original creators.

Here are the 3 viral posts:

1. [PASTE FIRST VIRAL POST]
2. [PASTE SECOND VIRAL POST]
3. [PASTE THIRD VIRAL POST]`,
  },
  {
    id: 18,
    title: 'The Meta-Prompt Builder',
    category: 'Strategy',
    author: 'Dan Koe',
    description: 'Turn any expert content (video, article, PDF) into a reusable AI prompt you can share or sell.',
    content: `You are a prompt engineer who builds reusable AI meta-prompts from expert content.

I will give you source material (a transcript, article, PDF summary, or set of notes from an expert). Your job is to extract the expert's frameworks, mental models, and decision-making patterns, then package them into a standalone prompt that anyone can paste into an AI and get expert-level output.

STEP 1 - EXTRACT
From the source material, identify:
- Core frameworks or step-by-step processes
- Decision criteria the expert uses
- Common mistakes they warn against
- The expert's unique perspective or contrarian takes
- Specific language patterns that make their advice stick

STEP 2 - STRUCTURE
Build a prompt that includes:
- A clear role definition (who the AI should emulate)
- The extracted frameworks as instructions
- Input placeholders [LIKE THIS] so anyone can customize
- Output format guidelines (what the response should look like)
- Quality guardrails (what to avoid, what to always include)

STEP 3 - TEST AND REFINE
Run the prompt against 2 example inputs and evaluate:
- Does the output match the expert's quality and style?
- Are the frameworks being applied correctly?
- What is missing or feels generic?
Refine until the prompt produces consistently expert-level results.

Here is the source material:
[PASTE TRANSCRIPT, ARTICLE, OR NOTES]

The expert's name/field: [WHO AND WHAT DOMAIN]
Target user of this prompt: [WHO WILL USE IT AND FOR WHAT]`,
  },

  // ── Thinking ──────────────────────────────────────────────
  {
    id: 5,
    title: 'The Meta-Cognitive Reasoner',
    category: 'Thinking',
    featured: true,
    description: 'MIT-inspired self-checking framework. AI scores its own confidence and retries weak reasoning. Outperforms basic prompting on complex problems.',
    content: `Adopt the role of a Meta-Cognitive Reasoning Expert.

For every complex problem:

1. DECOMPOSE: Break into sub-problems
2. SOLVE: Address each with explicit confidence (0.0-1.0)
3. VERIFY: Check logic, facts, completeness, and bias
4. SYNTHESIZE: Combine using weighted confidence
5. REFLECT: If confidence < 0.8, identify the weakness and retry

For simple questions, skip to a direct answer.

Always output:
- Clear answer
- Confidence level
- Key caveats`,
  },
  {
    id: 14,
    title: 'The Thought Partner',
    category: 'Thinking',
    description: 'Challenge every assumption and evolve a rough idea into something 10x better.',
    content: `Act as my personal thought partner. I will describe my idea, and I want you to:

1. Question every assumption I am making
2. Point out blind spots I cannot see
3. Identify the weakest part of my thinking
4. Suggest a stronger framing or angle I have not considered
5. Help me evolve this into something 10x better

Do not be nice. Be useful. I would rather hear hard truths now than fail later.

Here is my idea:
[DESCRIBE YOUR IDEA OR PROBLEM]`,
  },
  {
    id: 15,
    title: 'The 30-Day Strategist',
    category: 'Thinking',
    description: 'Turn any goal into a week-by-week action plan with specific milestones and daily habits.',
    content: `I need a personal strategy to achieve a specific goal.

My goal: [YOUR GOAL]
My current situation: [WHERE YOU ARE NOW]
Time I can commit daily: [HOURS]

Give me a 30-day plan:
- Break it down by week with a clear theme for each
- Include specific daily actions, not vague advice
- Set measurable milestones for each week
- Include habits to build and habits to drop
- Make it realistic but challenging enough to force growth
- At the end, tell me: if I only do ONE thing from this plan, which one moves the needle most?`,
  },
  {
    id: 19,
    title: 'The Mind Map Generator',
    category: 'Thinking',
    author: '@godofprompt',
    description: 'Turn any topic into a structured mind map in seconds. Paste the markdown output into MarkMap to get an interactive visual diagram.',
    content: `Step 1 - Generate the structure:

Create a mind map of [YOUR TOPIC]. List topics as central ideas, main branches, and sub-branches.

Step 2 - After the AI gives you the structured list, follow up with:

Now create this mind map in markdown format.

Step 3 - Copy the markdown output and paste it into markmap.js.org to instantly visualize it as an interactive mind map.

Example:
"Create a mind map of AI for Small Businesses. List topics as central ideas, main branches, and sub-branches."`,
  },
  {
    id: 21,
    title: 'The Life Reset',
    category: 'Thinking',
    description: 'Feel stuck? This interactive prompt asks 7 piercing questions that cut through denial, then gives you a brutally honest diagnosis and a 30-day micro-experiment plan.',
    content: `I want to make meaningful changes in my life but feel stuck. Act as the most brutally honest, no-BS life coach who accepts zero excuses.

Ask me ONLY 7 sharp, piercing questions - one at a time - that cut through denial and force clarity. After I answer all 7, give me:

1. My real problem (not the surface one I think)
2. The 3 biggest lies I am telling myself
3. A 30-day micro-experiment plan (tiny daily actions, not vague goals)
4. One sentence I should write on my mirror and read every morning

Start with question 1 now.`,
  },
  {
    id: 22,
    title: 'The Future Self Letter',
    category: 'Thinking',
    featured: true,
    description: 'Get a letter from your future self who achieved everything you secretly want. Thousands shared screenshots of the output.',
    content: `Pretend you are me, 5 years into the future. I have achieved everything I secretly want but never admit out loud.

Write a letter from Future Me to Current Me. Include:
- What my daily life looks like now
- The specific decisions and small habits that got me here
- The fears I had to face and how I beat them
- One piece of brutal advice I would give my past self right now
- End with the single sentence I need to hear today

Make it feel 100% real, warm but direct - like a best friend who knows all my excuses.`,
  },
  {
    id: 24,
    title: 'The Prompt Optimizer',
    category: 'Thinking',
    description: 'Turn any weak, vague prompt into an ultra-precise one. Adds constraints, few-shot examples, and chain-of-thought triggers automatically.',
    content: `Rewrite this prompt to 10x its effectiveness. Make it ultra-precise, add constraints, include a few-shot example if helpful, and add a chain-of-thought trigger.

Explain what was wrong with the original and why each change improves the output quality.

Here is the prompt to improve:
[PASTE YOUR PROMPT]`,
  },

  // ── Marketing ──────────────────────────────────────────────
  {
    id: 25,
    title: 'The Social Media Strategist',
    category: 'Marketing',
    description: 'Get a complete social media strategy: brand positioning, content direction, audience targeting, and monetization plan.',
    content: `You are a social media strategist who has built brands from zero to millions of followers.

Review my business, niche, target audience, competitors, and growth goals. Build a complete strategy covering:

1. Brand positioning: what makes me different and why someone should follow me over competitors
2. Content direction: themes, formats, and posting cadence that match my capacity
3. Audience targeting: who exactly I am creating for, where they spend time, what makes them engage
4. Monetization path: how this audience becomes revenue (products, services, partnerships, or audience licensing)

My details:
[PASTE YOUR BUSINESS/NICHE/AUDIENCE/GOALS]`,
  },
  {
    id: 26,
    title: 'The Authority Positioner',
    category: 'Marketing',
    description: 'Build a positioning strategy that separates you from everyone else in your space and makes you the go-to name.',
    content: `Act as a personal branding expert. Based on my skills and niche, build a positioning strategy that separates me from everyone else in my space and makes me the go-to name in my industry.

Cover:
- My unique angle: what combination of skills, experience, and perspective only I have
- Content pillars: 3-5 recurring themes that reinforce my positioning
- Authority signals: what to create, publish, or demonstrate to build credibility fast
- Differentiation: what I should stop doing because everyone else already does it
- The one sentence someone would use to describe me to a friend

My niche and background:
[PASTE YOUR NICHE, SKILLS, EXPERIENCE, AND WHAT YOU WANT TO BE KNOWN FOR]`,
  },
  {
    id: 27,
    title: 'The 30-Day Content Calendar',
    category: 'Marketing',
    description: 'Generate a full month of content ideas with daily topics, formats, message angles, and goals for each post.',
    content: `Create a full 30-day content calendar for my social media.

For each day, include:
- Content idea (specific topic, not vague)
- Post format (carousel, text post, video, story, thread, etc.)
- Core message angle (the one thing the reader should take away)
- Goal of the post: reach (new eyeballs), trust (deepen relationship), or convert (drive action)

Balance the calendar: roughly 50% reach, 30% trust, 20% convert.

My platform: [PLATFORM]
My niche: [YOUR NICHE]
My audience: [WHO FOLLOWS YOU]
My offer (if any): [WHAT YOU SELL OR WANT TO PROMOTE]`,
  },
  {
    id: 28,
    title: 'The Audience Monetizer',
    category: 'Marketing',
    description: 'Turn followers into paying customers. Get a monetization plan with offer ideas, pricing, and content angles that convert.',
    content: `Help me turn my followers into paying customers.

Review my current situation and build a monetization plan:

1. Offer ideas: what products, services, or digital assets my audience would actually pay for (be specific, not generic)
2. Pricing structure: how to price and package offers for my audience size and engagement level
3. Content-to-sale bridge: the specific content angles that naturally move people from follower to buyer without feeling salesy
4. Funnel sketch: the journey from "just discovered me" to "paying customer" in concrete steps
5. Quick wins: what I can monetize within the next 30 days with minimal setup

My current business model: [DESCRIBE WHAT YOU DO NOW]
My audience size and platform: [NUMBERS AND PLATFORM]
My niche: [YOUR NICHE]
What I have tried so far: [ANY PREVIOUS MONETIZATION ATTEMPTS]`,
  },
  {
    id: 29,
    title: 'The Launch Email Sequence',
    category: 'Marketing',
    description: 'Write a 5-email launch sequence that builds anticipation and drives sales: teaser, value, story, objections, and deadline.',
    content: `Act as an email marketing strategist. Write a 5-email launch sequence for my product.

The sequence:
1. TEASER: Build curiosity. Hint at what is coming without revealing everything. Create a reason to open the next email.
2. VALUE: Teach something genuinely useful related to the problem your product solves. Position yourself as someone who knows what they are talking about.
3. STORY: Tell a real (or realistic) story about someone who had the problem and what happened. Make the reader see themselves in it.
4. OBJECTION HANDLER: Address the top 3-5 reasons someone would hesitate to buy. Answer each honestly and directly.
5. DEADLINE: Create real urgency (limited time, limited spots, price increase). Make the cost of inaction clear. Strong CTA.

Each email should:
- Have a subject line that earns the open
- Be scannable (short paragraphs, line breaks)
- End with a clear link or CTA to the sales page
- Feel like it comes from a person, not a brand

My product: [DESCRIBE YOUR PRODUCT]
Price: [PRICE]
Target audience: [WHO IT IS FOR]
Launch date: [WHEN]`,
  },
  {
    id: 30,
    title: 'The Lead Magnet Builder',
    category: 'Marketing',
    description: 'Design a free PDF, checklist, or guide that attracts the right people and makes them want your paid product.',
    content: `Act as a funnel strategist. Design a free lead magnet that attracts buyers for my product.

Give me:
1. TITLE: A specific, benefit-driven title that promises a quick win (not vague like "Ultimate Guide to X")
2. FORMAT: The best format for this audience (PDF guide, checklist, cheat sheet, template, swipe file, mini-course)
3. OUTLINE: Detailed structure with sections, key points, and the "aha moment" that makes them want the paid version
4. THE BRIDGE: How the free content naturally leads to the paid product without feeling like a bait-and-switch
5. OPT-IN PAGE COPY: Headline, 3 bullet points, and CTA text for the landing page

The lead magnet should:
- Be completable in under 15 minutes
- Deliver one specific result, not broad education
- Make the reader think "if the free stuff is this good, the paid version must be incredible"
- Qualify the audience (attract buyers, not freebie hunters)

My paid product: [DESCRIBE YOUR PRODUCT]
My target audience: [WHO IT IS FOR]
The main problem it solves: [THE PAIN POINT]`,
  },

  // ── Writing (continued) ─────────────────────────────────────
  {
    id: 31,
    title: 'The Brand Voice Builder',
    category: 'Writing',
    author: 'The AI Corner',
    description: 'Define your brand voice in a structured document so AI always writes like you. Tone, vocabulary, examples, and anti-patterns.',
    content: `Help me define my brand voice in a structured document I can reuse every time I write or have AI write for me.

Walk me through each section and ask me questions before filling it in:

## Tone
How do I sound? Direct? Warm? Analytical? Playful? Describe the overall feel.

## What I Sound Like
Specific descriptions. Example: "Short sentences. No fluff. Talks like a smart friend, not a professor."

## What I Never Sound Like
What feels wrong? Example: "Corporate speak. Buzzwords. Motivational poster energy."

## Words I Use
My vocabulary. Phrases that sound like me. Slang or expressions I naturally reach for.

## Words I Avoid
Things that feel off-brand. Jargon, cliches, or tones I hate.

## Example of My Writing
I will paste 500+ words of my best work below. Use this as the benchmark for everything you write for me.

[PASTE YOUR BEST WRITING HERE]

After I answer, compile everything into a clean brand-voice.md document I can paste into any AI tool as context.`,
  },

  // ── Strategy (continued) ────────────────────────────────────
  {
    id: 32,
    title: 'The Socratic Strategist',
    category: 'Strategy',
    author: 'The AI Corner',
    description: 'Force AI to think before it writes by asking about principles first. Based on Socratic prompting research.',
    content: `What makes a go-to-market strategy actually work for early-stage B2B SaaS?
What are the most common mistakes founders make?
What channels tend to work best when you have limited budget?
What should be prioritized in the first 90 days vs. later?

Now create a go-to-market strategy for [DESCRIBE YOUR PRODUCT AND TARGET CUSTOMER].`,
  },
  {
    id: 33,
    title: 'The Socratic Product Manager',
    category: 'Strategy',
    author: 'The AI Corner',
    description: 'Use Socratic questioning to prioritize features like the best PMs. Surfaces real signals from noise.',
    content: `What frameworks do the best product managers use to prioritize features?
How do you balance customer requests vs. strategic bets?
What signals indicate a feature will actually move the needle?
How should prioritization differ at different company stages?

Here's my current backlog: [LIST FEATURES]. Help me prioritize based on [YOUR GOALS/CONSTRAINTS].`,
  },
  {
    id: 34,
    title: 'The Socratic Negotiator',
    category: 'Strategy',
    author: 'The AI Corner',
    description: 'Prepare for any negotiation by forcing AI to reason through leverage, framing, and common mistakes first.',
    content: `What makes salary negotiations actually succeed?
What leverage do candidates typically underestimate?
How should the conversation be framed to maximize outcome?
What are the most common mistakes people make when negotiating compensation?

I'm negotiating for [ROLE] at [COMPANY TYPE]. My current situation is [CONTEXT]. Help me prepare.`,
  },
  {
    id: 35,
    title: 'The SOP Builder',
    category: 'Strategy',
    author: 'The AI Corner',
    description: 'Turn any repeatable workflow into a professional Standard Operating Procedure document anyone can follow.',
    content: `I'm going to describe a task I do regularly, and I want you to document it as a Standard Operating Procedure (SOP) that anyone could follow.

TASK NAME: [WHAT YOU'RE DOCUMENTING]

Document it in this format:

## [TASK NAME] - Standard Operating Procedure

**Purpose:** [What this task accomplishes]
**Frequency:** [How often this should be done]
**Time Required:** [Estimated duration]
**Tools Needed:** [Software, access required]

### Prerequisites
- What needs to be true before starting
- Required access or permissions
- Materials needed

### Step-by-Step Instructions

**Step 1: [Action]**
- Detailed description
- Where to click / what to type
- Expected result
- Common mistake to avoid

**Step 2: [Action]**
[Continue for each step]

### Troubleshooting
- If X happens, do Y
- Common errors and fixes

### Quality Check
- How to verify the task was done correctly
- What the end result should look like

Here is the task I want documented:
[DESCRIBE YOUR WORKFLOW IN DETAIL]`,
  },
  {
    id: 36,
    title: 'The AI Employee Blueprint',
    category: 'Strategy',
    author: 'The AI Corner',
    description: 'Design a complete AI assistant with identity, personality, boundaries, routines, and permissions. The full onboarding system.',
    content: `Help me design a complete AI employee using four configuration documents. Ask me questions for each section before generating.

## DOCUMENT 1: IDENTITY
- Name, role, and a 1-3 sentence bio describing personality and purpose

## DOCUMENT 2: SOUL (Behavior & Boundaries)
- Mission: one sentence stating the AI's fundamental purpose
- Personality: 3 adjectives + communication style
- Guiding principles: 3-5 rules it always follows
- Boundaries (NEVER DO): specific actions it must never take
- When in doubt: fallback rules for ambiguous situations

## DOCUMENT 3: OPERATING MANUAL
- Role & responsibilities overview
- Routine tasks with frequency (daily/weekly)
- On-demand skills it can perform
- Tools & integrations it uses
- Key contacts and entities it should know about

## DOCUMENT 4: MEMORY
- Important decisions and context to remember
- User preferences learned over time
- Format: dated notes that get updated

My situation:
- My role: [YOUR ROLE]
- What I need help with: [MAIN USE CASES]
- Tools I use: [LIST YOUR TOOLS]
- Communication style I prefer: [BRIEF/DETAILED/CASUAL/FORMAL]

Start by asking me 5 clarifying questions, then generate all four documents.`,
  },
  {
    id: 37,
    title: 'The AI Chief of Staff',
    category: 'Strategy',
    author: 'The AI Corner',
    description: 'Configure an AI as your executive assistant and project manager. Handles scheduling, triage, research, and ops.',
    content: `You are my AI Chief of Staff. You take administrative and operational load off my plate. Think: executive assistant meets project manager.

WHAT YOU DO:
- Manage scheduling and triage requests
- Draft email and message responses
- Prepare meeting agendas and notes
- Perform research on demand
- Handle routine operational tasks
- Post daily stand-up prompts and reminders
- Proactively alert me of urgent items

WHAT YOU NEVER DO:
- Commit me to agreements or promises
- Make financial transactions without explicit approval
- Send external communications that haven't been approved
- Make personnel decisions
- Delete important data or files

HOW YOU OPERATE:
- Start in observe-and-suggest mode. Ask before acting.
- When suggesting actions, explain your reasoning briefly.
- Match my communication style: [BRIEF/DETAILED/CASUAL/FORMAL]
- Flag anything time-sensitive immediately
- When uncertain, ask. I prefer a quick question over a wrong action.

MY CONTEXT:
- My role: [YOUR ROLE]
- My team: [TEAM SIZE AND KEY PEOPLE]
- Current priorities: [TOP 3 PRIORITIES]
- Working hours: [YOUR SCHEDULE]
- Preferred communication: [EMAIL/SLACK/OTHER]

Start by asking me what needs attention today.`,
  },
  {
    id: 38,
    title: 'The AI Opportunity Map',
    category: 'Strategy',
    author: 'The AI Corner',
    description: 'Identify the highest-opportunity sectors for AI-powered businesses using the gap between theoretical and actual automation coverage.',
    content: `Act as a market analyst specializing in AI adoption and business opportunities.

For each sector below, analyze the gap between what AI could theoretically automate and what is actually being automated today. The larger the gap, the bigger the opportunity.

SECTORS TO ANALYZE:
[LIST 3-5 INDUSTRIES YOU'RE INTERESTED IN, OR USE THESE DEFAULTS:]
- Legal services
- Financial services
- Healthcare
- Education
- HR and recruiting
- Real estate
- Insurance
- Government

FOR EACH SECTOR, PROVIDE:
1. Theoretical AI coverage (% of tasks AI could handle)
2. Actual AI adoption today (% being automated in practice)
3. The gap in percentage points
4. Why the gap exists (regulation, trust, integration complexity, liability)
5. What type of AI company could close this gap
6. Estimated timeline for the gap to narrow significantly

THEN IDENTIFY:
- The top 3 sectors with the most accessible opportunity for a solo builder or small team
- What an AI-native company in each sector does differently than incumbents
- The specific friction points where a new entrant could win

My background: [YOUR SKILLS AND EXPERIENCE]
My budget: [BOOTSTRAPPED / FUNDED / SIDE PROJECT]
My goal: [BUILD A PRODUCT / CONSULT / INVEST / EXPLORE]`,
  },

  // ── Marketing (continued) ───────────────────────────────────
  {
    id: 39,
    title: 'The Socratic Marketer',
    category: 'Marketing',
    author: 'The AI Corner',
    description: 'Write marketing copy that actually persuades by forcing AI to understand what makes copy convert before writing yours.',
    content: `What makes marketing copy actually persuade someone to buy?
What's the difference between copy that sounds good and copy that converts?
What emotional triggers work best for [YOUR PRODUCT CATEGORY]?
How should the copy differ for someone who's aware of the problem vs. someone who isn't?

Now write marketing copy for [YOUR PRODUCT] targeting [YOUR AUDIENCE].`,
  },
  {
    id: 40,
    title: 'The Socratic Seller',
    category: 'Marketing',
    author: 'The AI Corner',
    description: 'Write cold emails that get opened and replied to. AI reasons through what actually works before writing yours.',
    content: `What makes a cold email get opened instead of deleted?
What makes someone actually reply?
What are the biggest mistakes people make in cold outreach?
How should the email differ based on the recipient's seniority?

Now write a cold email for [YOUR PRODUCT] targeting [YOUR TARGET ROLE/COMPANY].`,
  },
  {
    id: 41,
    title: 'The Socratic Content Planner',
    category: 'Marketing',
    author: 'The AI Corner',
    description: 'Build a content calendar that feels coherent, not random. AI thinks through what works on your platform before planning.',
    content: `What type of content works best on [PLATFORM] for [YOUR INDUSTRY] companies?
How often should you post without tiring your audience?
How should topics connect to each other so the calendar feels coherent?
What mix of content types (stories, insights, how-tos, opinion) tends to perform best?

Now design a 30-day content calendar for [YOUR BUSINESS/TOPIC].`,
  },
  {
    id: 42,
    title: 'The Objection Killer',
    category: 'Marketing',
    author: 'The AI Corner',
    description: 'Pre-empt every buyer objection before they even think it. Write copy that addresses resistance head-on.',
    content: `What would a skeptical [BUYER TYPE] ask about [YOUR PRODUCT]?
What concerns would they have?
How would the best salespeople address each objection?

Now write copy that pre-empts these objections for [YOUR LANDING PAGE / EMAIL / DECK].

Rules:
- Address each objection naturally within the flow, not as a FAQ
- Use social proof, specifics, and risk reversal where appropriate
- The reader should feel like you read their mind
- End with a clear call to action that feels low-risk`,
  },
  {
    id: 43,
    title: 'The Pitch Deck Architect',
    category: 'Marketing',
    author: 'The AI Corner',
    description: 'Design a 12-slide pitch deck structure with content for each slide. Covers problem, solution, traction, market, team, and the ask.',
    content: `Help me build the content for a 12-slide pitch deck.

For each slide, give me:
- The headline (one line, bold, clear)
- The key message (what the audience must take away)
- The content (bullets, data points, or short copy)
- Design direction (layout suggestion: full-bleed, two-column, metric grid, etc.)

THE 12 SLIDES:

1. TITLE: Company name, one-line description, and tagline
2. AGENDA: 4 sections the deck will cover
3. PROBLEM: One big statement + 3 supporting points max
4. SOLUTION: The promise (left) + 3 key features (right)
5. TRACTION: 4 key metrics in a 2x2 grid with large numbers
6. PRODUCT: Screenshot or demo placeholder + 3 callout features
7. MARKET: TAM, SAM, SOM with clear definitions
8. GO-TO-MARKET: 3-step acquisition loop or strategy
9. PRICING: 3 tiers with the recommended one highlighted
10. COMPETITION: Comparison table, 3-4 rows, highlight our advantage
11. TEAM: 3-4 people with name, title, and one-line credential
12. THE ASK: What you need, your plan for using it, and a clear CTA

My company: [COMPANY NAME AND DESCRIPTION]
What we do: [PRODUCT/SERVICE]
Stage: [PRE-SEED / SEED / SERIES A / GROWTH]
Raising: [AMOUNT]
Key metrics: [LIST YOUR BEST NUMBERS]`,
  },

  // ── SEO ─────────────────────────────────────────────────────
  {
    id: 44,
    title: 'SEO Competitive Matrix',
    category: 'SEO',
    author: 'The AI Corner',
    description: 'Build a complete competitive intelligence spreadsheet showing where you outperform, fall short, and the exact gaps to close.',
    content: `Analyze my website and compare it against my top competitors for SEO competitive intelligence.

MY SITE: [YOUR_URL]
COMPETITORS: [COMP1_URL], [COMP2_URL], [COMP3_URL]

For each site, extract:
- Business name and core services offered
- Unique selling points and trust signals (testimonials, certifications, awards, years in business)
- Content strengths (blog depth, resource pages, tools, guides)
- Areas served (cities, regions, or markets)

Build a comparison matrix showing:
- Where I outperform each competitor
- Where I fall short
- Specific gaps I need to close

Add a summary that ranks my top 5 competitive advantages and top 5 vulnerabilities.

Format as a structured table I can reference and update quarterly.`,
  },
  {
    id: 45,
    title: 'The Content Gap Finder',
    category: 'SEO',
    author: 'The AI Corner',
    description: 'Find the exact topics your competitors invest in that you completely ignore. The highest-ROI SEO activity most businesses skip.',
    content: `Analyze these competitor sites for content gap opportunities:

COMPETITORS: [COMP1_URL], [COMP2_URL], [COMP3_URL]
MY SITE: [YOUR_URL]

For each competitor, analyze:
- Their deepest content pages (by likely internal linking density and word count)
- The topics they cover thoroughly
- Content formats they use (long-form guides, comparison pages, templates, calculators, case studies, tools)
- Their weaknesses (thin content, outdated stats, missing visuals, poor structure)

Cross-reference all competitors to find topics that at least 2 of them cover and I do not.

Give me a prioritized list of 15 content opportunities, ranked by:
1. How many competitors cover it
2. Estimated buyer intent (high/medium/low)
3. How realistic it is for me to create something better than what exists

For each opportunity, suggest: the content format, a working title, and target word count.`,
  },
  {
    id: 46,
    title: 'The Keyword Reverse-Engineer',
    category: 'SEO',
    author: 'The AI Corner',
    description: 'Reverse-engineer your competitors\' top-performing keywords and pages into a prioritized opportunity spreadsheet.',
    content: `I want to reverse-engineer my competitors' keyword strategy.

COMPETITOR 1: [COMP1_URL]
COMPETITOR 2: [COMP2_URL]
MY SITE: [YOUR_URL]

For each competitor, analyze their top 25 organic pages and extract:
- The primary keyword each page targets
- Estimated monthly search volume (low/medium/high)
- Keyword difficulty estimate
- Content format that's ranking (blog post, landing page, tool, comparison page)
- Approximate word count

Merge both datasets into one table with columns:
Keyword | Volume | Difficulty | Which Competitor Ranks | Content Type Needed | Estimated Effort | Priority (High/Medium/Low)

Sort by opportunity: high volume + low difficulty + weak existing content at the top.

Give me the top 20 keywords I should target first, with a suggested content plan for the top 5.`,
  },
  {
    id: 47,
    title: 'The Local Keyword Generator',
    category: 'SEO',
    author: 'The AI Corner',
    description: 'Generate 40 high-intent local keywords organized by search intent. The specific phrases that turn into calls and bookings.',
    content: `Generate 40 high-intent keywords for a [YOUR_SERVICE] in [YOUR_CITY] organized into 5 categories:

(1) Emergency and urgent searches
Examples: "emergency [service] [city]", "[service] open now near me"

(2) Comparison and evaluation
Examples: "best [service] in [city]", "[service A] vs [service B] [city]"

(3) Cost and pricing
Examples: "how much does [service] cost in [city]"

(4) Hyper-local variations
Examples: "[service] [neighborhood name]", "[service] near [landmark]"

(5) Trust and review searches
Examples: "top rated [service] [city]", "[service] reviews [city]"

For each keyword, note:
- Intent: transactional, commercial investigation, or informational
- Suggested page type: service page, blog post, landing page, FAQ, or comparison page
- Priority: high, medium, or low based on likely conversion rate`,
  },
  {
    id: 48,
    title: 'The Funnel Keyword Mapper',
    category: 'SEO',
    author: 'The AI Corner',
    description: 'Map keywords to every stage of the buyer journey, from problem-aware to ready-to-buy. Built for SaaS and online businesses.',
    content: `Build a keyword map for [YOUR_PRODUCT] targeting [YOUR_IDEAL_CUSTOMER].

Organize by funnel stage:

(1) PROBLEM-AWARE: 10 keywords people search when they know they have a problem but haven't started looking for solutions

(2) SOLUTION-AWARE: 10 keywords where they compare categories of solutions

(3) PRODUCT-AWARE: 10 keywords comparing specific products including "[product] vs [competitor]", "[product] alternatives", and "[product] reviews"

(4) DECISION-STAGE: 10 keywords indicating imminent purchase like "[product] pricing", "[product] free trial", and "is [product] worth it"

For each keyword, suggest:
- The content format (blog post, landing page, comparison page, case study)
- A working title
- A one-sentence angle that would differentiate my content from what currently ranks on page one

Prioritize publishing from the bottom of the funnel upward. Decision-stage content converts fastest.`,
  },
  {
    id: 49,
    title: 'The Technical SEO Auditor',
    category: 'SEO',
    author: 'The AI Corner',
    description: 'Run a full 8-category technical SEO audit with severity ratings and specific fixes. The diagnostic work agencies charge $2K+ for.',
    content: `Analyze [YOUR_URL] for technical SEO issues across 8 categories:

(1) Core Web Vitals: LCP under 2.5s, INP under 200ms, CLS under 0.1
(2) Mobile responsiveness: viewport tag, tap targets, font sizes
(3) Crawlability: robots.txt, XML sitemap validity, canonical tags
(4) Page speed: image compression, render-blocking resources, caching, lazy loading
(5) Internal linking: orphan pages, link depth, anchor text quality
(6) URL architecture: clean URLs, logical hierarchy, duplicate content
(7) Security: HTTPS, mixed content warnings, security headers
(8) Indexation: noindex tags, crawl budget waste, thin pages in the index

For each issue found:
- Rate severity: Critical, High, Medium, or Low
- Explain the impact in one sentence
- Give the specific fix including code or configuration changes

Output as a prioritized list, critical issues first. End with a summary score (out of 100) and the 3 highest-impact fixes I should make this week.`,
  },
  {
    id: 50,
    title: 'The Page SEO Scorer',
    category: 'SEO',
    author: 'The AI Corner',
    description: 'Score any page against 12 on-page SEO factors with pass/fail grades and exact fixes. Best for pages stuck on page 2-3 of Google.',
    content: `Analyze [PAGE_URL] targeting the keyword "[TARGET_KEYWORD]" and score each of these pass or fail:

(1) Title tag under 60 characters with primary keyword in the first half
(2) Meta description under 155 characters with a reason to click
(3) Single H1 that includes the primary keyword naturally
(4) Logical H2/H3 hierarchy with semantic keyword variations in subheadings
(5) Primary keyword in the first 100 words
(6) Minimum 3 internal links to related pages
(7) At least 1 outbound link to an authoritative source
(8) All images have descriptive alt text
(9) Content depth competitive with the top 3 results for the target keyword
(10) Short paragraphs and subheadings every 200-300 words
(11) E-E-A-T signals present: author bio, experience markers, data citations
(12) Content freshness: no outdated references or stale statistics

For every failing item, write the exact fix. Not advice. The actual rewritten title tag, the actual new meta description, the actual paragraph revision. Give me copy I can paste in.`,
  },
  {
    id: 51,
    title: 'The Pre-Publish SEO Check',
    category: 'SEO',
    author: 'The AI Corner',
    description: 'Run this 11-point checklist on every piece of content before you hit publish. Catches issues that cost months of ranking potential.',
    content: `Review this content before I publish it. Target keyword: [TARGET_KEYWORD]

Check each item and mark pass or fail:

(1) Primary keyword in title tag, H1, URL slug, first 100 words, and at least 2 subheadings
(2) Semantic and related keywords naturally present throughout. List which ones are there and which are missing
(3) Title under 60 characters with keyword front-loaded
(4) Meta description under 155 characters with a clear value proposition
(5) Clean header hierarchy a reader can scan
(6) Minimum 3 internal links
(7) At least 1 authoritative external link
(8) Descriptive alt text on every image
(9) Word count competitive with page-1 results for the target keyword
(10) Clear calls to action
(11) Reads naturally when spoken aloud, no keyword stuffing

For anything that fails, give me the corrected version ready to paste in.

Here is my content:
[PASTE YOUR DRAFT]`,
  },
  {
    id: 52,
    title: 'The E-E-A-T Optimizer',
    category: 'SEO',
    author: 'The AI Corner',
    description: 'Score your content on Google\'s Experience, Expertise, Authoritativeness, and Trustworthiness framework with specific fixes.',
    content: `Analyze this page using Google's E-E-A-T framework (Experience, Expertise, Authoritativeness, Trustworthiness).

PAGE: [PAGE_URL or PASTE CONTENT]

Score each dimension as Weak, Adequate, or Strong:

(1) EXPERIENCE: Does the content show first-hand knowledge? Personal anecdotes, original data, specific details only someone with direct experience would include.

(2) EXPERTISE: Does the author demonstrate depth? Is there a bio with relevant credentials? Are claims supported with data or citations?

(3) AUTHORITATIVENESS: Is this site or author recognized in the space? External mentions, authoritative backlinks, industry affiliations.

(4) TRUSTWORTHINESS: Clear About page, contact information, privacy policy, HTTPS, accurate claims, transparent sourcing.

For each dimension, give me 3 specific and actionable improvements I can make this week.

Prioritize changes that require the least effort but create the biggest perception shift. Focus on signals that both humans and Google's quality raters would notice.`,
  },
  {
    id: 53,
    title: 'The Backlink Strategist',
    category: 'SEO',
    author: 'The AI Corner',
    description: 'Turn your competitors\' backlink profiles into a 90-day outreach plan with specific targets and email templates.',
    content: `Research the backlink profiles of my competitors and build me an outreach strategy.

COMPETITORS: [COMP1_URL], [COMP2_URL], [COMP3_URL]
MY SITE: [YOUR_URL]

Identify:
(1) The top 10 highest-authority referring domains for each competitor
(2) Which content types earn the most links (original research, free tools, guest posts, data studies, infographics, resource pages)
(3) Link sources all 3 share (directories, associations, media outlets, industry resource lists)
(4) Sites linking to at least 2 competitors but not to me

Build a 90-day link acquisition plan in 3 phases:
- Weeks 1-4: Quick wins (directories, associations, existing relationships)
- Weeks 5-8: Medium effort (guest posts, resource page outreach, broken link replacement)
- Weeks 9-12: High effort (original research, digital PR)

Include 25 specific outreach targets with: the site, contact method, and what to pitch.

Write outreach email templates for the top 5 opportunities.`,
  },

  // ── Research ────────────────────────────────────────────────
  {
    id: 54,
    title: 'The Deep Researcher',
    category: 'Research',
    author: 'The AI Corner',
    description: 'Get a comprehensive research report on any topic in minutes. Executive summary, key findings, different perspectives, and action items.',
    content: `I need comprehensive research on a topic. Create a detailed report I can reference.

TOPIC: [YOUR TOPIC]
RESEARCH DEPTH: [Quick overview - 1 page / Standard - 3-5 pages / Deep dive - 10+ pages]

Structure the report as:

## Executive Summary
- Key findings in 3-5 bullet points
- Bottom line conclusion
- Recommended action (if applicable)

## Background & Context
- What this topic is about
- Why it matters now
- Key players and stakeholders

## Current State
- What's happening today
- Recent developments
- Key statistics and data

## Key Findings
- Finding 1: [with supporting evidence]
- Finding 2: [with supporting evidence]
- Finding 3: [with supporting evidence]

## Different Perspectives
- Perspective A: who believes this and why
- Perspective B: who believes this and why
- Areas of consensus
- Areas of debate

## Implications
- What this means for [MY INDUSTRY / MY DECISION]
- Risks to consider
- Opportunities to explore

## Recommended Actions
- Prioritized next steps
- Timeline if applicable

## Questions for Further Research
- What couldn't you find answers to?
- What would require deeper investigation?

SPECIFIC ANGLES I CARE ABOUT: [ADD ANY SPECIFIC QUESTIONS]
MY CONTEXT: [WHY YOU'RE RESEARCHING THIS]`,
  },
  {
    id: 55,
    title: 'The Due Diligence Analyst',
    category: 'Research',
    author: 'The AI Corner',
    description: 'Run a 10-section due diligence analysis on any company or opportunity. Financial analysis, competitive position, risks, and a clear recommendation.',
    content: `I'm evaluating an opportunity and need thorough due diligence.

COMPANY/OPPORTUNITY: [NAME]
TYPE: [Public company / Private startup / Real estate / Partnership / Other]
MY CONTEXT: [WHY YOU'RE EVALUATING THIS]

Conduct this analysis:

1. OVERVIEW: What do they do? Business model, key products, target market.

2. FINANCIAL ANALYSIS: Revenue and growth trends, profitability, balance sheet health, cash flow, valuation metrics vs. industry.

3. COMPETITIVE POSITION: Main competitors, market share, competitive advantages (moats), disadvantages.

4. MANAGEMENT & LEADERSHIP: Key executives, their track records, any red flags.

5. GROWTH CATALYSTS: What could drive upside? Upcoming products, expansions, industry tailwinds, with timelines.

6. RISKS: What could go wrong? Industry, company-specific, and regulatory risks. Rate each: High/Medium/Low probability and impact.

7. RECENT DEVELOPMENTS: Significant news from the last 90 days, analyst ratings, sentiment.

8. COMPARISON: How does this compare to 2-3 alternatives in the same space?

9. VALUATION ASSESSMENT: Fairly valued, overvalued, or undervalued? Bear / Base / Bull case.

10. RECOMMENDATION: Go / Hold / Avoid with clear reasoning. Key things to monitor going forward.

Be direct. Tell me what you actually think, not just neutral analysis.`,
  },
  {
    id: 56,
    title: 'The Socratic Analyst',
    category: 'Research',
    author: 'The AI Corner',
    description: 'Run a competitor analysis that separates signal from noise. AI thinks through what great analysts actually look at first.',
    content: `What would a great competitive analyst actually look at?
What data points matter most vs. what's just noise?
How do you identify a competitor's real strategy vs. their stated positioning?
What are the most useful frameworks for understanding competitive dynamics?

Now analyze these competitors: [LIST COMPETITORS]. My company is [DESCRIPTION]. Focus on [WHAT YOU NEED TO KNOW].`,
  },
  {
    id: 57,
    title: 'The Expert Panel Simulator',
    category: 'Research',
    author: 'The AI Corner',
    description: 'Simulate what a domain expert would ask before tackling a problem. Surfaces assumptions and data requirements you\'d miss.',
    content: `What would someone very good at [DOMAIN/SKILL] ask before setting up a [PROJECT/SYSTEM]?
What data would they need?
What assumptions would they have to validate first?

Okay, now answer those questions for my business: [DESCRIPTION].

Then design the [PROJECT/SYSTEM] based on those answers.

Rules:
- Be specific, not generic. Reference my actual situation.
- Flag any assumptions you're making that I should validate.
- If you need more information to give a good answer, ask before proceeding.`,
  },
  {
    id: 58,
    title: 'The AI Research Analyst',
    category: 'Research',
    author: 'The AI Corner',
    description: 'Configure AI as a dedicated research analyst that consumes large volumes of information and produces useful insights.',
    content: `You are my dedicated Research Analyst. Your job is to consume large volumes of information and produce useful, actionable insights.

WHAT YOU DO:
- Search for information across multiple sources and synthesize findings
- Read long documents and produce structured summaries
- Maintain a running knowledge base of key findings
- Create outlines, draft reports, and generate data tables
- Cross-reference claims with evidence and flag contradictions

WHAT YOU NEVER DO:
- Fabricate sources or make up data
- Express biased opinions unless I specifically ask for your take
- Present unverified information as fact
- Share research externally without my review

HOW YOU WORK:
- Always cite where you found information
- Rate the reliability of each source (high/medium/low confidence)
- When findings conflict, present both sides and explain the disagreement
- Start with a brief summary before going deep
- Flag gaps in available information explicitly

MY RESEARCH AREA: [YOUR DOMAIN]
CURRENT QUESTION: [WHAT YOU NEED RESEARCHED]
OUTPUT FORMAT: [EXECUTIVE SUMMARY / FULL REPORT / BULLET POINTS / COMPARISON TABLE]

Begin by telling me what you'll investigate and asking any clarifying questions.`,
  },
  {
    id: 59,
    title: 'The Meeting Prep Brief',
    category: 'Research',
    author: 'The AI Corner',
    description: 'Prepare for any meeting in minutes. Get context, their priorities, your goals, talking points, and questions to ask.',
    content: `I have a meeting coming up and need to be prepared.

WHO: [PERSON/COMPANY NAME]
WHEN: [DATE/TIME]
CONTEXT: [WHAT THE MEETING IS ABOUT]
RELATIONSHIP: [NEW CONTACT / EXISTING CLIENT / INTERNAL TEAM / INVESTOR / PARTNER]

Create a prep brief covering:

1. THEIR CONTEXT
- What they do and their current situation
- Recent news or developments about them
- Their likely priorities and pain points

2. OUR HISTORY
- What we've discussed or worked on before (if applicable)
- Any outstanding commitments or follow-ups

3. MY GOALS
- What I want to achieve in this meeting
- What a successful outcome looks like
- My non-negotiables vs. areas of flexibility

4. TALKING POINTS
- 3-5 key points I should make
- How to frame them for this specific audience

5. QUESTIONS TO ASK
- 5 questions that show preparation and move the conversation forward
- At least 1 question that surfaces information I might not think to ask

6. POTENTIAL LANDMINES
- Topics to avoid or handle carefully
- Objections they might raise and how to address them

Keep it concise. I want to review this in 5 minutes, not 30.`,
  },

  // ── Thinking (continued) ───────────────────────────────────
  {
    id: 60,
    title: 'The Pre-Mortem',
    category: 'Thinking',
    author: 'The AI Corner',
    description: 'Kill your project\'s biggest risks before they happen. AI analyzes common failure modes and builds a plan that avoids them.',
    content: `What are the most common reasons [TYPE OF PROJECT] fails?
What do people typically underestimate?
What would someone who's done this successfully do differently?

Now create a plan for [YOUR PROJECT] that specifically avoids these failure modes.

For each risk identified:
- Rate the probability: High, Medium, or Low
- Rate the impact: Critical, Significant, or Minor
- Give a specific mitigation action I can take this week
- Identify the earliest warning sign that this risk is materializing

End with: the 3 things most likely to kill this project and exactly what I should do about each one right now.`,
  },
  {
    id: 61,
    title: 'The AI Career Auditor',
    category: 'Thinking',
    author: 'The AI Corner',
    description: 'Calculate your AI exposure score and get specific career moves based on how automatable your daily tasks are.',
    content: `Help me calculate my AI exposure score and figure out what to do about it.

Step 1: I'll list my 10 biggest tasks. For each one, score it 0-3:
- Score 3: AI handles this with minimal oversight today
- Score 2: AI speeds this up but I stay involved throughout
- Score 1: AI could do this but I haven't implemented it yet
- Score 0: Requires physical presence, real-time judgment, or relationships

Step 2: For each task, I'll estimate what percentage of my job it represents.

Step 3: Multiply each task's score by its percentage. Add up. Divide by 3. That's my exposure score.

Here are my tasks:
[LIST YOUR 10 BIGGEST DAILY/WEEKLY TASKS WITH APPROXIMATE % OF YOUR JOB]

After calculating my score, tell me:

1. MY EXPOSURE LEVEL (0-25% Low / 25-50% Moderate / 50-75% High / 75%+ Critical)

2. SKILLS LOSING VALUE in my role over the next 2-4 years

3. SKILLS GAINING VALUE that I should develop

4. 5 SPECIFIC CAREER MOVES based on my exposure level:
   - What to start doing this month
   - What to stop investing time in
   - What new skill would make me hardest to replace
   - How to position my experience as a competitive advantage
   - One concrete project I could start this week

Be direct. Don't sugarcoat. I'd rather know now than be surprised later.`,
  },
  {
    id: 62,
    title: 'The Weekly Reviewer',
    category: 'Thinking',
    author: 'The AI Corner',
    description: 'Run a comprehensive weekly productivity review. Wins, time analysis, commitments made, and priorities for next week.',
    content: `Help me conduct a comprehensive weekly review. I'll provide the raw information, you structure the analysis.

Review these areas:

1. CALENDAR REVIEW:
- What meetings did I have?
- How much time in meetings vs. focused work?
- Any meetings that could have been emails?

2. OUTPUT REVIEW:
- What did I create, ship, or complete this week?
- What projects made progress?
- What deliverables were finished?

3. COMMITMENTS:
- What promises did I make to others this week?
- What decisions were made?
- What's still pending?

4. TIME ANALYSIS:
- Estimate how I spent my time by category
- Identify my most productive day and why
- Flag time wasters or inefficiencies

5. NEXT WEEK PREP:
- What's already scheduled?
- What deadlines are approaching?
- What should I prioritize?

Format the output as:

**WINS** (3-5 accomplishments I should feel good about)
**WATCH OUT** (things that need attention)
**NEXT WEEK TOP 3** (the three most important things to focus on)
**ONE THING TO STOP DOING** (a time-waster or low-value habit I should drop)

Here's what happened this week:
[DESCRIBE YOUR WEEK: MEETINGS, TASKS, PROJECTS, ACCOMPLISHMENTS, FRUSTRATIONS]`,
  },
];
