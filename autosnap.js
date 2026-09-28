// Auto-snapshots — periodically capture every open window's tabs, so a crash or a
// forgotten save never loses them. Kept in their own key (NOT in state.history):
// frequent timer writes would otherwise evict the user's meaningful undo versions.

import { isSavable, addSession } from "./storage.js";

const KEY = "keeptabs_auto";
const SETTINGS_KEY = "keeptabs_autosnap";
const ALARM = "keeptabs-autosnap";
export const SNAPSHOT_CAP = 20; // keep last N auto-snapshots
export const INTERVALS = [5, 15, 30, 60]; // minutes offered in the settings UI

export const defaultAutoSettings = () => ({ enabled: true, intervalMin: 15 });

export async function getAutoSettings() {
  const o = await chrome.storage.local.get(SETTINGS_KEY);
  return { ...defaultAutoSettings(), ...(o[SETTINGS_KEY] || {}) };
}

export async function setAutoSettings(patch) {
  const next = { ...(await getAutoSettings()), ...patch };
  await chrome.storage.local.set({ [SETTINGS_KEY]: next });
  await scheduleAlarm(next);
  return next;
}

// (Re)create or clear the periodic alarm to match the settings.
export async function scheduleAlarm(settings) {
  const s = settings || (await getAutoSettings());
  await chrome.alarms.clear(ALARM);
  if (s.enabled) chrome.alarms.create(ALARM, { periodInMinutes: s.intervalMin });
}

export const isAutoSnapAlarm = (alarm) => alarm?.name === ALARM;

export async function getSnapshots() {
  const o = await chrome.storage.local.get(KEY);
  return o[KEY] || [];
}

// Every normal (non-incognito) window → its savable tabs. Empty windows are dropped.
export async function captureWindows() {
  const wins = await chrome.windows.getAll({ populate: true, windowTypes: ["normal"] });
  return wins
    .filter((w) => !w.incognito)
    .map((w) => ({
      tabs: (w.tabs || [])
        .filter((tb) => isSavable(tb.url))
        .map((tb) => ({ url: tb.url, title: tb.title || tb.url, favIconUrl: tb.favIconUrl || "" })),
    }))
    .filter((w) => w.tabs.length);
}

// Same windows with the same tab URLs (in order) as the latest snapshot → skip writing.
// Titles/favicons are ignored: they churn (e.g. "(3) Inbox") without a real change.
export function isSameSnapshot(prev, next) {
  if (!prev) return false;
  const key = (snap) => JSON.stringify(snap.windows.map((w) => w.tabs.map((tb) => tb.url)));
  return key(prev) === key(next);
}

// Capture now and store it (newest first, capped). Returns the snapshot, or null if skipped.
export async function takeSnapshot(now = Date.now()) {
  const windows = await captureWindows();
  if (!windows.length) return null; // nothing open worth keeping
  const snaps = await getSnapshots();
  const snap = { id: now, ts: now, windows };
  if (isSameSnapshot(snaps[0], snap)) return null;
  await chrome.storage.local.set({ [KEY]: [snap, ...snaps].slice(0, SNAPSHOT_CAP) });
  return snap;
}

// Reopen a snapshot: one new browser window per captured window.
export async function openSnapshot(id) {
  const snap = (await getSnapshots()).find((s) => s.id === id);
  if (!snap) return 0;
  for (const w of snap.windows) await chrome.windows.create({ url: w.tabs.map((tb) => tb.url) });
  return snap.windows.length;
}

// Promote a snapshot into regular saved sessions (one per window), so it's kept for good
// and covered by the versioned history.
export async function saveSnapshotAsSessions(id) {
  const snap = (await getSnapshots()).find((s) => s.id === id);
  if (!snap) return 0;
  for (const w of [...snap.windows].reverse()) {
    await addSession({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      name: "",
      createdAt: snap.ts,
      tabs: structuredClone(w.tabs),
    });
  }
  return snap.windows.length;
}
