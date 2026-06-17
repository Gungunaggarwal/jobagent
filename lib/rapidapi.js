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

  // Simple query — complex booleans cause 400 or empty results on this API
  const searchQuery = `${query} hiring jobs`;

  const url = new URL('https://twitter-api45.p.rapidapi.com/search.php');
  url.searchParams.set('query', searchQuery);
  url.searchParams.set('search_type', 'Latest');

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'twitter-api45.p.rapidapi.com',
      },
      cache: 'no-store', // always fresh results
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Twitter API ${res.status}: ${errText.slice(0, 120)}`);
    }

    const data = await res.json();

    // twitter-api45 may return results under different keys depending on version
    const rawList = (
      data.timeline ||
      data.tweets ||
      data.data ||
      data.results ||
      []
    ).slice(0, count);

    const tweets = rawList.map((t) => {
      const text = t.text || t.full_text || '';
      const userInfo = t.user_info || t.user || {};
      const handle = userInfo.screen_name || t.screen_name || t.author_id || '';
      const tweetId = t.tweet_id || t.id || t.id_str || '';
      return {
        id: tweetId || crypto.randomUUID(),
        text,
        author: userInfo.name || t.name || handle || 'Unknown',
        handle,
        url: handle && tweetId
          ? `https://twitter.com/${handle}/status/${tweetId}`
          : `https://twitter.com/search?q=${encodeURIComponent(searchQuery)}`,
        postedAt: t.created_at || new Date().toISOString(),
        likes: t.favorite_count || t.public_metrics?.like_count || 0,
        retweets: t.retweet_count || t.public_metrics?.retweet_count || 0,
        source: 'Twitter/X',
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

export function getMockTweets(query = 'developer') {
  const q = query.toLowerCase();

  // Pool of realistic tweet templates — pick based on keywords
  const pool = [
    { keywords: ['react', 'frontend', 'javascript', 'js', 'next', 'vue', 'angular'],
      title: 'Frontend / React Developer',
      text: `🚀 We're hiring a Senior React Developer! Remote-first, competitive salary, great benefits. Strong Next.js & TypeScript skills required. DM us or click the link to apply. #hiring #reactjs #jobs #frontend`,
      author: 'TechStartupsHQ', handle: 'techstartupshq', likes: 142, retweets: 38 },
    { keywords: ['python', 'data', 'ml', 'machine learning', 'ai', 'science', 'analyst'],
      title: 'Data Scientist / ML Engineer',
      text: `📊 Hiring: Data Scientist with 2+ years ML experience. Python, pandas, PyTorch required. Full-time, remote-friendly. Great mission, funded startup. #datascience #hiring #python #ml`,
      author: 'DataHiringBoard', handle: 'datahiringboard', likes: 89, retweets: 22 },
    { keywords: ['design', 'ux', 'ui', 'figma', 'product design'],
      title: 'UX/UI Designer',
      text: `🎨 Design role open! UX/UI Designer needed for a fast-growing fintech startup. Figma expert + user research experience required. Remote OK. Competitive package. #design #uxdesign #hiring`,
      author: 'FintechHQ', handle: 'fintechhq', likes: 67, retweets: 15 },
    { keywords: ['backend', 'node', 'java', 'go', 'golang', 'api', 'spring'],
      title: 'Backend Engineer',
      text: `⚙️ Backend Engineer role available! Node.js or Go experience, strong API design skills, PostgreSQL. Remote-first, Series B startup. Equity included. #backenddeveloper #jobs #hiring`,
      author: 'EngineeringJobs', handle: 'engineeringjobs', likes: 201, retweets: 55 },
    { keywords: ['devops', 'cloud', 'aws', 'kubernetes', 'docker', 'infrastructure', 'platform'],
      title: 'DevOps / Cloud Engineer',
      text: `☁️ Hiring: Cloud/DevOps Engineer. AWS, Terraform, Kubernetes expertise required. Help us scale our platform to millions of users. Remote. Strong comp + equity. #devops #cloudcomputing #jobs`,
      author: 'CloudHiring', handle: 'cloudhiring', likes: 178, retweets: 44 },
    { keywords: ['mobile', 'ios', 'android', 'flutter', 'swift', 'kotlin', 'react native'],
      title: 'Mobile Developer',
      text: `📱 Mobile Dev needed! iOS (Swift) or React Native experience required. Shipping apps used by 500k+ users. Remote-friendly, great team culture. DM to apply. #mobiledev #ios #hiring`,
      author: 'AppStartupJobs', handle: 'appstartupjobs', likes: 93, retweets: 21 },
    { keywords: ['product', 'manager', 'pm', 'product management'],
      title: 'Product Manager',
      text: `📋 PM role open at our B2B SaaS startup! 3+ years product management, strong analytical mindset, experience with agile teams. Remote + equity. #productmanager #pm #jobs`,
      author: 'SaaSHiring', handle: 'saashiring', likes: 115, retweets: 30 },
    { keywords: ['security', 'cybersecurity', 'pentesting', 'infosec'],
      title: 'Security Engineer',
      text: `🔐 Security Engineer opportunity! Penetration testing, SIEM tools, cloud security (AWS/GCP). Work on protecting systems used by Fortune 500 clients. Fully remote. #cybersecurity #infosec #hiring`,
      author: 'SecurityJobsNet', handle: 'securityjobsnet', likes: 134, retweets: 37 },
  ];

  // Find matching tweets based on query keywords
  const matched = pool.filter(t => t.keywords.some(k => q.includes(k)));
  // Fall back to all if nothing matched
  const source = matched.length >= 2 ? matched : pool;

  // Return 3, varied by picking with an offset so repeated searches feel different
  const selected = source.slice(0, 3);

  const twitterSearchUrl = `https://twitter.com/search?q=${encodeURIComponent(query + ' hiring jobs')}&src=typed_query&f=live`;

  return selected.map((t, i) => ({
    id: `mock-tweet-${i}-${q.slice(0,4)}`,
    title: t.title,
    text: t.text,
    author: t.author,
    handle: t.handle,
    // Point to a real Twitter search for this query instead of '#'
    url: twitterSearchUrl,
    postedAt: new Date(Date.now() - i * 3600000).toISOString(),
    likes: t.likes,
    retweets: t.retweets,
    source: 'Twitter/X',
    isMockUrl: true, // flag so UI can show correct label
  }));
}
