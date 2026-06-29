'use client';

import { useState, useRef, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Start at 3 seconds
    video.currentTime = 3;

    const handleTimeUpdate = () => {
      // Loop back to 3s if it hits 15s
      if (video.currentTime >= 15) {
        video.currentTime = 3;
        video.play().catch(e => console.error("Video play error:", e));
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isRegistering) {
      // Handle Registration
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Registration failed');
        }
        
        // Log them in automatically after registering
        const signInRes = await signIn('credentials', {
          redirect: false,
          email,
          password,
        });

        if (signInRes?.error) {
          throw new Error(signInRes.error);
        } else {
          router.push('/dashboard');
          router.refresh();
        }
      } catch (err) {
        setError(err.message);
      }
    } else {
      // Handle Login
      const signInRes = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (signInRes?.error) {
        setError(signInRes.error);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    }
    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden', fontFamily: 'var(--font-inter)' }}>
      <div style={{ flex: 1, position: 'relative', background: '#b8b8b8', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <video 
          ref={videoRef}
          autoPlay 
          muted 
          playsInline
          style={{ 
            position: 'absolute', 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', 
            zIndex: 0,
            transform: 'scale(1.6) translateX(15%)' 
          }}
        >
          {/* Video served from the public folder */}
          <source src="/login-bg.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Optional Dark Overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 }}></div>

        {/* You can add a logo or text over the video here if you want */}
        <div style={{ position: 'relative', zIndex: 2, padding: '40px', color: 'white' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800 }}>✨ Talento</h1>
        </div>
      </div>

      {/* Right Side - Login Details */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', position: 'relative', zIndex: 10, boxShadow: '-10px 0 30px rgba(0,0,0,0.05)' }}>
        <div style={{ width: '100%', maxWidth: 440, padding: '40px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: '#0f172a', marginBottom: 32, textAlign: 'center' }}>
            {isRegistering ? 'Create Account' : 'Welcome Back'}
          </h1>
          
          {error && <div style={{ color: 'red', fontSize: 13, marginBottom: 15, background: '#fef2f2', padding: 10, borderRadius: 6, border: '1px solid #fecaca' }}>{error}</div>}

          <form className="login-form" onSubmit={handleSubmit}>
            {isRegistering && (
              <div className="input-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  className="login-input" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required={isRegistering}
                />
              </div>
            )}

            <div className="input-group">
              <label>Email address</label>
              <input 
                type="email" 
                className="login-input" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input 
                  type="password" 
                  className="login-input" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <span className="eye-icon">👁️</span>
              </div>
            </div>

            <button type="submit" className="btn-login" style={{ background: 'linear-gradient(135deg, #38bdf8, #818cf8)', marginTop: 16 }} disabled={loading}>
              {loading ? 'Please wait...' : (isRegistering ? 'Sign Up' : 'Log in')}
            </button>
          </form>

          <div className="login-divider">
            <span>or continue with</span>
          </div>

          <div className="social-logins">
            <button className="social-btn google" onClick={() => signIn('google', { callbackUrl: '/dashboard' })}>
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width="20" />
            </button>
            <button className="social-btn twitter" onClick={() => signIn('twitter', { callbackUrl: '/dashboard' })}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#1da1f2">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>
          </div>

          <button 
            className="forgot-password" 
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'block', margin: '0 auto', marginTop: 24, fontSize: 14, color: '#64748b' }}
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
          >
            {isRegistering ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
