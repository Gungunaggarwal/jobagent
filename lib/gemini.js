// Gemini AI client — returns null gracefully if key not set
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

const isValidKey =
  apiKey &&
  apiKey.length > 20 &&
  !apiKey.startsWith('your_') &&
  apiKey !== 'your_gemini_api_key_here';

export const hasGeminiKey = !!isValidKey;

export function getGeminiModel(modelName = 'gemini-2.5-flash') {
  if (!isValidKey) return null;
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: modelName });
  } catch {
    return null;
  }
}

export async function generateContent(prompt, jsonMode = false, fileData = null) {
  const model = getGeminiModel();
  if (!model) return null;

  try {
    const parts = [{ text: prompt }];
    if (fileData) {
      parts.push({ inlineData: { data: fileData.data, mimeType: fileData.mimeType } });
    }

    const config = jsonMode
      ? { generationConfig: { responseMimeType: 'application/json' } }
      : {};

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      ...config,
    });

    let text = result.response.text();
    // Strip markdown code fences Gemini sometimes wraps
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    return text;
  } catch (err) {
    console.error('Gemini error:', err.message);
    return null;
  }
}
