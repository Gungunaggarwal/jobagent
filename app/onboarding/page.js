'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import './onboarding.css';

/* ─── QUESTION BANKS ─────────────────────────────────────── */
const CANDIDATE_STEPS = [
  {
    id: 'role_type',
    type: 'radio',
    label: 'What best describes you?',
    hint: 'SELECT ONLY ONE',
    options: ['Job Seeker (actively looking)', 'Passively open to opportunities', 'Exploring / just curious'],
  },
  {
    id: 'job_title',
    type: 'text',
    label: 'What role are you looking for?',
    hint: 'YOUR TARGET ROLE',
    placeholder: 'e.g. Frontend Engineer, Product Manager…',
  },
  {
    id: 'experience',
    type: 'radio',
    label: 'How many years of experience do you have?',
    hint: 'SELECT ONLY ONE',
    options: ['0–1 year (Fresh / Intern)', '2–4 years', '5–8 years', '9+ years (Senior / Lead)'],
  },
  {
    id: 'skills',
    type: 'tags',
    label: 'What are your top skills?',
    hint: 'ADD UP TO 8 SKILLS',
    suggestions: ['React', 'Python', 'Node.js', 'TypeScript', 'SQL', 'AWS', 'Figma', 'Java', 'Go', 'Machine Learning', 'Product Management', 'Data Analysis'],
  },
  {
    id: 'location_pref',
    type: 'radio',
    label: 'What is your preferred work arrangement?',
    hint: 'SELECT ONLY ONE',
    options: ['Remote', 'Hybrid', 'On-site', 'Flexible / No preference'],
  },
  {
    id: 'resume',
    type: 'upload',
    label: 'Upload your resume to supercharge your applications.',
    hint: 'PDF OR DOCX · MAX 5 MB',
    placeholder: 'Drop your resume here or click to browse',
  },
  {
    id: 'about',
    type: 'textarea',
    label: 'Tell us a little about yourself.',
    hint: 'SHORT BIO',
    placeholder: "e.g. I'm a full-stack engineer with a passion for building user-first products…",
  },
];

const RECRUITER_STEPS = [
  {
    id: 'company',
    type: 'text',
    label: 'What company are you hiring for?',
    hint: 'COMPANY NAME',
    placeholder: 'e.g. Acme Corp, Stripe, OpenAI…',
  },
  {
    id: 'hiring_for',
    type: 'text',
    label: 'What role(s) are you currently hiring for?',
    hint: 'JOB TITLE(S)',
    placeholder: 'e.g. Senior Backend Engineer, UX Designer…',
  },
  {
    id: 'team_size',
    type: 'radio',
    label: 'What is your company size?',
    hint: 'SELECT ONLY ONE',
    options: ['1–10 (Startup)', '11–50 (Seed / Series A)', '51–500 (Growth Stage)', '500+ (Enterprise)'],
  },
  {
    id: 'hiring_volume',
    type: 'radio',
    label: 'How many hires are you targeting this quarter?',
    hint: 'SELECT ONLY ONE',
    options: ['1–2 positions', '3–10 positions', '10–50 positions', '50+ positions'],
  },
  {
    id: 'work_model',
    type: 'radio',
    label: 'What work model are you offering?',
    hint: 'SELECT ONLY ONE',
    options: ['Fully Remote', 'Hybrid', 'On-site only', 'Varies by role'],
  },
  {
    id: 'must_haves',
    type: 'tags',
    label: 'What skills are must-haves in candidates?',
    hint: 'ADD UP TO 8 SKILLS',
    suggestions: ['React', 'Python', 'Node.js', 'TypeScript', 'SQL', 'AWS', 'Figma', 'Java', 'Go', 'Machine Learning', 'Product Strategy', 'Data Analysis'],
  },
  {
    id: 'about_company',
    type: 'textarea',
    label: 'Tell us a bit about your company & culture.',
    hint: 'COMPANY OVERVIEW',
    placeholder: "e.g. We're a Series B fintech building infrastructure for emerging markets…",
  },
];

