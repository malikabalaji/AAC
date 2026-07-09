/* Renders a word symbol: OpenMoji SVG from /symbols (consistent, offline),
   falling back to the device's native emoji font if the file is missing.
   Custom caregiver photos come from IndexedDB via imageKey. */
import { useEffect, useState } from 'react';
import { mediaGet } from '../lib/idb.js';

export function openmojiPath(emoji) {
  const cps = [];
  for (const ch of emoji) {
    const cp = ch.codePointAt(0);
    if (cp === 0xfe0f) continue;
    cps.push(cp.toString(16).toUpperCase());
  }
  return '/symbols/' + cps.join('-') + '.svg';
}

export function SymbolIcon({ glyph, size = 44 }) {
  const [broken, setBroken] = useState(false);
  if (!glyph) return null;
  if (broken) {
    return (
      <span aria-hidden="true" style={{ fontSize: size * 0.82, lineHeight: 1 }}>
        {glyph}
      </span>
    );
  }
  return (
    <img
      src={openmojiPath(glyph)}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      draggable={false}
      onError={() => setBroken(true)}
      style={{ display: 'block' }}
    />
  );
}

export function useMediaUrl(key) {
  const [entry, setEntry] = useState({ key: null, url: null });
  useEffect(() => {
    if (!key) return undefined;
    let revoked = false;
    let objectUrl = null;
    mediaGet(key)
      .then((blob) => {
        if (blob && !revoked) {
          objectUrl = URL.createObjectURL(blob);
          setEntry({ key, url: objectUrl });
        }
      })
      .catch(() => {});
    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [key]);
  return entry.key === key ? entry.url : null;
}

export function CustomImage({ imageKey, size = 44 }) {
  const url = useMediaUrl(imageKey);
  if (!url) return null;
  return <img src={url} alt="" width={size} height={size} className="tile-img" draggable={false} />;
}
