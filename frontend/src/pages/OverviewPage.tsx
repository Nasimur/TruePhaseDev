import {
  ArrowRight,
  CalendarDays,
  ChartNoAxesCombined,
  HeartPulse,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

export function OverviewPage() {
  return (
    <div className="page overview-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR OVERVIEW</p>
          <h1>
            Welcome to your space <span aria-hidden="true">✳</span>
          </h1>
          <p className="page-subtitle">
            A calm place to get to know your cycle, one day at a time.
          </p>
        </div>
        <span className="date-pill">
          <CalendarDays size={17} aria-hidden="true" />{" "}
          {new Intl.DateTimeFormat("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }).format(new Date())}
        </span>
      </div>

      <section className="hero-card" aria-labelledby="hero-title">
        <div className="hero-content">
          <span className="hero-kicker">
            <Sparkles size={15} aria-hidden="true" /> A FRESH START
          </span>
          <h2 id="hero-title">Your journey starts here.</h2>
          <p>
            TruePhase gives you a simple home for your cycle notes. Your
            calendar and insights will come together as you add your own
            records.
          </p>
          <Link to="/calendar" className="primary-button">
            Explore the calendar <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="sun-disc">
            <HeartPulse size={62} strokeWidth={1.15} />
          </div>
          <span className="art-sparkle art-sparkle-one">✳</span>
          <span className="art-sparkle art-sparkle-two">✧</span>
        </div>
      </section>

      <div className="section-heading">
        <h2>Make it yours</h2>
        <p>Everything in one thoughtful place.</p>
      </div>
      <div className="feature-grid">
        <Link to="/calendar" className="feature-card">
          <span className="feature-icon peach">
            <CalendarDays size={25} strokeWidth={1.7} />
          </span>
          <span className="feature-title">
            Your calendar <ArrowRight size={17} aria-hidden="true" />
          </span>
          <span className="feature-description">
            See your cycle at a glance and keep track of important dates.
          </span>
        </Link>
        <Link to="/insights" className="feature-card">
          <span className="feature-icon lavender">
            <ChartNoAxesCombined size={25} strokeWidth={1.7} />
          </span>
          <span className="feature-title">
            Your insights <ArrowRight size={17} aria-hidden="true" />
          </span>
          <span className="feature-description">
            Find patterns in your records as your history grows.
          </span>
        </Link>
      </div>

      <div className="privacy-note">
        <LockKeyhole size={18} aria-hidden="true" />
        <p>
          <strong>Made with privacy in mind.</strong> Calendar entries in this
          demo stay in memory and reset when you reload the page.
        </p>
      </div>
    </div>
  );
}
