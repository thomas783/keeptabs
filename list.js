import {
  getState,
  addSession,
  deleteSession,
  removeTab,
  renameSession,
  restoreVersion,
  exportJSON,
  importJSON,
} from "./storage.js";
import { initLang, setLang, getLang, t, LANGS } from "./i18n.js";
import {
  getSettings,
  setSettings,
  status as backupStatus,
  connectFolder,
  disconnectFolder,
  backupNow,
} from "./backup.js";

const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const when = (ts) =>
  new Date(ts).toLocaleString(getLang() === "ko" ? "ko-KR" : "en-US");
const fmtSize = (b) =>
  b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB";

// CSP-safe favicon fallback (MV3 blocks inline onerror).
document.addEventListener(
  "error",
  (e) => {
    const el = e.target;
    if (el.tagName === "IMG" && el.classList.contains("fav")) {
      const span = document.createElement("span");
      span.className = "fallback";
      el.replaceWith(span);
    }
  },
  true
);

function toast(msg) {
  const el = $("toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (el.hidden = true), 2200);
}

/* ---------------- i18n ---------------- */
function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const label = t(el.dataset.i18nTitle);
    el.setAttribute("data-tip", label); // fast CSS tooltip (see [data-tip] in list.css)
    el.setAttribute("aria-label", label); // keep accessible name for screen readers
  });
  const sel = $("lang");
  sel.innerHTML = LANGS.map(
    (l) => `<option value="${l.code}"${l.code === getLang() ? " selected" : ""}>${l.label}</option>`
  ).join("");
  document.documentElement.lang = getLang();
}

/* ---------------- render sessions ---------------- */
async function render() {
  const state = await getState();
  const sessions = state.sessions || [];
  const totalTabs = sessions.reduce((n, s) => n + s.tabs.length, 0);

  $("empty").hidden = sessions.length > 0;
  $("stats").innerHTML = sessions.length
    ? t("stats", { sessions: `<b>${sessions.length}</b>`, tabs: `<b>${totalTabs}</b>`, history: `<b>${(state.history || []).length}</b>` })
    : "";
  $("sessions").innerHTML = sessions.map(renderSession).join("");

  document.querySelectorAll("[data-open]").forEach((b) =>
    b.addEventListener("click", () => openSession(b.dataset.open))
  );
  document.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", async () => {
      await deleteSession(b.dataset.del);
      toast(t("deleted_toast"));
      render();
      maybeAutoBackup();
    })
  );
  document.querySelectorAll("[data-rmtab]").forEach((b) =>
    b.addEventListener("click", async () => {
      await removeTab(b.dataset.sid, b.dataset.rmtab);
      render();
      maybeAutoBackup();
    })
  );
  document.querySelectorAll(".sname").forEach((el) =>
    el.addEventListener("click", () => startRename(el))
  );
}

function renderSession(s) {
  const tabs = s.tabs
    .map(
      (tb) => `<li class="tabrow">
        ${tb.favIconUrl ? `<img class="fav" src="${esc(tb.favIconUrl)}" referrerpolicy="no-referrer" />` : `<span class="fallback"></span>`}
        <a href="${esc(tb.url)}" target="_blank" title="${esc(tb.url)}">${esc(tb.title)}</a>
        <button class="rm" title="${esc(t("remove_tab"))}" data-sid="${s.id}" data-rmtab="${esc(tb.url)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
      </li>`
    )
    .join("");
  const custom = (s.name || "").trim();
  const nameHtml = custom
    ? esc(custom)
    : `<span class="placeholder">${esc(s.seq ? t("saved_n", { n: s.seq }) : t("name_it"))}</span>`;
  return `<section class="session">
    <div class="session-head">
      <div class="session-title">
        <span class="sname" data-editid="${s.id}" data-name="${esc(custom)}">${nameHtml}</span>
        <span class="session-meta">${t("tabs_count", { n: s.tabs.length })} · ${when(s.createdAt)}</span>
      </div>
      <div class="session-btns">
        <button class="mini" data-open="${s.id}">${esc(t("open_all"))}</button>
        <button class="mini danger" data-del="${s.id}">${esc(t("delete"))}</button>
      </div>
    </div>
    <ul class="tabs">${tabs}</ul>
  </section>`;
}

async function openSession(id) {
  const state = await getState();
  const s = (state.sessions || []).find((x) => x.id === id);
  if (!s) return;
  s.tabs.forEach((tb) => chrome.tabs.create({ url: tb.url, active: false }));
  toast(t("opened_toast", { n: s.tabs.length }));
}

function startRename(el) {
  const id = el.dataset.editid;
  const input = document.createElement("input");
  input.className = "name-input";
  input.value = el.dataset.name || "";
  input.maxLength = 80;
  input.placeholder = t("session_name");
  el.replaceWith(input);
  input.focus();
  input.select();
  let done = false;
  const commit = async () => {
    if (done) return;
    done = true;
    await renameSession(id, input.value.trim());
    render();
    maybeAutoBackup();
  };
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); input.blur(); }
    else if (e.key === "Escape") { done = true; render(); }
  });
  input.addEventListener("blur", commit);
}

/* ---------------- top bar ---------------- */
$("lang").addEventListener("change", async (e) => {
  await setLang(e.target.value);
  applyI18n();
  render();
});

$("save-now").addEventListener("click", async () => {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const savable = tabs.filter(
    (tb) => tb.url && !tb.url.startsWith("chrome") && !tb.url.startsWith("edge") && !tb.url.startsWith("about:")
  );
  if (!savable.length) return toast(t("nothing_to_save"));
  await addSession({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    name: "",
    createdAt: Date.now(),
    tabs: savable.map((tb) => ({ url: tb.url, title: tb.title || tb.url, favIconUrl: tb.favIconUrl || "" })),
  });
  toast(t("saved_toast", { n: savable.length }));
  render();
  maybeAutoBackup();
});

