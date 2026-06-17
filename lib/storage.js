// localStorage-based application tracker
// All state persists across sessions in the browser

const STORAGE_KEY = 'jobagent_tracker';
const RESUME_KEY  = 'jobagent_resume';
const SEARCH_KEY  = 'jobagent_last_search';

// ─── Application Tracker ─────────────────────────────────────────────────────

export const APPLICATION_STATUSES = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected'];

export function getApplications() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveApplication(job) {
  const apps = getApplications();
  const existing = apps.find((a) => a.id === job.id);
  if (existing) return existing;

  const newApp = {
    ...job,
    status: 'Saved',
    savedAt: new Date().toISOString(),
    appliedAt: null,
    notes: '',
    coverLetter: '',
    score: job.score || null,
  };
  apps.unshift(newApp);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  return newApp;
}

export function updateApplicationStatus(id, status) {
  const apps = getApplications();
  const idx = apps.findIndex((a) => a.id === id);
  if (idx === -1) return;
  apps[idx].status = status;
  if (status === 'Applied') apps[idx].appliedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

export function saveCoverLetter(id, coverLetter) {
  const apps = getApplications();
  const idx = apps.findIndex((a) => a.id === id);
  if (idx === -1) return;
  apps[idx].coverLetter = coverLetter;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

export function updateNotes(id, notes) {
  const apps = getApplications();
  const idx = apps.findIndex((a) => a.id === id);
  if (idx === -1) return;
  apps[idx].notes = notes;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

export function removeApplication(id) {
  const apps = getApplications().filter((a) => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

export function getTrackerStats() {
  const apps = getApplications();
  return {
    total: apps.length,
    saved: apps.filter((a) => a.status === 'Saved').length,
    applied: apps.filter((a) => a.status === 'Applied').length,
    interview: apps.filter((a) => a.status === 'Interview').length,
    offer: apps.filter((a) => a.status === 'Offer').length,
  };
}

// ─── Resume Storage ───────────────────────────────────────────────────────────

export function saveResume(text) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(RESUME_KEY, text);
}

export function getResume() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(RESUME_KEY) || '';
}

// ─── Last Search ──────────────────────────────────────────────────────────────

export function saveLastSearch(params) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SEARCH_KEY, JSON.stringify(params));
}

export function getLastSearch() {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(SEARCH_KEY));
  } catch {
    return null;
  }
}
