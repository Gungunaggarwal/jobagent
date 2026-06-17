// Debug route — shows raw Twitter API response so we can fix parsing
import { NextResponse } from 'next/server';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || 'software engineer hiring';

  if (!RAPIDAPI_KEY || RAPIDAPI_KEY.startsWith('your_') || RAPIDAPI_KEY.startsWith('paste_')) {
    return NextResponse.json({ error: 'No valid RAPIDAPI_KEY in .env.local' });
  }

  const url = new URL('https://twitter-api45.p.rapidapi.com/search.php');
  url.searchParams.set('query', query);
  url.searchParams.set('search_type', 'Latest');

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'twitter-api45.p.rapidapi.com',
      },
      cache: 'no-store',
    });

    const status = res.status;
    const text = await res.text();

    let parsed = null;
    try { parsed = JSON.parse(text); } catch {}

    return NextResponse.json({
      status,
      query,
      rawPreview: text.slice(0, 2000),
      topLevelKeys: parsed ? Object.keys(parsed) : null,
      firstItemKeys: parsed
        ? (parsed.timeline?.[0] ? Object.keys(parsed.timeline[0])
          : parsed.tweets?.[0] ? Object.keys(parsed.tweets[0])
          : parsed.data?.[0] ? Object.keys(parsed.data[0])
          : 'no array found')
        : null,
      itemCount: parsed
        ? (parsed.timeline?.length ?? parsed.tweets?.length ?? parsed.data?.length ?? 0)
        : 0,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message });
  }
}
