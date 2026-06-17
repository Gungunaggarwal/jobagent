// Search Agent API — fetches from JSearch + Twitter/X via RapidAPI
import { NextResponse } from 'next/server';
import {
  searchJobsJSearch,
  searchTwitterJobs,
  getMockJobs,
  getMockTweets,
  hasRapidApiKey,
} from '@/lib/rapidapi';

export async function POST(request) {
  const body = await request.json();
  const { query = 'software engineer', location = '', remote = false, sources = ['jobs', 'twitter'] } = body;

  const results = { jobs: [], tweets: [], usingMock: false, error: null };

  if (!hasRapidApiKey) {
    results.usingMock = true;
    if (sources.includes('jobs')) {
      results.jobs = getMockJobs().filter((j) =>
        j.title.toLowerCase().includes(query.toLowerCase()) ||
        j.company.toLowerCase().includes(query.toLowerCase()) ||
        query.toLowerCase().includes('engineer') ||
        query.toLowerCase().includes('developer') ||
        query.toLowerCase().includes('designer')
      );
      if (!results.jobs.length) results.jobs = getMockJobs();
    }
    if (sources.includes('twitter')) {
      results.tweets = getMockTweets();
    }
    return NextResponse.json(results);
  }

  // Real API calls
  const promises = [];

  if (sources.includes('jobs')) {
    promises.push(
      searchJobsJSearch({ query, location, remote, perPage: 12 }).then((r) => {
        results.jobs = r.jobs;
        if (r.error) results.error = r.error;
      })
    );
  }

  if (sources.includes('twitter')) {
    promises.push(
      searchTwitterJobs(query, 15).then((r) => {
        results.tweets = r.tweets;
      })
    );
  }

  await Promise.allSettled(promises);

  return NextResponse.json(results);
}