$("export").addEventListener("click", async () => {
  const json = await exportJSON();
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `keeptabs-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast(t("exported_toast"));
});

$("import-file").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    await importJSON(await file.text(), "merge");
    toast(t("imported_toast"));
    render();
    maybeAutoBackup();
  } catch {
    toast(t("import_failed"));
  }
  e.target.value = "";
});

/* ---------------- history modal ---------------- */
const REASON = (r) => t("reason_" + r);
$("history").addEventListener("click", async () => {
  const state = await getState();
  const rows = (state.history || [])
    .map(
      (h) => `<div class="hrow">
        <div><div class="when">${when(h.ts)}</div><div class="what">${esc(REASON(h.reason))} · ${t("tabs_count", { n: h.sessions.length }).replace(/\d+/, h.sessions.length)}</div></div>
        <button class="mini" data-restore="${h.id}">${esc(t("restore_this"))}</button>
      </div>`
    )
    .join("");
  $("history-list").innerHTML = rows || `<p class="hint">${esc(t("no_history"))}</p>`;
  document.querySelectorAll("[data-restore]").forEach((b) =>
    b.addEventListener("click", async () => {
      await restoreVersion(Number(b.dataset.restore));
      $("history-modal").hidden = true;
      toast(t("restored_toast"));
      render();
      maybeAutoBackup();
    })
  );
  $("history-modal").hidden = false;
});
$("history-close").addEventListener("click", () => ($("history-modal").hidden = true));
$("history-modal").addEventListener("click", (e) => {
  if (e.target.id === "history-modal") $("history-modal").hidden = true;
});

/* ---------------- backup settings modal ---------------- */
async function refreshBackupUI() {
  const s = await getSettings();
  document.querySelectorAll('input[name="bmode"]').forEach((r) => (r.checked = r.value === s.mode));
  $("folder-panel").hidden = s.mode !== "folder";
  $("auto-backup").checked = s.autoOn;
  if (s.mode !== "folder") return; // panel hidden — nothing else to sync

  const st = await backupStatus();
  const connected = !!st.ok;

  // status badge (dot + label)
  $("conn-badge").classList.toggle("on", connected);
  $("conn-label").textContent = t(connected ? "status_connected" : "status_disconnected");

  // single toggle button: Connect when disconnected, Disconnect when connected
  const toggle = $("folder-toggle");
  toggle.classList.toggle("danger", connected);
  toggle.dataset.action = connected ? "disconnect" : "connect";
  toggle.querySelector(".tgl-label").textContent = t(connected ? "disconnect" : "connect");

  // detail line (file info when connected, hint otherwise)
  let detail = "";
  if (connected)
    detail = st.file
      ? t("folder_verified", { name: s.folderName, size: fmtSize(st.file.size), time: when(st.file.modified) })
      : t("folder_no_file", { name: s.folderName });
  else if (s.folderName) detail = t("permission_needed");
  $("folder-status").textContent = detail;
}

$("settings").addEventListener("click", async () => {
  await refreshBackupUI();
  $("backup-modal").hidden = false;
});
$("backup-close").addEventListener("click", () => ($("backup-modal").hidden = true));
$("backup-modal").addEventListener("click", (e) => {
  if (e.target.id === "backup-modal") $("backup-modal").hidden = true;
});

document.querySelectorAll('input[name="bmode"]').forEach((r) =>
  r.addEventListener("change", async () => {
    await setSettings({ mode: r.value });
    refreshBackupUI();
  })
);
$("auto-backup").addEventListener("change", (e) => setSettings({ autoOn: e.target.checked }));

$("folder-toggle").addEventListener("click", async () => {
  const toggle = $("folder-toggle");
  if (toggle.classList.contains("loading")) return;
  const disconnecting = toggle.dataset.action === "disconnect";
  toggle.classList.add("loading"); // sync DOM change — keeps the picker within the user gesture

  try {
    if (disconnecting) {
      await disconnectFolder();
    } else {
      const name = await connectFolder(); // opens the OS folder picker
      await backupNow(await exportJSON()); // spinner on the toggle conveys progress
      toast(t("folder_connected", { name }));
    }
  } catch {
    // user cancelled the picker or permission denied — state reflected on refresh
  } finally {
    toggle.classList.remove("loading");
    refreshBackupUI();
  }
});
$("backup-now").addEventListener("click", async () => {
  const btn = $("backup-now");
  if (btn.classList.contains("loading")) return;
  btn.classList.add("loading"); // spinner conveys progress — no "backing up…" text needed
  $("backup-msg").textContent = "";
  try {
    const ok = await backupNow(await exportJSON());
    $("backup-msg").textContent = ok ? t("backup_done") : t("not_connected");
    if (ok) toast(t("backup_done"));
  } catch {
    $("backup-msg").textContent = t("backup_failed");
  } finally {
    btn.classList.remove("loading");
    await refreshBackupUI();
  }
});

/* ---------------- auto-backup ---------------- */
let backupTimer;
async function maybeAutoBackup() {
  const s = await getSettings();
  if (!s.autoOn || s.mode === "off") return;
  clearTimeout(backupTimer);
  backupTimer = setTimeout(async () => {
    try {
      await backupNow(await exportJSON());
    } catch {
      /* surfaced in settings panel */
    }
  }, 1200);
}

// react to writes from the service worker (toolbar icon save) while this page is open
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.keeptabs) {
    render();
    maybeAutoBackup();
  }
});

/* ---------------- init ---------------- */
(async () => {
  await initLang();
  applyI18n();
  await render();
  maybeAutoBackup();
})();
