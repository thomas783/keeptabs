import { test } from "node:test";
import assert from "node:assert";
import { mockChrome } from "./setup.mjs";
import { defaultSettings, getSettings, setSettings } from "../backup.js";

test("defaultSettings shape", () => {
  const d = defaultSettings();
  assert.equal(d.mode, "off");
  assert.equal(d.autoOn, true);
  assert.equal(d.folderName, "");
});

test("getSettings returns defaults when empty", async () => {
  mockChrome();
  const s = await getSettings();
  assert.equal(s.mode, "off");
  assert.equal(s.autoOn, true);
});

test("setSettings merges and persists", async () => {
  const { store } = mockChrome();
  await setSettings({ mode: "folder", folderName: "MyDrive" });
  const s = await getSettings();
  assert.equal(s.mode, "folder");
  assert.equal(s.folderName, "MyDrive");
  assert.equal(s.autoOn, true); // untouched default preserved
  assert.ok(store.keeptabs_backup);
});

test("switching mode keeps other fields", async () => {
  mockChrome();
  await setSettings({ mode: "folder", folderName: "MyBackups" });
  await setSettings({ autoOn: false });
  const s = await getSettings();
  assert.equal(s.mode, "folder");
  assert.equal(s.folderName, "MyBackups");
  assert.equal(s.autoOn, false);
});
