// Prep Agent API — generates interview questions, answers, company cheat sheet
import { NextResponse } from 'next/server';
import { generateContent, hasGeminiKey } from '@/lib/gemini';

export async function POST(request) {
  const body = await request.json();
  const { job, resume = '', type = 'questions' } = body;

  if (!job) {
    return NextResponse.json({ error: 'Job required' }, { status: 400 });
  }

  if (!hasGeminiKey) {
    if (type === 'questions') {
      return NextResponse.json({ content: getTemplateQuestions(job), usingTemplate: true });
    }
    if (type === 'cheatsheet') {
      return NextResponse.json({ content: getTemplateCheatsheet(job), usingTemplate: true });
    }
    if (type === 'plan') {
      return NextResponse.json({ content: getTemplatePlan(job), usingTemplate: true });
    }
  }

  if (type === 'questions') {
    const prompt = `You are an expert interview coach. 

Generate 10 highly relevant interview questions for this role. 
IMPORTANT:
1. The QUESTIONS must be based strictly on the Job Title, Company, and Description. Do NOT ask highly specific questions about the candidate's past projects in the question itself (the interviewer hasn't met them yet).
2. The MODEL ANSWERS should use specific examples, projects, and skills from the CANDIDATE RESUME to show the candidate exactly how they can use their own background to answer the question effectively.

JOB:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description?.slice(0, 500)}
Requirements: ${JSON.stringify(job.highlights?.Qualifications || [])}

CANDIDATE RESUME:
${resume.slice(0, 2000)}

Return a JSON array of 10 objects with:
- type: "behavioral" | "technical" | "situational"
- question: (string)
- answer: (string, 3–5 sentences, use STAR method for behavioral, technical explanation for technical)
- tip: (string, 1 sentence coaching tip)

Return ONLY valid JSON array.`;

    const raw = await generateContent(prompt, true);
    try {
      if (!raw) throw new Error('Empty response');
      const content = JSON.parse(raw);
      if (!Array.isArray(content) || content.length === 0) throw new Error('Invalid or empty array');
      return NextResponse.json({ content, usingTemplate: false });
    } catch {
      return NextResponse.json({ content: getTemplateQuestions(job), usingTemplate: true });
    }
  }

  if (type === 'cheatsheet') {
    const prompt = `You are a research analyst preparing a candidate for a job interview at ${job.company}.

Create a concise company cheat sheet for a ${job.title} candidate with these sections:
1. Company Overview (3–4 sentences: what they do, mission, scale)
2. Tech Stack (likely technologies based on role and company)
3. Culture & Values (2–3 key traits)
4. Recent News (2 notable things to mention in interview — if unknown, write plausible things based on company type)
5. Smart Questions to Ask (3 thoughtful questions the candidate can ask the interviewer)

Format as a JSON object with keys: overview, techStack (array), culture (array), recentNews (array), questionsToAsk (array).
Return ONLY valid JSON.`;

    const raw = await generateContent(prompt, true);
    try {
      if (!raw) throw new Error('Empty response');
      const content = JSON.parse(raw);
      if (!content || Object.keys(content).length === 0) throw new Error('Invalid or empty object');
      return NextResponse.json({ content, usingTemplate: false });
    } catch {
      return NextResponse.json({ content: getTemplateCheatsheet(job), usingTemplate: true });
    }
  }

  if (type === 'plan') {
    const prompt = `Create a practical 30-60-90 day onboarding plan for a new ${job.title} at ${job.company}.

For each phase (30 days, 60 days, 90 days), provide:
- focus: (string, main theme of the phase)
- goals: (array of 3–4 specific, actionable goals)

Return JSON: { "30": { focus, goals }, "60": { focus, goals }, "90": { focus, goals } }
Return ONLY valid JSON.`;

    const raw = await generateContent(prompt, true);
    try {
      if (!raw) throw new Error('Empty response');
      const content = JSON.parse(raw);
      if (!content || !content['30']) throw new Error('Invalid or empty object');
      return NextResponse.json({ content, usingTemplate: false });
    } catch {
      return NextResponse.json({ content: getTemplatePlan(job), usingTemplate: true });
    }
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
}

function getTemplateQuestions(job) {
  return [
    { type: 'behavioral', question: `Tell me about yourself and why you're interested in this ${job.title} role at ${job.company}.`, answer: 'Walk through your career journey chronologically, highlighting experiences most relevant to this role. End with why this specific company excites you. Keep it to 2 minutes.', tip: 'Practice a 90-second version for phone screens.' },
    { type: 'behavioral', question: 'Describe a challenging project you led. What was the outcome?', answer: 'Use the STAR method: Situation (set context), Task (your responsibility), Action (specific steps you took), Result (quantifiable outcome). Choose a project most relevant to this role.', tip: 'Always quantify the result — "improved performance by 40%" is more compelling than "made it faster."' },
    { type: 'technical', question: `What technologies or tools do you consider essential for a ${job.title}?`, answer: 'Reference the specific technologies mentioned in the job description. Explain not just what they are, but why and when you\'d choose them. Demonstrate depth, not just breadth.', tip: 'Research the company\'s known tech stack beforehand to align your answer.' },
    { type: 'behavioral', question: 'How do you handle disagreements with teammates or stakeholders about technical decisions?', answer: 'Emphasize data-driven decision making, active listening, and finding common ground. Give a specific example where you navigated a disagreement successfully while preserving the relationship.', tip: 'Show you can be persuaded by good arguments — it demonstrates intellectual humility.' },
    { type: 'situational', question: `You're given a complex feature with an unrealistic deadline. How do you handle it?`, answer: 'Discuss scoping conversations, identifying the MVP, communicating trade-offs clearly to stakeholders, and delivering iteratively. Show you prioritize quality and transparency over just saying yes.', tip: 'Interviewers want to see that you push back diplomatically when needed.' },
    { type: 'technical', question: 'Walk me through how you approach debugging a production issue.', answer: 'Describe a systematic approach: reproducing the issue, checking logs/metrics, forming hypotheses, testing changes safely in production, and documenting the post-mortem. Mention specific tools you use.', tip: 'Mention on-call experience and how you communicate status during outages if applicable.' },
    { type: 'behavioral', question: 'Tell me about a time you had to learn a new technology quickly.', answer: 'Choose a situation where you had to learn something substantially new under time pressure. Focus on your learning strategy, resources used, and how you applied it successfully.', tip: 'This tests your growth mindset and learning agility — companies want lifelong learners.' },
    { type: 'situational', question: `What's your approach to code reviews — both giving and receiving feedback?`, answer: 'Emphasize constructive, specific feedback focused on the code not the person. For receiving feedback, mention being open to different approaches and asking clarifying questions rather than getting defensive.', tip: 'Strong engineering cultures value this skill highly.' },
    { type: 'behavioral', question: 'Where do you see yourself in 3 years, and how does this role fit that vision?', answer: 'Connect your growth goals directly to what this company offers. Show you\'ve thought about their trajectory and how your personal development aligns with where they\'re headed.', tip: 'Research the company\'s roadmap/blog to make this answer specific.' },
    { type: 'situational', question: `Do you have any questions for us?`, answer: 'Always have 3–5 thoughtful questions ready. Good ones: "What does success look like in this role after 90 days?", "What\'s the biggest technical challenge the team is facing?", "How does the team balance shipping speed with technical debt?"', tip: 'Never say "No, I think you covered everything." This signals low interest.' },
  ];
}

function getTemplateCheatsheet(job) {
  return {
    overview: `${job.company} is a leading company in its industry, known for innovation and strong engineering culture. Understanding their core products and recent announcements will help you speak to their mission during the interview.`,
    techStack: ['Modern web technologies', 'Cloud infrastructure (AWS/GCP/Azure)', 'CI/CD pipelines', 'Monitoring & observability tools'],
    culture: ['Data-driven decision making', 'Collaborative and fast-paced environment', 'Strong emphasis on ownership and accountability'],
    recentNews: [`Research ${job.company}'s latest engineering blog posts before the interview`, 'Check their LinkedIn for recent funding rounds, product launches, or partnerships'],
    questionsToAsk: [
      `What does success look like for a ${job.title} in the first 90 days?`,
      'What is the biggest technical challenge the team is currently solving?',
      'How does the team balance feature velocity with technical debt?',
    ],
  };
}

function getTemplatePlan(job) {
  return {
    '30': {
      focus: 'Learn & Observe',
      goals: [
        `Onboard fully to the ${job.company} codebase, tooling, and deployment processes`,
        'Meet with every team member and key stakeholder for 1:1 intros',
        'Ship one small bug fix or improvement to build confidence',
        'Document open questions and identified gaps in the codebase',
      ],
    },
    '60': {
      focus: 'Contribute & Build',
      goals: [
        'Own and deliver one meaningful feature end-to-end',
        'Propose and implement one process or tooling improvement',
        'Begin participating actively in architecture discussions',
        'Establish regular check-ins with manager to align on expectations',
      ],
    },
    '90': {
      focus: 'Lead & Impact',
      goals: [
        'Lead a cross-functional project or initiative independently',
        'Mentor a junior team member or conduct first code review',
        'Identify and pitch a strategic technical opportunity to leadership',
        'Establish measurable impact metrics for your ongoing work',
      ],
    },
  };
}
