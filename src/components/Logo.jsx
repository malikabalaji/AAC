/* AACASH brand mark + wordmark.
   The mark is three sound-wave lines (speaker waves reduced to only the
   lines), mirroring public/aacash-mark.svg. In-app it renders without the
   tile — just the lines — for a clean, professional header. */

export function AacashMark({ size = 40, tile = false, onDark = false }) {
  if (onDark) {
    return (
      <svg viewBox="0 0 128 128" width={size} height={size} aria-hidden="true" focusable="false" style={{ flexShrink: 0, display: 'block' }}>
        <path d="M42 51 A 21 21 0 0 1 42 77" fill="none" stroke="#bfdbfe" strokeWidth="11" strokeLinecap="round" />
        <path d="M62 38 A 40 40 0 0 1 62 90" fill="none" stroke="#60a5fa" strokeWidth="11" strokeLinecap="round" />
        <path d="M82 25 A 59 59 0 0 1 82 103" fill="none" stroke="#3b82f6" strokeWidth="11" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 128 128"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      style={{ flexShrink: 0, display: 'block' }}
    >
      {tile && <rect x="0" y="0" width="128" height="128" rx="28" fill="#0b1220" />}
      <path d="M42 51 A 21 21 0 0 1 42 77" fill="none" stroke={tile ? '#93c5fd' : 'var(--ac-accent)'} strokeWidth="11" strokeLinecap="round" />
      <path d="M62 38 A 40 40 0 0 1 62 90" fill="none" stroke={tile ? '#3b82f6' : 'var(--ac-primary)'} strokeWidth="11" strokeLinecap="round" />
      <path d="M82 25 A 59 59 0 0 1 82 103" fill="none" stroke={tile ? '#1d4ed8' : 'var(--ac-primary-strong)'} strokeWidth="11" strokeLinecap="round" />
    </svg>
  );
}

export function AacashWordmark({ markSize = 40, compact = false }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <AacashMark size={markSize} />
      {!compact && (
        <span style={{ lineHeight: 1.1 }}>
          <span
            style={{
              display: 'block',
              fontWeight: 800,
              fontSize: markSize * 0.52,
              color: 'var(--ac-ink)',
              letterSpacing: '0.04em',
            }}
          >
            AACASH
          </span>
          <span
            style={{
              display: 'block',
              fontWeight: 600,
              fontSize: markSize * 0.21,
              color: 'var(--ac-ink-soft)',
              letterSpacing: '0.02em',
            }}
          >
            Augmentative &amp; Alternative Communication · Autism Spectrum Helper
          </span>
        </span>
      )}
    </span>
  );
}
