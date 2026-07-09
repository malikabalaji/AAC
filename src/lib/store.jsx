/* ============================================================================
   APP STATE — profiles + global settings, persisted to localStorage.
   Privacy by design: nothing here ever leaves the device. No analytics,
   no tracking, no network calls carrying child data.
   ============================================================================ */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_GRID } from '../data/vocabulary.js';
import { mediaGet, mediaPut, mediaDelete, newMediaKey } from './idb.js';

const STORAGE_KEY = 'aacash.state.v1';
const LEGACY_KEY = 'kural.state.v1'; // pre-rebrand data, migrated on first load

export function newProfile(name = '', lang = 'en') {
  return {
    id: 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name,
    lang,            // board language
    guardianPhones: [], // caregiver numbers for the SOS slide-to-call
    showEnglish: true, // code-switching: show English under the word
    gridId: DEFAULT_GRID,
    textOnly: false, // literate users: text-only tiles
    rate: 0.9,
    pitch: 1.1,
    voiceURI: null,  // explicit voice choice, else best match for lang
    tileGap: 10,     // px — larger for keyguard users
    scan: { on: false, dwellMs: 1500 }, // row-column switch scanning
    favorites: [],
    recents: [],
    freq: {},
    todFreq: {},
    hourFreq: {},   // hour-of-day usage (kernel-smoothed prediction)
    dowFreq: {},    // weekday vs weekend usage
    phraseFreq: {}, // quick-phrase usage per hour (adaptive suggestions)
    bigrams: {},
    customWords: [], // caregiver-added: {id, cat, pos, labels:{en,...}, imageKey?, audioKey?}
    hiddenWords: [], // built-in word ids hidden by the caregiver
    catOrder: null,  // caregiver-chosen category tab order (null = default)
  };
}

const DEFAULT_STATE = {
  settings: {
    theme: null,       // 'light' | 'dark' | null = follow the system
    contrast: 'normal',
    motion: 'auto',
    textScale: 1,
    onboarded: false,
    activeProfileId: null,
  },
  profiles: [],
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    const settings = { ...DEFAULT_STATE.settings, ...parsed.settings };
    delete settings.pin; // PIN feature removed
    return {
      settings,
      profiles: (parsed.profiles || []).map((p) => {
        const merged = { ...newProfile(), ...p };
        // migrate the old single guardianPhone field to the list
        if (!merged.guardianPhones?.length && p.guardianPhone) merged.guardianPhones = [p.guardianPhone];
        delete merged.guardianPhone;
        return merged;
      }),
    };
  } catch {
    return DEFAULT_STATE;
  }
}

const StoreCtx = createContext(null);

export function StoreProvider({ children }) {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('AACASH: could not persist state', e);
    }
  }, [state]);

  // reflect accessibility settings on <html> so CSS tokens react
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.contrast = state.settings.contrast;
    root.dataset.motion = state.settings.motion === 'reduced' ? 'reduced' : 'auto';
    root.style.setProperty('--text-scale', String(state.settings.textScale));
  }, [state.settings.contrast, state.settings.motion, state.settings.textScale]);

  // theme: explicit choice wins; otherwise follow the system, live
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      document.documentElement.dataset.theme =
        state.settings.theme || (mq.matches ? 'dark' : 'light');
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [state.settings.theme]);

  const api = useMemo(() => {
    const setSettings = (patch) =>
      setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));

    const addProfile = (profile) =>
      setState((s) => ({
        ...s,
        profiles: [...s.profiles, profile],
        settings: { ...s.settings, activeProfileId: profile.id },
      }));

    const updateProfile = (id, patch) =>
      setState((s) => ({
        ...s,
        profiles: s.profiles.map((p) =>
          p.id === id ? { ...p, ...(typeof patch === 'function' ? patch(p) : patch) } : p
        ),
      }));

    const removeProfile = (id) =>
      setState((s) => {
        const profiles = s.profiles.filter((p) => p.id !== id);
        return {
          ...s,
          profiles,
          settings: {
            ...s.settings,
            activeProfileId:
              s.settings.activeProfileId === id ? profiles[0]?.id ?? null : s.settings.activeProfileId,
          },
        };
      });

    return { setState, setSettings, addProfile, updateProfile, removeProfile };
  }, []);

  const activeProfile =
    state.profiles.find((p) => p.id === state.settings.activeProfileId) || state.profiles[0] || null;

  return (
    <StoreCtx.Provider value={{ state, activeProfile, ...api }}>{children}</StoreCtx.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore outside StoreProvider');
  return ctx;
}

/* ---- Export / import (JSON backup a caregiver can move between devices).
   Media blobs are inlined as data URLs so one file carries everything. ---- */

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

async function dataUrlToBlob(dataUrl) {
  return (await fetch(dataUrl)).blob();
}

export async function exportProfile(profile) {
  const media = {};
  for (const w of profile.customWords) {
    for (const key of [w.imageKey, w.audioKey]) {
      if (key) {
        const blob = await mediaGet(key);
        if (blob) media[key] = await blobToDataUrl(blob);
      }
    }
  }
  return JSON.stringify({ aacash: 1, exportedAt: new Date().toISOString(), profile, media }, null, 2);
}

export async function importProfile(json) {
  const data = JSON.parse(json);
  if ((data.aacash !== 1 && data.kural !== 1) || !data.profile) throw new Error('Not an AACASH backup file');
  const profile = { ...newProfile(), ...data.profile };
  profile.id = 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  // re-key media so imports never collide with existing entries
  for (const w of profile.customWords) {
    for (const field of ['imageKey', 'audioKey']) {
      const oldKey = w[field];
      if (oldKey && data.media?.[oldKey]) {
        const nk = newMediaKey(field === 'imageKey' ? 'img' : 'aud');
        await mediaPut(nk, await dataUrlToBlob(data.media[oldKey]));
        w[field] = nk;
      } else if (oldKey) {
        w[field] = null; // media missing from backup — drop the reference
      }
    }
  }
  return profile;
}

export async function deleteProfileMedia(profile) {
  for (const w of profile.customWords) {
    if (w.imageKey) await mediaDelete(w.imageKey);
    if (w.audioKey) await mediaDelete(w.audioKey);
  }
}