/* ─── MAIN COMPONENT ─────────────────────────────────────── */
export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();

  // Phase: 'role' → 'questions' → 'done'
  const [phase, setPhase] = useState('role');
  const [userRole, setUserRole] = useState(null); // 'candidate' | 'recruiter'
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [tagInput, setTagInput] = useState('');
  const [animating, setAnimating] = useState(false);
  const [fileName, setFileName] = useState('');

  const steps = userRole === 'recruiter' ? RECRUITER_STEPS : CANDIDATE_STEPS;
  const totalSteps = steps.length;

  /* ─── Role selection ─── */
  function handleRoleSelect(role) {
    setUserRole(role);
    setAnimating(true);
    setTimeout(() => {
      setPhase('questions');
      setCurrentStep(0);
      setAnimating(false);
    }, 400);
  }

  /* ─── Navigate between question cards ─── */
  async function goNext() {
    if (animating) return;
    setAnimating(true);
    
    if (currentStep < totalSteps - 1) {
      setTimeout(() => {
        setCurrentStep((s) => s + 1);
        setAnimating(false);
      }, 380);
    } else {
      // We are on the last step, submit data to DB
      try {
        const res = await fetch('/api/user/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: answers, role: userRole })
        });
        
        if (res.ok) {
          // Tell NextAuth to refresh the JWT to grab the new onboardingComplete status
          await update({ role: userRole, onboardingComplete: true });
          
          setPhase('done');
          setTimeout(() => router.push('/dashboard'), 1600);
        } else {
          console.error("Failed to save profile");
          setAnimating(false);
        }
      } catch (e) {
        console.error(e);
        setAnimating(false);
      }
    }
  }

  function goBack() {
    if (animating) return;
    if (currentStep === 0) {
      setPhase('role');
      setUserRole(null);
      return;
    }
    setAnimating(true);
    setTimeout(() => {
      setCurrentStep((s) => s - 1);
      setAnimating(false);
    }, 260);
  }

  /* ─── Answer helpers ─── */
  function setAnswer(id, value) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function addTag(step) {
    const val = tagInput.trim();
    if (!val) return;
    const current = answers[step.id] || [];
    if (current.length >= 8 || current.includes(val)) { setTagInput(''); return; }
    setAnswer(step.id, [...current, val]);
    setTagInput('');
  }

  function removeTag(stepId, tag) {
    setAnswers((prev) => ({ ...prev, [stepId]: (prev[stepId] || []).filter((t) => t !== tag) }));
  }

  function toggleSuggestion(step, tag) {
    const current = answers[step.id] || [];
    if (current.includes(tag)) {
      setAnswer(step.id, current.filter((t) => t !== tag));
    } else if (current.length < 8) {
      setAnswer(step.id, [...current, tag]);
    }
  }

  /* ─── Progress % ─── */
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  /* ─── Redirect if not signed in or already onboarded ─── */
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    // If they already finished onboarding, kick them to dashboard
    if (session?.user?.onboardingComplete) {
      router.push('/dashboard');
    }
  }, [status, session]);

  if (status === 'loading') {
    return (
      <div className="ob-loading">
        <div className="ob-spinner" />
      </div>
    );
  }

  /* ─── DONE SCREEN ─── */
  if (phase === 'done') {
    return (
      <div className="ob-root">
        <div className="ob-bg" />
        <div className="ob-done-card">
          <div className="ob-done-icon">🎉</div>
          <h2 className="ob-done-title">You're all set!</h2>
          <p className="ob-done-sub">Taking you to your dashboard…</p>
          <div className="ob-done-bar"><div className="ob-done-fill" /></div>
        </div>
      </div>
    );
  }

  /* ─── ROLE SELECTION SCREEN ─── */
  if (phase === 'role') {
    return (
      <div className="ob-root">
        <div className="ob-bg" />
        <div className={`ob-role-wrapper ${animating ? 'ob-exit' : 'ob-enter'}`}>
          {/* Ghost cards behind */}
          <div className="ob-ghost ob-ghost-3" />
          <div className="ob-ghost ob-ghost-2" />

          <div className="ob-card">
            <div className="ob-brand">
              <span className="ob-brand-dot" />
              Talento
            </div>
            <p className="ob-step-label">WELCOME</p>
            <h2 className="ob-question">How would you like to use Talento?</h2>
            <p className="ob-hint">SELECT ONLY ONE</p>

            <div className="ob-role-options">
              <button
                id="role-candidate"
                className="ob-role-card"
                onClick={() => handleRoleSelect('candidate')}
              >
                <span className="ob-role-icon">🎯</span>
                <div>
                  <div className="ob-role-title">I'm a Candidate</div>
                  <div className="ob-role-desc">Looking for my next opportunity</div>
                </div>
                <span className="ob-role-arrow">→</span>
              </button>

              <button
                id="role-recruiter"
                className="ob-role-card"
                onClick={() => handleRoleSelect('recruiter')}
              >
                <span className="ob-role-icon">🏢</span>
                <div>
                  <div className="ob-role-title">I'm a Recruiter</div>
                  <div className="ob-role-desc">Finding the right talent for my team</div>
                </div>
                <span className="ob-role-arrow">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── QUESTION CARDS ─── */
  const step = steps[currentStep];
  const currentAnswer = answers[step.id];

  return (
    <div className="ob-root">
      <div className="ob-bg" />

      <div className="ob-stack-wrapper">
        {/* Ghost cards (peek behind) */}
        {currentStep < totalSteps - 1 && <div className="ob-ghost ob-ghost-3" />}
        {currentStep < totalSteps - 1 && <div className="ob-ghost ob-ghost-2" />}

        {/* Active card */}
        <div className={`ob-card ${animating ? 'ob-card-exit' : 'ob-card-enter'}`}>
          {/* Progress bar */}
          <div className="ob-progress-row">
            <div className="ob-progress-track">
              <div className="ob-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <button className="ob-close-btn" onClick={() => router.push('/dashboard')} title="Skip onboarding">✕</button>
          </div>

          {/* Step label */}
          <p className="ob-step-label">
            QUESTION {String(currentStep + 1).padStart(2, '0')} / {String(totalSteps).padStart(2, '0')}
          </p>

          <h2 className="ob-question">{step.label}</h2>
          <p className="ob-hint">{step.hint}</p>

          {/* ── Radio ── */}
          {step.type === 'radio' && (
            <div className="ob-radio-group">
              {step.options.map((opt) => (
                <label key={opt} className={`ob-radio-label ${currentAnswer === opt ? 'ob-radio-selected' : ''}`}>
                  <input
                    type="radio"
                    name={step.id}
                    value={opt}
                    checked={currentAnswer === opt}
                    onChange={() => setAnswer(step.id, opt)}
                  />
                  <span className="ob-radio-circle" />
                  {opt}
                </label>
              ))}
            </div>
          )}

          {/* ── Text ── */}
          {step.type === 'text' && (
            <input
              className="ob-text-input"
              type="text"
              placeholder={step.placeholder}
              value={currentAnswer || ''}
              onChange={(e) => setAnswer(step.id, e.target.value)}
              autoFocus
            />
          )}

          {/* ── Textarea ── */}
          {step.type === 'textarea' && (
            <textarea
              className="ob-textarea"
              placeholder={step.placeholder}
              value={currentAnswer || ''}
              onChange={(e) => setAnswer(step.id, e.target.value)}
              autoFocus
            />
          )}

          {/* ── Tags ── */}
          {step.type === 'tags' && (
            <div className="ob-tags-wrapper">
              <div className="ob-tag-suggestions">
                {step.suggestions.map((s) => (
                  <button
                    key={s}
                    className={`ob-suggestion ${(answers[step.id] || []).includes(s) ? 'ob-suggestion-active' : ''}`}
                    onClick={() => toggleSuggestion(step, s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="ob-tag-input-row">
                <input
                  className="ob-text-input"
                  type="text"
                  placeholder="Type a skill and press Enter…"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTag(step)}
                />
              </div>
              {(answers[step.id] || []).length > 0 && (
                <div className="ob-tags-row">
                  {(answers[step.id] || []).map((tag) => (
                    <span key={tag} className="ob-tag">
                      {tag}
                      <button onClick={() => removeTag(step.id, tag)} className="ob-tag-remove">✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Resume Upload ── */}
          {step.type === 'upload' && (
            <label className="ob-upload-zone">
              <input
                type="file"
                accept=".pdf,.docx"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { setFileName(f.name); setAnswer(step.id, f.name); }
                }}
              />
              <span className="ob-upload-icon">📄</span>
              <span className="ob-upload-label">
                {fileName || step.placeholder}
              </span>
              {fileName && <span className="ob-upload-success">✓ File selected</span>}
            </label>
          )}

          {/* Navigation */}
          <div className="ob-nav">
            <button className="ob-btn-back" onClick={goBack}>Back</button>
            <button
              id="ob-next-btn"
              className="ob-btn-next"
              onClick={goNext}
            >
              {currentStep === totalSteps - 1 ? 'Finish 🎉' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
