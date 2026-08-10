// KeepTabs storage — the "never lose your tabs" core.
// Every mutation writes state AND pushes a versioned snapshot of all sessions,
// so an update/crash/bad-edit can always be rolled back.

const KEY = "keeptabs";
const HISTORY_CAP = 50; // keep last N snapshots

const emptyState = () => ({ version: 1, seq: 0, snapSeq: 0, sessions: [], history: [] });

export async function getState() {
  const obj = await chrome.storage.local.get(KEY);
  return obj[KEY] || emptyState();
}

// Write state + append a versioned snapshot (the durability guarantee).
export async function setState(state, reason = "edit") {
  const id = (state.snapSeq = (state.snapSeq || 0) + 1); // unique, collision-free
  const snapshot = {
    id,
    ts: Date.now(),
    reason,
    sessions: structuredClone(state.sessions),
  };
  const history = [snapshot, ...(state.history || [])].slice(0, HISTORY_CAP);
  const next = { ...state, version: state.version || 1, history };
  await chrome.storage.local.set({ [KEY]: next });
  return next;
}

export async function addSession(session) {
  const state = await getState();
  state.seq = (state.seq || 0) + 1;
  session.seq = state.seq; // stable sequence number; UI renders localized "Saved N"
  // session.name stays as provided (empty → UI shows the localized default)
  state.sessions = [session, ...state.sessions];
  return setState(state, "save");
}

export async function deleteSession(id) {
  const state = await getState();
  state.sessions = state.sessions.filter((s) => s.id !== id);
  return setState(state, "delete");
}

export async function renameSession(id, name) {
  const state = await getState();
  const s = state.sessions.find((x) => x.id === id);
  if (s) s.name = name;
  return setState(state, "rename");
}

export async function removeTab(sessionId, url) {
  const state = await getState();
  const s = state.sessions.find((x) => x.id === sessionId);
  if (s) s.tabs = s.tabs.filter((t) => t.url !== url);
  return setState(state, "remove-tab");
}

export async function restoreVersion(id) {
  const state = await getState();
  const snap = (state.history || []).find((h) => h.id === id);
  if (!snap) return state;
  state.sessions = structuredClone(snap.sessions);
  return setState(state, "restore-version");
}

export async function exportJSON() {
  const state = await getState();
  return JSON.stringify(
    { app: "KeepTabs", exportedAt: Date.now(), sessions: state.sessions },
    null,
    2
  );
}

export async function importJSON(text, mode = "merge") {
  const data = JSON.parse(text);
  const incoming = Array.isArray(data) ? data : data.sessions || [];
  const state = await getState();
  state.sessions =
    mode === "replace" ? incoming : [...incoming, ...state.sessions];
  return setState(state, "import");
}

export async function ensureInit() {
  const obj = await chrome.storage.local.get(KEY);
  if (!obj[KEY]) await chrome.storage.local.set({ [KEY]: emptyState() });
}
