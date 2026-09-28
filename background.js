import { ensureInit, addSession } from "./storage.js";
import { scheduleAlarm, isAutoSnapAlarm, takeSnapshot, snapshotClosedWindow } from "./autosnap.js";
import { seedAll, refreshWindow } from "./wincache.js";

const newId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

chrome.runtime.onInstalled.addListener(async () => {
  await ensureInit();
  await scheduleAlarm();
  await seedAll();
});
chrome.runtime.onStartup.addListener(async () => {
  await ensureInit();
  await scheduleAlarm();
  await seedAll();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (isAutoSnapAlarm(alarm)) takeSnapshot();
});

// Keep the per-window tab cache current, so a closing window can still be snapshotted.
chrome.tabs.onCreated.addListener((tab) => refreshWindow(tab.windowId));
chrome.tabs.onUpdated.addListener((_id, change, tab) => {
  if (change.url || change.title || change.status === "complete") refreshWindow(tab.windowId);
});
chrome.tabs.onMoved.addListener((_id, info) => refreshWindow(info.windowId));
chrome.tabs.onAttached.addListener((_id, info) => refreshWindow(info.newWindowId));
chrome.tabs.onDetached.addListener((_id, info) => refreshWindow(info.oldWindowId));
chrome.tabs.onRemoved.addListener((_id, info) => {
  // While a window is closing its tabs vanish one by one — keep the cached last state.
  if (!info.isWindowClosing) refreshWindow(info.windowId);
});
chrome.windows.onRemoved.addListener((windowId) => snapshotClosedWindow(windowId));

// Focus the vault if it's already open (avoids duplicate tabs); otherwise open it.
// Only the "Saved list →" link calls this now — saving no longer forces it open.
async function openOrFocusVault() {
  const url = chrome.runtime.getURL("list.html");
  const [existing] = await chrome.tabs.query({ url });
  if (existing) {
    await chrome.tabs.update(existing.id, { active: true });
    await chrome.windows.update(existing.windowId, { focused: true });
    return existing;
  }
  return chrome.tabs.create({ url });
}

// Close tabs but keep the window alive: if we're about to close every tab in the
// window, open a blank tab first so the window doesn't vanish.
async function closeTabs(ids, windowId) {
  ids = (ids || []).filter((id) => id != null);
  if (!ids.length) return;
  if (windowId != null) {
    const inWin = await chrome.tabs.query({ windowId });
    const closing = new Set(ids);
    if (inWin.every((t) => closing.has(t.id))) {
      await chrome.tabs.create({ windowId });
    }
  }
  await chrome.tabs.remove(ids);
}

// The popup collects the selected tabs and delegates the work here (service worker),
// so closing the active tab — which dismisses the popup — never aborts mid-run.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "open-vault") {
    openOrFocusVault().then(() => sendResponse({ ok: true }));
    return true;
  }

  // "Close only" — close selected tabs WITHOUT saving.
  if (msg?.type === "close-tabs") {
    closeTabs((msg.tabs || []).map((t) => t.id), msg.windowId).then(() =>
      sendResponse({ ok: true })
    );
    return true;
  }

  if (msg?.type !== "save-session") return;

  (async () => {
    await addSession({
      id: newId(),
      name: msg.name || "",
      createdAt: Date.now(),
      tabs: msg.tabs.map(({ url, title, favIconUrl }) => ({
        url,
        title,
        favIconUrl,
      })),
    });
    // Saving no longer opens the vault — only close the tabs (if requested).
    if (msg.closeAfter) {
      await closeTabs(msg.tabs.map((t) => t.id), msg.windowId);
    }
    sendResponse({ ok: true });
  })();

  return true; // keep the message channel open for the async sendResponse
});
