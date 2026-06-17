// RapidAPI wrappers for JSearch (LinkedIn/Indeed/Glassdoor) + Twitter/X hiring posts

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

const isValidKey =
  RAPIDAPI_KEY &&
  RAPIDAPI_KEY.length > 10 &&
  !RAPIDAPI_KEY.startsWith('your_');

export const hasRapidApiKey = !!isValidKey;

// ─── JSearch: aggregates LinkedIn, Indeed, Glassdoor, ZipRecruiter ───────────
export async function searchJobsJSearch({ query, location = '', remote = false, page = 1, perPage = 10 }) {
  if (!isValidKey) return { jobs: [], error: 'NO_KEY' };

  const q = remote ? `${query} work from home` : `${query}${location ? ` in ${location}` : ''}`;

  const url = new URL('https://jsearch.p.rapidapi.com/search');
  url.searchParams.set('query', q);
  url.searchParams.set('page', String(page));
  url.searchParams.set('num_pages', '1');
  url.searchParams.set('per_page', String(perPage));
  url.searchParams.set('date_posted', 'week');

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) throw new Error(`JSearch API: ${res.status}`);
    const data = await res.json();

    const jobs = (data.data || []).map((j) => ({
      id: j.job_id || crypto.randomUUID(),
      title: j.job_title,
      company: j.employer_name,
      location: j.job_city
        ? `${j.job_city}${j.job_state ? `, ${j.job_state}` : ''}`
        : j.job_country || 'Remote',
      remote: j.job_is_remote || false,
      type: j.job_employment_type || 'FULLTIME',
      salary: j.job_min_salary
        ? `$${Math.round(j.job_min_salary / 1000)}k–$${Math.round(j.job_max_salary / 1000)}k`
        : null,
      description: j.job_description?.slice(0, 600) || '',
      applyUrl: j.job_apply_link || j.job_google_link || '#',
      postedAt: j.job_posted_at_datetime_utc || new Date().toISOString(),
      source: j.job_publisher || 'JSearch',
      logo: j.employer_logo || null,
      highlights: j.job_highlights || {},
    }));

    return { jobs, error: null };
  } catch (err) {
    console.error('JSearch error:', err.message);
    return { jobs: [], error: err.message };
  }
}

// ─── Twitter/X: search hiring posts by hashtag/keyword ───────────────────────
export async function searchTwitterJobs(query, count = 20) {
  if (!isValidKey) return { tweets: [], error: 'NO_KEY' };

  const searchQuery = `(${query} OR #hiring OR "we are hiring") (#jobs OR #hiring OR #jobopenings) -is:retweet lang:en`;

  const url = new URL('https://twitter-api45.p.rapidapi.com/search.php');
  url.searchParams.set('query', searchQuery);
  url.searchParams.set('search_type', 'Latest');

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'twitter-api45.p.rapidapi.com',
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) throw new Error(`Twitter API: ${res.status}`);
    const data = await res.json();

    const tweets = ((data.timeline || data.tweets || []).slice(0, count)).map((t) => {
      const text = t.text || t.full_text || '';
      return {
        id: t.tweet_id || t.id_str || crypto.randomUUID(),
        text,
        author: t.user?.name || t.screen_name || 'Unknown',
        handle: t.user?.screen_name || t.screen_name || '',
        url: t.user?.screen_name
          ? `https://twitter.com/${t.user.screen_name}/status/${t.tweet_id}`
          : '#',
        postedAt: t.created_at || new Date().toISOString(),
        likes: t.favorite_count || 0,
        retweets: t.retweet_count || 0,
        source: 'Twitter/X',
        // Try to extract a job title from the tweet
        title: extractJobTitle(text),
      };
    });

    return { tweets, error: null };
  } catch (err) {
    console.error('Twitter API error:', err.message);
    return { tweets: [], error: err.message };
  }
}

function extractJobTitle(text) {
  const patterns = [
    /hiring (?:a |an )?([A-Z][a-zA-Z\s]+(?:Engineer|Developer|Designer|Manager|Analyst|Lead|Architect|Scientist|Director))/,
    /(?:looking for|seeking) (?:a |an )?([A-Z][a-zA-Z\s]+(?:Engineer|Developer|Designer|Manager|Analyst))/i,
    /([A-Z][a-zA-Z\s]+(?:Engineer|Developer|Designer|Manager|Analyst|Lead|Architect|Scientist|Director)) (?:opening|position|role|job)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim();
  }
  return 'Job Opportunity';
}

