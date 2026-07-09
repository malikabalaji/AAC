/* Landing page — split layout. Left: brand panel (mark, name, what AACASH
   is). Right: setup card — username, caregiver's number, language chips.
   No steps, no timeouts. */
import { useState } from 'react';
import { AacashMark } from './Logo.jsx';
import { LANGUAGES } from '../data/languages.js';
import { newProfile } from '../lib/store.jsx';

function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="10" fill="#3b82f6" opacity="0.25" />
      <path d="M6.5 11.5 L9.5 14.5 L15.5 8" stroke="#93c5fd" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Onboarding({ onDone }) {
  const [name, setName] = useState('');
  const [lang, setLang] = useState('en');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const start = () => {
    if (!name.trim()) return setError('Please enter a username.');
    const digits = phone.replace(/[\s-]/g, '');
    if (digits && !/^\+?\d{7,15}$/.test(digits)) {
      return setError('That number doesn’t look right — digits only, e.g. +91 98765 43210.');
    }
    onDone({ ...newProfile(name.trim(), lang), guardianPhones: digits ? [digits] : [] });
  };

  return (
    <main className="landing">
      {/* ---- Brand panel ---- */}
      <section className="landing-brand">
        <div className="landing-brand-inner">
          <AacashMark size={110} onDark />
          <h1 className="landing-name">AACASH</h1>
          <p className="landing-sub">
            Augmentative &amp; Alternative Communication
            <br />
            Autism Spectrum Helper
          </p>
          <ul className="landing-points">
            <li>
              <CheckIcon />
              <span>Tap symbols, build sentences, speak them aloud</span>
            </li>
            <li>
              <CheckIcon />
              <span>English + 6 Indian languages</span>
            </li>
            <li>
              <CheckIcon />
              <span>Works fully offline</span>
            </li>
            <li>
              <CheckIcon />
              <span>Private — everything stays on this device</span>
            </li>
          </ul>
        </div>
      </section>

      {/* ---- Setup card ---- */}
      <section className="landing-form">
        <div className="landing-card">
          <h2 className="landing-welcome">Welcome</h2>
          <p className="landing-hint">Set up the board in seconds.</p>

          <div className="field">
            <label htmlFor="ob-name">Username</label>
            <input
              id="ob-name"
              className="landing-input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="e.g. Meera"
              autoComplete="off"
              onKeyDown={(e) => e.key === 'Enter' && start()}
            />
          </div>

          <div className="field">
            <label htmlFor="ob-phone">Caregiver’s number</label>
            <input
              id="ob-phone"
              className="landing-input"
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError('');
              }}
              placeholder="+91 98765 43210"
              autoComplete="tel"
              onKeyDown={(e) => e.key === 'Enter' && start()}
            />
          </div>

          <div className="field">
            <span className="label" id="ob-lang-label">
              Language
            </span>
            <div className="lang-chips" role="radiogroup" aria-labelledby="ob-lang-label">
              {Object.entries(LANGUAGES).map(([k, v]) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={lang === k}
                  className={`lang-chip${lang === k ? ' selected' : ''}`}
                  onClick={() => setLang(k)}
                >
                  <span className="lang-chip-native" lang={k}>
                    {v.native}
                  </span>
                  {v.label !== v.native && <span className="lang-chip-en">{v.label}</span>}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p role="alert" style={{ color: 'var(--ac-danger)', fontWeight: 700, marginBottom: 'var(--sp-3)' }}>
              {error}
            </p>
          )}

          <button type="button" className="btn btn-primary landing-cta" onClick={start}>
            Start communicating
          </button>
        </div>
      </section>
    </main>
  );
}
