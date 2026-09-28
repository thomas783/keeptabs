import { test } from "node:test";
import assert from "node:assert";
import { mockChrome } from "./setup.mjs";
import * as S from "../storage.js";
import * as A from "../autosnap.js";

// storage mock + windows/alarms mocks. `wins` is what windows.getAll returns.
function setup(wins = []) {
  const env = mockChrome();
  const alarms = new Map();
  const created = [];
  chrome.windows = {
    getAll: async () => wins,
    create: async (opts) => created.push(opts),
  };
  chrome.alarms = {
    create: (name, info) => alarms.set(name, info),
    clear: async (name) => alarms.delete(name),
  };
  return { ...env, alarms, created };
}

const tab = (url, title = "t") => ({ url, title, favIconUrl: "" });
const win = (tabs, extra = {}) => ({ incognito: false, tabs, ...extra });

test("captureWindows skips incognito, internal pages, and empty windows", async () => {
  setup([
    win([tab("https://a.com"), tab("chrome://settings")]),
    win([tab("https://secret.com")], { incognito: true }),
    win([tab("chrome://newtab")]),
  ]);
  const w = await A.captureWindows();
  assert.equal(w.length, 1);
  assert.deepEqual(w[0].tabs.map((t) => t.url), ["https://a.com"]);
});

test("takeSnapshot stores newest first and skips when nothing is open", async () => {
  setup([]);
  assert.equal(await A.takeSnapshot(1), null);
  assert.equal((await A.getSnapshots()).length, 0);

  setup([win([tab("https://a.com")])]);
  await A.takeSnapshot(1);
  chrome.windows.getAll = async () => [win([tab("https://b.com")])];
  await A.takeSnapshot(2);
  const snaps = await A.getSnapshots();
  assert.equal(snaps[0].ts, 2);
});

test("isSameSnapshot compares URLs only (per window, in order)", () => {
  const snap = (...wins) => ({ windows: wins.map((urls) => ({ tabs: urls.map((u) => tab(u)) })) });
  const base = snap(["https://a.com", "https://b.com"]);
  assert.equal(A.isSameSnapshot(undefined, base), false);
  assert.equal(A.isSameSnapshot(base, { windows: [{ tabs: [tab("https://a.com", "(3) new"), tab("https://b.com")] }] }), true);
  assert.equal(A.isSameSnapshot(base, snap(["https://a.com"])), false);
  assert.equal(A.isSameSnapshot(base, snap(["https://b.com", "https://a.com"])), false);
  assert.equal(A.isSameSnapshot(base, snap(["https://a.com"], ["https://b.com"])), false);
});

test("takeSnapshot skips an unchanged capture", async () => {
  setup([win([tab("https://a.com")])]);
  assert.ok(await A.takeSnapshot(1));
  assert.equal(await A.takeSnapshot(2), null);
  assert.equal((await A.getSnapshots()).length, 1);
});

test("snapshots are capped", async () => {
  setup([win([tab("https://a.com")])]);
  for (let i = 0; i < A.SNAPSHOT_CAP + 5; i++) {
    chrome.windows.getAll = async () => [win([tab(`https://a.com/${i}`)])];
    await A.takeSnapshot(i);
  }
  assert.equal((await A.getSnapshots()).length, A.SNAPSHOT_CAP);
});

test("auto-snapshots never touch the versioned history", async () => {
  setup([win([tab("https://a.com")])]);
  await S.ensureInit();
  await A.takeSnapshot(1);
  const st = await S.getState();
  assert.equal(st.history.length, 0);
  assert.equal(st.sessions.length, 0);
});

test("saveSnapshotAsSessions adds one session per window, in window order", async () => {
  setup([win([tab("https://a.com")]), win([tab("https://b.com"), tab("https://c.com")])]);
  const snap = await A.takeSnapshot(1);
  assert.equal(await A.saveSnapshotAsSessions(snap.id), 2);
  const st = await S.getState();
  assert.equal(st.sessions.length, 2);
  assert.equal(st.sessions[0].tabs[0].url, "https://a.com");
  assert.equal(st.sessions[1].tabs.length, 2);
});

test("openSnapshot creates one window per captured window", async () => {
  const env = setup([win([tab("https://a.com")]), win([tab("https://b.com")])]);
  const snap = await A.takeSnapshot(1);
  assert.equal(await A.openSnapshot(snap.id), 2);
  assert.deepEqual(env.created.map((o) => o.url), [["https://a.com"], ["https://b.com"]]);
});

test("setAutoSettings reschedules or clears the alarm", async () => {
  const env = setup();
  await A.setAutoSettings({ intervalMin: 30 });
  assert.equal([...env.alarms.values()][0].periodInMinutes, 30);
  await A.setAutoSettings({ enabled: false });
  assert.equal(env.alarms.size, 0);
  const s = await A.getAutoSettings();
  assert.equal(s.intervalMin, 30); // untouched field preserved
});
