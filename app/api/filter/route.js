// Filter Agent API — scores jobs against user resume using Gemini AI
import { NextResponse } from 'next/server';
import { generateContent, hasGeminiKey } from '@/lib/gemini';

export async function POST(request) {
  const body = await request.json();
  const { jobs = [], resume = '' } = body;

  if (!jobs.length) {
    return NextResponse.json({ scored: [], error: 'No jobs provided' });
  }

  if (!resume.trim()) {
    return NextResponse.json({ scored: [], error: 'No resume provided' });
  }

  // If no Gemini key, do basic keyword matching
  if (!hasGeminiKey) {
    const scored = jobs.map((job) => ({
      ...job,
      score: basicKeywordScore(job, resume),
      matchReason: 'Keyword matching (add Gemini key for AI scoring)',
      matchedSkills: extractKeywords(resume).filter((k) =>
        job.description?.toLowerCase().includes(k.toLowerCase()) ||
        job.title?.toLowerCase().includes(k.toLowerCase())
      ),
    }));
    scored.sort((a, b) => b.score - a.score);
    return NextResponse.json({ scored, usingFallback: true });
  }

  // Gemini AI scoring
  const prompt = `You are a professional career advisor and resume screener.

RESUME:
${resume.slice(0, 4000)}

JOB LISTINGS (JSON):
${JSON.stringify(jobs.map((j) => ({
  id: j.id,
  title: j.title,
  company: j.company,
  description: j.description?.slice(0, 400),
  highlights: j.highlights,
})), null, 2)}

For each job, analyze how well the candidate's resume matches the job requirements.
Return a JSON array (one object per job) with these exact fields:
- id: (string, same as input)
- score: (number 0-100, how well resume matches)
- matchReason: (string, 1-2 sentences explaining the match)
- matchedSkills: (string array, skills from resume that match)
- gaps: (string array, important missing skills)

Return ONLY valid JSON array, no extra text.`;

  try {
    const raw = await generateContent(prompt, true);
    const scored_ai = JSON.parse(raw || '[]');

    // Merge scores back into full job objects
    const scored = jobs.map((job) => {
      const ai = scored_ai.find((s) => s.id === job.id) || {};
      return {
        ...job,
        score: ai.score ?? basicKeywordScore(job, resume),
        matchReason: ai.matchReason ?? 'AI scoring unavailable',
        matchedSkills: ai.matchedSkills ?? [],
        gaps: ai.gaps ?? [],
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return NextResponse.json({ scored, usingFallback: false });
  } catch (err) {
    console.error('Filter agent error:', err.message);
    // Fallback to keyword matching
    const scored = jobs.map((job) => ({
      ...job,
      score: basicKeywordScore(job, resume),
      matchReason: 'Keyword matching fallback',
      matchedSkills: [],
      gaps: [],
    }));
    scored.sort((a, b) => b.score - a.score);
    return NextResponse.json({ scored, usingFallback: true });
  }
}

function basicKeywordScore(job, resume) {
  const keywords = extractKeywords(resume);
  const jobText = `${job.title} ${job.description} ${JSON.stringify(job.highlights)}`.toLowerCase();
  const matches = keywords.filter((k) => jobText.includes(k.toLowerCase()));
  const base = Math.min(95, Math.round((matches.length / Math.max(keywords.length, 1)) * 100));
  return Math.max(10, base);
}

function extractKeywords(text) {
  const techKeywords = [
    'javascript','typescript','python','java','go','rust','c++','c#','ruby','php','swift','kotlin',
    'react','vue','angular','next.js','node.js','express','django','fastapi','spring','rails',
    'postgresql','mysql','mongodb','redis','elasticsearch','dynamodb',
    'aws','gcp','azure','docker','kubernetes','terraform','ci/cd','github actions',
    'machine learning','deep learning','pytorch','tensorflow','nlp','computer vision',
    'figma','sketch','ux','ui','product design','user research',
    'sql','nosql','rest','graphql','grpc','microservices','distributed systems',
    'agile','scrum','product management','data analysis','excel','tableau','power bi',
  ];
  const lower = text.toLowerCase();
  return techKeywords.filter((k) => lower.includes(k));
}
