import { addSession, ensureInit } from "./storage.js";

chrome.runtime.onInstalled.addListener(ensureInit);
chrome.runtime.onStartup.addListener(ensureInit);

const newId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const isSavable = (url) =>
  url &&
  !url.startsWith("chrome") &&
  !url.startsWith("edge") &&
  !url.startsWith("about:") &&
  !url.startsWith("brave://");

// Click the toolbar icon → save all tabs in the current window, then open the vault.
chrome.action.onClicked.addListener(async () => {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const saved = tabs
    .filter((t) => isSavable(t.url))
    .map((t) => ({
      url: t.url,
      title: t.title || t.url,
      favIconUrl: t.favIconUrl || "",
    }));

  const listUrl = chrome.runtime.getURL("list.html");

  if (saved.length === 0) {
    chrome.tabs.create({ url: listUrl });
    return;
  }

  await addSession({
    id: newId(),
    name: "",
    createdAt: Date.now(),
    tabs: saved,
  });

  // Open the vault, then close the tabs we just saved (OneTab-style).
  const listTab = await chrome.tabs.create({ url: listUrl });
  const toClose = tabs
    .filter((t) => t.id !== listTab.id && isSavable(t.url))
    .map((t) => t.id);
  if (toClose.length) chrome.tabs.remove(toClose);
});
