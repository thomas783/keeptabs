// Per-window tab cache — lets us snapshot a window AFTER it closes.
// windows.onRemoved fires once the tabs are already gone, so we keep each window's
// last-known tabs in chrome.storage.session (in-memory, survives service-worker
// restarts, cleared when the browser quits). One key per window → concurrent
// updates to different windows never clobber each other.

import { isSavable } from "./storage.js";

const PREFIX = "wc:";
const keyOf = (windowId) => PREFIX + windowId;

export const toSavableTabs = (tabs) =>
  (tabs || [])
    .filter((tb) => isSavable(tb.url))
    .map((tb) => ({ url: tb.url, title: tb.title || tb.url, favIconUrl: tb.favIconUrl || "" }));

// Re-read one window and store its savable tabs (incognito/non-normal windows are ignored).
async function writeWindow(windowId) {
  let win;
  try {
    win = await chrome.windows.get(windowId, { populate: true });
  } catch {
    return; // window already gone — keep the last cached state
  }
  if (win.incognito || win.type !== "normal") return;
  await chrome.storage.session.set({ [keyOf(windowId)]: toSavableTabs(win.tabs) });
}

// Serialize refreshes per window so an older capture can never land after a newer one.
const chains = new Map();
export function refreshWindow(windowId) {
  if (windowId == null || windowId < 0) return Promise.resolve();
  const next = (chains.get(windowId) || Promise.resolve()).then(() => writeWindow(windowId));
  chains.set(windowId, next.catch(() => {}));
  return next;
}

// Seed the cache for every open window (browser start / extension install).
export async function seedAll() {
  const wins = await chrome.windows.getAll({ windowTypes: ["normal"] });
  await Promise.all(wins.map((w) => refreshWindow(w.id)));
}

// Pop a closed window's cached tabs (waits for any in-flight refresh first).
export async function takeClosedWindow(windowId) {
  await chains.get(windowId);
  chains.delete(windowId);
  const key = keyOf(windowId);
  const o = await chrome.storage.session.get(key);
  await chrome.storage.session.remove(key);
  return o[key] || [];
}
