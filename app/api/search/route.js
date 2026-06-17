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
  const {
    query = 'software engineer',
    location = '',
    remote = false,
    sources = ['jobs', 'twitter'],
    page = 1,
    perPage = 10,
  } = body;

  const results = {
    jobs: [],
    tweets: [],
    usingMock: false,
    twitterError: null,   // surfaces specific Twitter subscription errors
    hasMore: false,
    page,
    error: null,
  };

  // ── No key at all → full mock mode ──────────────────────────────────────
  if (!hasRapidApiKey) {
    results.usingMock = true;
    if (sources.includes('jobs')) {
      const allMock = getMockJobs().filter((j) =>
        j.title.toLowerCase().includes(query.toLowerCase()) ||
        j.description.toLowerCase().includes(query.toLowerCase()) ||
        query.toLowerCase().split(' ').some((w) => w.length > 2 && j.title.toLowerCase().includes(w))
      );
      const pool = allMock.length ? allMock : getMockJobs();
      const start = (page - 1) * perPage;
      results.jobs = pool.slice(start, start + perPage);
      results.hasMore = pool.length > start + perPage;
    }
    if (sources.includes('twitter')) {
      results.tweets = getMockTweets(query);
    }
    return NextResponse.json(results);
  }

  // ── Real API calls ───────────────────────────────────────────────────────
  const promises = [];

  if (sources.includes('jobs')) {
    promises.push(
      searchJobsJSearch({ query, location, remote, page, perPage }).then((r) => {
        results.jobs = r.jobs;
        results.hasMore = r.jobs.length >= perPage;
        if (r.error) results.error = r.error;
      })
    );
  }

  if (sources.includes('twitter')) {
    promises.push(
      searchTwitterJobs(query, 15).then((r) => {
        if (r.error) {
          // Real Twitter API failed — surface the error clearly in UI
          results.twitterError = r.error;
          // Show relevant mock tweets as fallback so tab isn't blank
          results.tweets = getMockTweets(query).map((t) => ({ ...t, isFallback: true }));
        } else {
          results.tweets = r.tweets;
        }
      })
    );
  }

  await Promise.allSettled(promises);

  return NextResponse.json(results);
}
