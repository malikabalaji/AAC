/* SOS — calls a guardian's number. Deliberately hard to trigger by accident:
   the thumb must be slid to the end of the track AND held there for 3 seconds
   before the call is placed. Releasing early cancels. Keyboard/switch users:
   hold Enter or Space on the slider for 3 seconds.
   Multiple guardian numbers can be saved; each gets its own slider. */
import { useEffect, useRef, useState } from 'react';
import { Modal } from './Modal.jsx';

const HOLD_SECS = 3;
const ARM_AT = 0.95; // progress fraction that counts as "the end"

function PhoneIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6.6 3.2 8.9 3a1.6 1.6 0 0 1 1.7 1.2l.7 2.8a1.6 1.6 0 0 1-.6 1.7l-1.4 1a12.8 12.8 0 0 0 5 5l1-1.4a1.6 1.6 0 0 1 1.7-.6l2.8.7A1.6 1.6 0 0 1 21 15.1l-.2 2.3a1.9 1.9 0 0 1-2 1.7C10.4 18.6 5.4 13.6 4.9 5.2a1.9 1.9 0 0 1 1.7-2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SlideToCall({ phone, onCalled }) {
  const trackRef = useRef(null);
  const timerRef = useRef(null);
  const draggingRef = useRef(false);
  const firedRef = useRef(false);
  const [prog, setProg] = useState(0);
  const [holdLeft, setHoldLeft] = useState(null); // seconds remaining, null = not armed

  // Place the call. tel: only actually dials on a device with a phone dialer
  // (mobile/tablet). Using an anchor click is the most broadly supported way
  // to hand off to the OS dialer / FaceTime / Skype.
  const placeCall = () => {
    const a = document.createElement('a');
    a.href = 'tel:' + phone;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    onCalled?.();
  };

  const cancelHold = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setHoldLeft(null);
  };

  const startHold = () => {
    if (timerRef.current || firedRef.current) return;
    let left = HOLD_SECS;
    setHoldLeft(left);
    timerRef.current = setInterval(() => {
      left = Math.max(0, left - 0.1);
      setHoldLeft(left);
      if (left === 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        firedRef.current = true;
        placeCall();
        // reset the slider so it's reusable (the "called" note stays)
        setTimeout(() => {
          firedRef.current = false;
          draggingRef.current = false;
          setProg(0);
          setHoldLeft(null);
        }, 1500);
      }
    }, 100);
  };

  useEffect(() => cancelHold, []);

  const moveTo = (clientX) => {
    const track = trackRef.current?.getBoundingClientRect();
    if (!track) return;
    const thumb = 64;
    const p = Math.min(1, Math.max(0, (clientX - track.left - thumb / 2) / (track.width - thumb)));
    setProg(p);
    if (p >= ARM_AT) startHold();
    else cancelHold();
  };

  const release = () => {
    draggingRef.current = false;
    cancelHold();
    if (!firedRef.current) setProg(0);
  };

  const counting = holdLeft !== null && holdLeft > 0;

  return (
    <div
      ref={trackRef}
      className="sos-track"
      onPointerDown={(e) => {
        draggingRef.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        moveTo(e.clientX);
      }}
      onPointerMove={(e) => draggingRef.current && moveTo(e.clientX)}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <div className="sos-fill" style={{ width: `${(prog * 100).toFixed(1)}%` }} aria-hidden="true" />
      <span className="sos-track-label" aria-hidden="true">
        {counting ? `Keep holding… calling in ${Math.ceil(holdLeft)}` : 'Slide to the end, then hold'}
      </span>
      <button
        type="button"
        className="sos-thumb"
        style={{ left: `calc(${prog.toFixed(3)} * (100% - 64px))` }}
        aria-label={`Emergency call to ${phone}. Slide to the end and hold for ${HOLD_SECS} seconds, or hold Enter for ${HOLD_SECS} seconds.`}
        aria-live="assertive"
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.code === 'Space') && !e.repeat) {
            e.preventDefault();
            setProg(1);
            startHold();
          }
        }}
        onKeyUp={(e) => {
          if (e.key === 'Enter' || e.code === 'Space') release();
        }}
      >
        <PhoneIcon />
      </button>
    </div>
  );
}

function GuardianRow({ phone, onRemove }) {
  const [called, setCalled] = useState(false);
  return (
    <section aria-label={`Guardian ${phone}`} style={{ marginBottom: 'var(--sp-4)' }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 'var(--sp-2)' }}>
        <span style={{ fontWeight: 800, fontSize: 'var(--text-lg)' }}>{phone}</span>
        <button type="button" className="btn btn-ghost" onClick={onRemove} aria-label={`Remove ${phone}`}>
          Remove
        </button>
      </div>
      <SlideToCall phone={phone} onCalled={() => setCalled(true)} />
      <p className="hint" style={{ marginTop: 'var(--sp-2)', textAlign: 'center' }} aria-live="polite">
        {called ? (
          <>
            Opening the dialer for <b>{phone}</b>. If nothing happens (e.g. on a computer with no phone),{' '}
            <a href={'tel:' + phone} style={{ color: 'var(--ac-primary)', fontWeight: 700 }}>
              tap to call
            </a>{' '}
            or dial it manually.
          </>
        ) : (
          <>Slide to the end and hold {HOLD_SECS} seconds to call. Releasing early cancels.</>
        )}
      </p>
    </section>
  );
}

export function SosCall({ profile, updateProfile, onClose }) {
  const numbers = profile.guardianPhones || [];
  const [newNum, setNewNum] = useState('');
  const [error, setError] = useState('');

  const add = () => {
    const digits = newNum.replace(/[\s-]/g, '');
    if (!/^\+?\d{7,15}$/.test(digits)) return setError('Enter a valid number, e.g. +91 98765 43210.');
    if (numbers.includes(digits)) return setError('That number is already saved.');
    updateProfile(profile.id, (p) => ({ guardianPhones: [...(p.guardianPhones || []), digits] }));
    setNewNum('');
    setError('');
  };

  const remove = (n) =>
    updateProfile(profile.id, (p) => ({ guardianPhones: (p.guardianPhones || []).filter((x) => x !== n) }));

  return (
    <Modal title="SOS — call guardian" onClose={onClose}>
      {numbers.length === 0 && (
        <p style={{ lineHeight: 1.6, marginBottom: 'var(--sp-4)' }}>
          No guardian numbers saved yet. Add one below.
        </p>
      )}

      {numbers.map((n) => (
        <GuardianRow key={n} phone={n} onRemove={() => remove(n)} />
      ))}

      <div className="row" style={{ alignItems: 'flex-start' }}>
        <input
          type="tel"
          value={newNum}
          placeholder="+91 98765 43210"
          aria-label="New guardian number"
          style={{ flex: 1, minWidth: 180 }}
          onChange={(e) => {
            setNewNum(e.target.value);
            setError('');
          }}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button type="button" className="btn btn-primary" onClick={add}>
          Add number
        </button>
      </div>
      {error && (
        <p role="alert" style={{ color: 'var(--ac-danger)', fontWeight: 700, marginTop: 'var(--sp-2)' }}>
          {error}
        </p>
      )}
    </Modal>
  );
}
