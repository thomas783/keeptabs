// Backup target — make tabs durable OUTSIDE chrome.storage.local via a synced folder.
//
// File System Access API: the user picks any folder ONCE; we auto-write the backup there.
// If they pick a Google Drive / OneDrive / Dropbox desktop-sync folder, the OS sync client
// uploads it. Cross-platform (Win/Mac), provider-agnostic, no login, no server, data stays theirs.
//
// backup.js is browser-only (FSA). Pure helpers (settings) are unit-tested.

import { idbGet, idbSet, idbDel } from "./idb.js";

const SETTINGS_KEY = "keeptabs_backup";
const HANDLE_KEY = "backupDirHandle";
const FILE_NAME = "keeptabs-backup.json";

export const defaultSettings = () => ({
  mode: "off", // off | folder
  autoOn: true,
  folderName: "",
});

export async function getSettings() {
  try {
    const o = await chrome.storage.local.get(SETTINGS_KEY);
    return { ...defaultSettings(), ...(o[SETTINGS_KEY] || {}) };
  } catch {
    return defaultSettings();
  }
}

export async function setSettings(patch) {
  const next = { ...(await getSettings()), ...patch };
  await chrome.storage.local.set({ [SETTINGS_KEY]: next });
  return next;
}

/* ---------------- folder (File System Access) ---------------- */

async function verifyPermission(handle, write = true) {
  const opts = { mode: write ? "readwrite" : "read" };
  if ((await handle.queryPermission(opts)) === "granted") return true;
  if ((await handle.requestPermission(opts)) === "granted") return true;
  return false;
}

export async function connectFolder() {
  // must be called from a user gesture (button click) in a page context
  const handle = await window.showDirectoryPicker({ mode: "readwrite" });
  if (!(await verifyPermission(handle))) throw new Error("permission-denied");
  await idbSet(HANDLE_KEY, handle);
  await setSettings({ mode: "folder", folderName: handle.name });
  return handle.name;
}

export async function getFolderHandle() {
  const handle = await idbGet(HANDLE_KEY);
  if (!handle) return null;
  if (!(await verifyPermission(handle))) return null;
  return handle;
}

export async function writeToFolder(text) {
  const handle = await getFolderHandle();
  if (!handle) throw new Error("no-folder-permission");
  const fh = await handle.getFileHandle(FILE_NAME, { create: true });
  const w = await fh.createWritable();
  await w.write(text);
  await w.close();
  await setSettings({ lastBackup: Date.now() });
  return true;
}

// Forget the connected folder but stay in "folder" mode, so the settings panel
// keeps showing the sync-folder section in a "not connected" state (ready to reconnect).
// To turn sync off entirely, the user selects the "Off" mode instead.
export async function disconnectFolder() {
  await idbDel(HANDLE_KEY);
  await setSettings({ folderName: "", lastBackup: 0 });
}

/* ---------------- orchestration ---------------- */

// Dispatch a backup by the configured mode. `text` = the JSON backup string.
export async function backupNow(text) {
  const { mode } = await getSettings();
  if (mode === "folder") return writeToFolder(text);
  return false; // off
}

export async function status() {
  const s = await getSettings();
  if (s.mode === "folder") {
    const handle = await getFolderHandle().catch(() => null);
    let file = null;
    if (handle) {
      try {
        const fh = await handle.getFileHandle(FILE_NAME);
        const f = await fh.getFile();
        file = { size: f.size, modified: f.lastModified };
      } catch {}
    }
    return {
      mode: "folder",
      ok: !!handle,
      folderName: s.folderName,
      file,
      lastBackup: s.lastBackup,
      autoOn: s.autoOn,
    };
  }
  return { mode: "off", ok: false, autoOn: s.autoOn };
}
