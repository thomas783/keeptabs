import { test } from "node:test";
import assert from "node:assert";
import { mockChrome } from "./setup.mjs";
import * as S from "../storage.js";

const sess = (id, tabs = [{ url: "https://e.com", title: "t" }]) => ({
  id,
  name: "",
  createdAt: Date.now(),
  tabs,
});

test("addSession: seq increments, prepends, keeps name empty", async () => {
  mockChrome();
  await S.ensureInit();
  await S.addSession(sess("a"));
  await S.addSession(sess("b"));
  const st = await S.getState();
  assert.equal(st.sessions.length, 2);
  assert.equal(st.sessions[0].id, "b");
  assert.equal(st.sessions[0].seq, 2);
  assert.equal(st.sessions[1].seq, 1);
  assert.equal(st.seq, 2);
  assert.equal(st.sessions[0].name, "");
});

test("seq is not reused after delete", async () => {
  mockChrome();
  await S.addSession(sess("a"));
  await S.addSession(sess("b"));
  await S.deleteSession("b");
  await S.addSession(sess("c"));
  const st = await S.getState();
  assert.equal(st.sessions[0].seq, 3); // not reusing 2
});

test("every mutation appends a versioned snapshot", async () => {
  mockChrome();
  await S.addSession(sess("a")); // snap 1
  await S.addSession(sess("b")); // snap 2
  await S.renameSession("a", "hi"); // snap 3
  const st = await S.getState();
  assert.equal(st.history.length, 3);
  assert.equal(st.history[0].reason, "rename");
});

test("history is capped at 50", async () => {
  mockChrome();
  for (let i = 0; i < 55; i++) await S.addSession(sess("s" + i));
  const st = await S.getState();
  assert.equal(st.history.length, 50);
});

test("restoreVersion rolls sessions back to a snapshot", async () => {
  mockChrome();
  await S.addSession(sess("a"));
  const afterOne = (await S.getState()).history[0].id;
  await S.addSession(sess("b"));
  assert.equal((await S.getState()).sessions.length, 2);
  await S.restoreVersion(afterOne);
  const st = await S.getState();
  assert.equal(st.sessions.length, 1);
  assert.equal(st.sessions[0].id, "a");
});

test("renameSession preserves seq and sets custom name", async () => {
  mockChrome();
  await S.addSession(sess("a"));
  await S.renameSession("a", "  research  ".trim());
  const st = await S.getState();
  assert.equal(st.sessions[0].name, "research");
  assert.equal(st.sessions[0].seq, 1);
});

test("removeTab drops one tab from a session", async () => {
  mockChrome();
  await S.addSession(
    sess("a", [
      { url: "https://one.com", title: "1" },
      { url: "https://two.com", title: "2" },
    ])
  );
  await S.removeTab("a", "https://one.com");
  const st = await S.getState();
  assert.equal(st.sessions[0].tabs.length, 1);
  assert.equal(st.sessions[0].tabs[0].url, "https://two.com");
});

test("export → import round-trips sessions", async () => {
  mockChrome();
  await S.addSession(sess("a"));
  const json = await S.exportJSON();
  mockChrome(); // fresh store
  await S.ensureInit();
  await S.importJSON(json, "replace");
  const st = await S.getState();
  assert.equal(st.sessions.length, 1);
  assert.equal(st.sessions[0].id, "a");
});
