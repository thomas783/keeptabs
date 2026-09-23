import { isSavable } from "./storage.js";
import { initLang, setLang, getLang, t as msg, LANGS } from "./i18n.js";
import { tabMatches } from "./search.js";

const $ = (sel) => document.querySelector(sel);
const listEl = $("#tabs");
const countEl = $("#count");
const emptyEl = $("#empty");
const nameEl = $("#name");
const saveCloseBtn = $("#save-close");
const saveOnlyBtn = $("#save-only");
const closeOnlyBtn = $("#close-only");
const selectAllEl = $("#select-all");
const searchEl = $("#tab-search");

let tabs = []; // savable tabs in the current window

function localizeStatic() {
  nameEl.placeholder = msg("popup_name_placeholder");
  $("#selall-label").textContent = msg("popup_select_all");
  $("#open-vault").textContent = msg("popup_saved_list");
  saveCloseBtn.textContent = msg("popup_save_close");
  saveOnlyBtn.textContent = msg("popup_save_only");
  closeOnlyBtn.textContent = msg("popup_close_only");
  emptyEl.textContent = msg("popup_empty");
  searchEl.placeholder = msg("popup_search_ph");
}

// Language picker — shared with the vault via chrome.storage (keeptabs_lang).
function buildLangSelect() {
  const sel = $("#lang");
  sel.innerHTML = LANGS.map(
    (l) =>
      `<option value="${l.code}"${l.code === getLang() ? " selected" : ""}>${l.label}</option>`
  ).join("");
  sel.addEventListener("change", async () => {
    await setLang(sel.value);
    localizeStatic();
    updateState();
  });
}

function render() {
  listEl.innerHTML = "";
  for (const tab of tabs) {
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = true;
    cb.dataset.tabId = String(tab.id);
    cb.addEventListener("change", updateState);

    const fav = document.createElement("img");
    fav.className = "fav";
    fav.src = tab.favIconUrl || "icons/icon-16.png";
    fav.addEventListener("error", () => (fav.src = "icons/icon-16.png"));

    const title = document.createElement("span");
    title.className = "title";
    title.textContent = tab.title || tab.url;
    title.title = tab.url;

    const label = document.createElement("label");
    label.className = "tab-row";
    label.append(cb, fav, title);

    const li = document.createElement("li");
    li.append(label);
    listEl.append(li);
  }
  updateState();
}

function checkedTabs() {
  const ids = new Set(
    [...listEl.querySelectorAll("input[type=checkbox]:checked")].map((c) =>
      Number(c.dataset.tabId)
    )
  );
  return tabs.filter((tab) => ids.has(tab.id));
}

function updateState() {
  const n = checkedTabs().length;
  countEl.textContent = msg("popup_count", { n, total: tabs.length });
  saveCloseBtn.disabled = n === 0;
  saveOnlyBtn.disabled = n === 0;
  closeOnlyBtn.disabled = n === 0;
  // "Select all" reflects the currently visible (filtered) rows.
  const visible = [
    ...listEl.querySelectorAll("li:not([hidden]) input[type=checkbox]"),
  ];
  selectAllEl.checked = visible.length > 0 && visible.every((c) => c.checked);
}

selectAllEl.addEventListener("change", () => {
  const on = selectAllEl.checked;
  listEl
    .querySelectorAll("li:not([hidden]) input[type=checkbox]")
    .forEach((c) => (c.checked = on));
  updateState();
});

// Filter the visible tab rows by title/url. Checkbox selections persist across
// filtering — so you can search, tick, search again, and all stay selected.
searchEl.addEventListener("input", () => {
  for (const li of listEl.children) {
    const cb = li.querySelector("input[type=checkbox]");
    const tab = tabs.find((t) => t.id === Number(cb.dataset.tabId));
    li.hidden = !tabMatches(tab, searchEl.value);
  }
  updateState();
});

// Hand the work to the service worker — opening the vault tab closes this popup,
// so anything after that (tab removal) must NOT depend on the popup staying alive.
async function save({ closeAfter }) {
  const picked = checkedTabs();
  if (picked.length === 0) return;

  await chrome.runtime.sendMessage({
    type: "save-session",
    closeAfter,
    name: nameEl.value.trim(),
    windowId: picked[0].windowId,
    tabs: picked.map((tab) => ({
      id: tab.id,
      url: tab.url,
      title: tab.title || tab.url,
      favIconUrl: tab.favIconUrl || "",
    })),
  });
  window.close();
}

saveCloseBtn.addEventListener("click", () => save({ closeAfter: true }));
saveOnlyBtn.addEventListener("click", () => save({ closeAfter: false }));

// Close the selected tabs WITHOUT saving. Delegated to the service worker so
// closing the active tab (which dismisses the popup) doesn't abort the work.
closeOnlyBtn.addEventListener("click", async () => {
  const picked = checkedTabs();
  if (picked.length === 0) return;
  await chrome.runtime.sendMessage({
    type: "close-tabs",
    windowId: picked[0].windowId,
    tabs: picked.map((tab) => ({ id: tab.id })),
  });
  window.close();
});

$("#open-vault").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.sendMessage({ type: "open-vault" });
  window.close();
});

(async function init() {
  await initLang(); // stored choice, else browser UI language (ko → 한국어)
  localizeStatic();
  buildLangSelect();

  const all = await chrome.tabs.query({ currentWindow: true });
  tabs = all.filter((tab) => isSavable(tab.url));
  if (tabs.length === 0) {
    emptyEl.hidden = false;
    saveCloseBtn.disabled = true;
    saveOnlyBtn.disabled = true;
    countEl.textContent = msg("popup_count", { n: 0, total: 0 });
    return;
  }
  render();
})();
