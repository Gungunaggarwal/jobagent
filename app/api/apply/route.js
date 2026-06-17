// Apply Agent API — generates tailored cover letters using Gemini
import { NextResponse } from 'next/server';
import { generateContent, hasGeminiKey } from '@/lib/gemini';

export async function POST(request) {
  const body = await request.json();
  const { job, resume = '', type = 'cover_letter' } = body;

  if (!job) {
    return NextResponse.json({ error: 'Job details required' }, { status: 400 });
  }

  if (!hasGeminiKey) {
    if (type === 'cover_letter') {
      return NextResponse.json({
        content: generateTemplateCoverLetter(job, resume),
        usingTemplate: true,
      });
    }
    if (type === 'resume_bullets') {
      return NextResponse.json({
        content: generateTemplateBullets(job),
        usingTemplate: true,
      });
    }
  }

  if (type === 'cover_letter') {
    const prompt = `You are an expert career coach. Write a compelling, personalized cover letter for this job application.

CANDIDATE RESUME:
${resume.slice(0, 3000)}

JOB POSTING:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Description: ${job.description}
Requirements: ${JSON.stringify(job.highlights?.Qualifications || [])}

Write a professional, enthusiastic cover letter (3 paragraphs, ~250 words) that:
1. Opens with a strong hook referencing the specific role and company
2. Highlights 2-3 directly relevant experiences/skills from the resume that match the job
3. Closes with a confident call to action

Tone: Professional but personable. Avoid clichés like "I am writing to express my interest."
Format: Plain text only, no headers, no "Dear Hiring Manager" salutation unless resume has candidate name. Start with a compelling opening sentence.`;

    const content = await generateContent(prompt);
    return NextResponse.json({
      content: content || generateTemplateCoverLetter(job, resume),
      usingTemplate: !content,
    });
  }

  if (type === 'resume_bullets') {
    const prompt = `You are a resume expert. Generate 3–4 strong resume bullet points for this job that the candidate can use to tailor their resume.

JOB:
Title: ${job.title}
Company: ${job.company}
Key Requirements: ${JSON.stringify(job.highlights?.Qualifications || [])}
Description: ${job.description?.slice(0, 400)}

CANDIDATE BACKGROUND:
${resume.slice(0, 1500)}

Write 3–4 achievement-oriented bullet points using the STAR method (Situation, Task, Action, Result). Use strong action verbs. Include metrics where plausible. Each bullet on its own line starting with "•".`;

    const content = await generateContent(prompt);
    return NextResponse.json({
      content: content || generateTemplateBullets(job),
      usingTemplate: !content,
    });
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
}

function generateTemplateCoverLetter(job, resume) {
  const name = extractName(resume) || 'I';
  return `Building impactful products has always been my passion, and the ${job.title} role at ${job.company} immediately stood out as an exceptional opportunity to do exactly that.

Throughout my career, I have developed strong expertise in the technologies and practices central to this role. ${job.highlights?.Qualifications?.length ? `My background aligns closely with your requirements, particularly in ${job.highlights.Qualifications.slice(0, 3).join(', ')}.` : 'My technical background and problem-solving skills make me a strong candidate for this position.'} I thrive in collaborative environments and have consistently delivered high-quality results under tight deadlines.

What excites me most about ${job.company} is the scale and impact of the work. I am eager to bring my skills and enthusiasm to your team and contribute meaningfully from day one. I would love the opportunity to discuss how my background aligns with what you are looking for.

[Add Gemini API key in Settings for a fully personalized AI-generated cover letter]`;
}

function generateTemplateBullets(job) {
  return `• Delivered scalable solutions for high-traffic systems, improving performance by 40% and reducing operational costs
• Led cross-functional collaboration with product and design teams to ship features serving 100K+ users on schedule
• Architected and maintained core platform services using modern technologies aligned with ${job.title} requirements
• Drove adoption of best engineering practices including code reviews, automated testing, and CI/CD pipelines

[Add Gemini API key in Settings for AI-tailored resume bullets]`;
}

function extractName(resume) {
  const lines = resume.split('\n').map((l) => l.trim()).filter(Boolean);
  const first = lines[0];
  if (first && first.length < 50 && !/[@.]/.test(first)) return first;
  return null;
}
