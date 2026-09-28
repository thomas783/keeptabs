import { test } from "node:test";
import assert from "node:assert";
import { mockChrome } from "./setup.mjs";
import * as C from "../wincache.js";
import * as A from "../autosnap.js";

// storage.local (+ session) mocks and a mutable set of open windows keyed by id.
function setup(openWins = {}) {
  const env = mockChrome();
  const session = {};
  chrome.storage.session = {
    get: async (key) => ({ [key]: session[key] }),
    set: async (obj) => Object.assign(session, obj),
    remove: async (key) => delete session[key],
  };
  chrome.windows = {
    get: async (id) => {
      if (!openWins[id]) throw new Error("No window with id " + id);
      return openWins[id];
    },
    getAll: async () => Object.values(openWins),
  };
  return { ...env, session, openWins };
}

const tab = (url) => ({ url, title: url, favIconUrl: "" });
const win = (id, urls, extra = {}) => ({ id, type: "normal", incognito: false, tabs: urls.map(tab), ...extra });

test("refreshWindow caches savable tabs per window", async () => {
  const env = setup({ 1: win(1, ["https://a.com", "chrome://newtab"]), 2: win(2, ["https://b.com"]) });
  await C.seedAll();
  assert.deepEqual(env.session["wc:1"].map((t) => t.url), ["https://a.com"]);
  assert.deepEqual(env.session["wc:2"].map((t) => t.url), ["https://b.com"]);
});

test("incognito and non-normal windows are never cached", async () => {
  const env = setup({
    1: win(1, ["https://secret.com"], { incognito: true }),
    2: win(2, ["https://popup.com"], { type: "popup" }),
  });
  await C.refreshWindow(1);
  await C.refreshWindow(2);
  assert.equal(Object.keys(env.session).length, 0);
});

test("a refresh after the window is gone keeps the last cached state", async () => {
  const env = setup({ 1: win(1, ["https://a.com"]) });
  await C.refreshWindow(1);
  delete env.openWins[1];
  await C.refreshWindow(1);
  assert.equal(env.session["wc:1"].length, 1);
});

test("refreshes are serialized — the newest capture wins", async () => {
  const env = setup({ 1: win(1, ["https://old.com"]) });
  const slow = chrome.windows.get;
  let first = true;
  chrome.windows.get = async (id) => {
    const snapshot = structuredClone(env.openWins[id]); // what the window looks like *now*
    if (first) {
      first = false;
      await new Promise((r) => setTimeout(r, 20)); // older capture resolves late
    }
    return snapshot;
  };
  const p1 = C.refreshWindow(1);
  env.openWins[1] = win(1, ["https://new.com"]);
  const p2 = C.refreshWindow(1);
  await Promise.all([p1, p2]);
  chrome.windows.get = slow;
  assert.equal(env.session["wc:1"][0].url, "https://new.com");
});

test("takeClosedWindow pops the cache entry", async () => {
  const env = setup({ 1: win(1, ["https://a.com"]) });
  await C.refreshWindow(1);
  const tabs = await C.takeClosedWindow(1);
  assert.equal(tabs[0].url, "https://a.com");
  assert.equal(env.session["wc:1"], undefined);
  assert.deepEqual(await C.takeClosedWindow(1), []);
});

test("snapshotClosedWindow stores a window-close snapshot from the cache", async () => {
  const env = setup({ 1: win(1, ["https://a.com", "https://b.com"]) });
  await C.refreshWindow(1);
  delete env.openWins[1]; // window closes
  const snap = await A.snapshotClosedWindow(1, 100);
  assert.equal(snap.reason, "window-close");
  assert.deepEqual(snap.windows[0].tabs.map((t) => t.url), ["https://a.com", "https://b.com"]);
  assert.equal((await A.getSnapshots())[0].reason, "window-close");
});

test("snapshotClosedWindow does nothing when auto-snapshots are off, but still clears the cache", async () => {
  const env = setup({ 1: win(1, ["https://a.com"]) });
  chrome.alarms = { create: () => {}, clear: async () => true };
  await A.setAutoSettings({ enabled: false });
  await C.refreshWindow(1);
  assert.equal(await A.snapshotClosedWindow(1, 100), null);
  assert.equal((await A.getSnapshots()).length, 0);
  assert.equal(env.session["wc:1"], undefined);
});

test("closing a window with nothing savable stores nothing", async () => {
  setup({ 1: win(1, ["chrome://newtab"]) });
  await C.refreshWindow(1);
  assert.equal(await A.snapshotClosedWindow(1, 100), null);
});