// ─── Mock data for when no API key is configured ─────────────────────────────
export function getMockJobs() {
  return [
    {
      id: 'mock-1',
      title: 'Senior Full Stack Engineer',
      company: 'Stripe',
      location: 'San Francisco, CA',
      remote: true,
      type: 'FULLTIME',
      salary: '$160k–$220k',
      description: 'Build the financial infrastructure of the internet. Work on complex distributed systems, lead technical initiatives, and collaborate with world-class engineers across web & mobile platforms.',
      applyUrl: 'https://stripe.com/jobs',
      postedAt: new Date(Date.now() - 86400000).toISOString(),
      source: 'LinkedIn',
      logo: null,
      highlights: { Qualifications: ['React', 'Node.js', 'PostgreSQL', '5+ years'], Benefits: ['Equity', 'Remote OK', 'Health'] },
    },
    {
      id: 'mock-2',
      title: 'Product Designer',
      company: 'Figma',
      location: 'New York, NY',
      remote: true,
      type: 'FULLTIME',
      salary: '$130k–$180k',
      description: 'Design tools that empower creativity for millions of designers worldwide. Shape the future of collaborative design with a team that deeply cares about craft and user experience.',
      applyUrl: 'https://figma.com/careers',
      postedAt: new Date(Date.now() - 172800000).toISOString(),
      source: 'Indeed',
      logo: null,
      highlights: { Qualifications: ['Figma', 'Prototyping', 'User Research'], Benefits: ['RSUs', 'Remote', 'Wellness'] },
    },
    {
      id: 'mock-3',
      title: 'Machine Learning Engineer',
      company: 'OpenAI',
      location: 'San Francisco, CA',
      remote: false,
      type: 'FULLTIME',
      salary: '$200k–$370k',
      description: 'Work on cutting-edge AI systems that are changing the world. Join a team training large-scale models, building infrastructure, and solving some of the most challenging problems in AI.',
      applyUrl: 'https://openai.com/careers',
      postedAt: new Date(Date.now() - 43200000).toISOString(),
      source: 'Glassdoor',
      logo: null,
      highlights: { Qualifications: ['Python', 'PyTorch', 'ML Research', 'PhD preferred'], Benefits: ['Equity', 'Mission-driven'] },
    },
    {
      id: 'mock-4',
      title: 'Frontend Engineer',
      company: 'Vercel',
      location: 'Remote',
      remote: true,
      type: 'FULLTIME',
      salary: '$140k–$190k',
      description: 'Help build the platform that powers the web for millions of developers. Work on the Next.js dashboard, deployment UI, and developer experience tools used by teams worldwide.',
      applyUrl: 'https://vercel.com/careers',
      postedAt: new Date(Date.now() - 259200000).toISOString(),
      source: 'LinkedIn',
      logo: null,
      highlights: { Qualifications: ['React', 'TypeScript', 'Next.js', 'CSS'], Benefits: ['Fully remote', 'Equity', 'Home office'] },
    },
    {
      id: 'mock-5',
      title: 'DevOps / Platform Engineer',
      company: 'Datadog',
      location: 'Austin, TX',
      remote: true,
      type: 'FULLTIME',
      salary: '$150k–$200k',
      description: 'Scale infrastructure powering real-time monitoring for thousands of enterprise customers. Work with Kubernetes, Terraform, and cloud providers to build reliable, fast platform services.',
      applyUrl: 'https://datadog.com/jobs',
      postedAt: new Date(Date.now() - 345600000).toISOString(),
      source: 'ZipRecruiter',
      logo: null,
      highlights: { Qualifications: ['Kubernetes', 'Terraform', 'AWS', 'Go'], Benefits: ['Remote', 'Stock', 'Flexible PTO'] },
    },
    {
      id: 'mock-6',
      title: 'Backend Engineer — Payments',
      company: 'Shopify',
      location: 'Toronto, Canada',
      remote: true,
      type: 'FULLTIME',
      salary: '$120k–$170k',
      description: 'Power commerce for millions of merchants globally. Work on high-throughput payment processing systems, financial APIs, and the infrastructure handling billions of dollars in transactions.',
      applyUrl: 'https://shopify.com/careers',
      postedAt: new Date(Date.now() - 432000000).toISOString(),
      source: 'LinkedIn',
      logo: null,
      highlights: { Qualifications: ['Ruby', 'Go', 'MySQL', 'Distributed Systems'], Benefits: ['Fully remote', 'RSUs', 'Learning budget'] },
    },
  ];
}

export function getMockTweets() {
  return [
    { id: 't1', title: 'React Developer', text: '🚀 We\'re hiring a Senior React Developer! Remote-first, competitive salary, great team. DM or apply at the link. #hiring #reactjs #jobs #developer', author: 'TechStartupXYZ', handle: 'techstartupxyz', url: '#', postedAt: new Date().toISOString(), likes: 142, retweets: 38, source: 'Twitter/X' },
    { id: 't2', title: 'Data Scientist', text: '📊 Exciting opportunity! We are looking for a Data Scientist with ML experience. Strong Python skills required. Full-time, NYC or remote. Apply now! #datascience #hiring #python #ml', author: 'DataCorp Inc', handle: 'datacorp', url: '#', postedAt: new Date().toISOString(), likes: 89, retweets: 22, source: 'Twitter/X' },
    { id: 't3', title: 'UX/UI Designer', text: '🎨 Design job opening! UX/UI Designer needed for a fast-growing fintech startup. Figma expert, user research experience required. Remote OK. #design #uxdesign #jobopenings #fintech', author: 'FintechHQ', handle: 'fintechhq', url: '#', postedAt: new Date().toISOString(), likes: 67, retweets: 15, source: 'Twitter/X' },
  ];
}
