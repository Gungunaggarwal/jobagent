import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="landing-container">
      {/* Background Leaves */}
      <div className="landing-bg-leaves"></div>

      {/* Floating Centered Card */}
      <div className="landing-card">
        
        {/* Left Solid Content */}
        <div className="landing-content">
          <header className="landing-header">
            <div className="landing-logo">TALENTO</div>
          </header>

          <div className="landing-main-text">
            <h1>WELCOME TO<br/>TALENTO</h1>
            <p className="landing-description">
              Your AI Job Search Command Center.<br/>We automate your job search with intelligent filtering, tailored cover letters, and interview prep.
            </p>
            <p className="landing-subtext">
              Search, filter, apply, and prep — everything<br/>you need to bring your career goals to life.
            </p>
            <Link href="/login" className="landing-btn">
              sign up
            </Link>
          </div>
        </div>

        {/* Right Sliced Panels Effect */}
        <div className="landing-slices">
          <nav className="landing-nav">
            <a href="#about">about us</a>
            <a href="#features">features</a>
            <a href="#contacts">contacts</a>
          </nav>

          {/* Slices Container */}
          <div className="slices-wrapper">
            {/* The horizontal TALENTO text cutting across */}
            <h2 className="slices-center-text">TALENTO</h2>

            <div className="slice slice-1"></div>
            <div className="slice slice-2">
              <span className="slice-label" style={{ top: '30%' }}>AI<br/>Powered</span>
            </div>
            <div className="slice slice-3">
              <span className="slice-label" style={{ bottom: '40%' }}>Smart<br/>Filter</span>
            </div>
            <div className="slice slice-4">
              <span className="slice-label" style={{ bottom: '25%' }}>Interview<br/>Prep</span>
            </div>
            <div className="slice slice-5">
              <span className="slice-label" style={{ bottom: '35%' }}>Apply<br/>Engine</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
