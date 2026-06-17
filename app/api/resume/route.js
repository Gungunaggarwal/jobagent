// Resume parsing API — handles PDF upload and text extraction
import { NextResponse } from 'next/server';
import { generateContent, hasGeminiKey } from '@/lib/gemini';

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get('file');
  const text = formData.get('text');

  // If raw text provided
  if (text && text.trim()) {
    if (!hasGeminiKey) {
      return NextResponse.json({ resumeText: text.trim(), structured: null });
    }
    const structured = await extractStructured(text.trim());
    return NextResponse.json({ resumeText: text.trim(), structured });
  }

  // If PDF file uploaded
  if (file && file.size > 0) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      let extractedText = '';

      // Try pdf-parse
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text;
      } catch (e) {
        console.error('pdf-parse failed:', e.message);
        // Fallback: use Gemini multimodal if PDF parse fails
        if (hasGeminiKey) {
          const base64 = buffer.toString('base64');
          const prompt = 'Extract all text content from this PDF resume. Return the full text, preserving the structure as best as possible.';
          extractedText = await generateContent(prompt, false, {
            data: base64,
            mimeType: 'application/pdf',
          }) || '';
        }
      }

      if (!extractedText.trim()) {
        return NextResponse.json({ error: 'Could not extract text from PDF' }, { status: 422 });
      }

      const structured = hasGeminiKey ? await extractStructured(extractedText) : null;
      return NextResponse.json({ resumeText: extractedText, structured });
    } catch (err) {
      console.error('Resume parse error:', err.message);
      return NextResponse.json({ error: 'Failed to parse file' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'No file or text provided' }, { status: 400 });
}

async function extractStructured(text) {
  const prompt = `Extract structured information from this resume. Return a JSON object with:
- name: string
- email: string
- phone: string
- location: string
- skills: string[] (technical and soft skills)
- experience: array of { company, title, duration, highlights: string[] }
- education: array of { institution, degree, year }
- summary: string (2-3 sentence professional summary you infer)

Resume text:
${text.slice(0, 4000)}

Return ONLY valid JSON.`;

  try {
    const raw = await generateContent(prompt, true);
    return JSON.parse(raw || '{}');
  } catch {
    return null;
  }
}
