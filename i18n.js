// Lightweight runtime i18n. Default English, user-selectable Korean.
// Language is stored in chrome.storage.local and applied at runtime (no reload of locale files).

const MESSAGES = {
  en: {
    tagline: "Never lose a tab",
    save_window: "Save this window",
    export: "Export",
    import: "Import",
    backup_history: "Backups",
    settings: "Backup",
    stats: "{sessions} sessions · {tabs} tabs · {history} auto-backups kept",
    empty: "No saved tabs yet. Click the KeepTabs toolbar icon to save the current window.",
    open_all: "Open all",
    delete: "Delete",
    name_it: "＋ name it",
    saved_n: "Saved {n}",
    tabs_count: "{n} tabs",
    sessions_count: "{n} sessions",
    remove_tab: "Remove this tab",
    session_name: "Session name",
    deleted_toast: "Deleted — you can restore it from Backups",
    saved_toast: "{n} tabs saved",
    opened_toast: "Opening {n} tabs",
    nothing_to_save: "No tabs to save",
    exported_toast: "Backup file exported",
    imported_toast: "Import complete",
    import_failed: "Import failed — check the JSON format",
    restored_toast: "Restored to that point",
    // history modal
    history_title: "Backups (restore a version)",
    history_hint:
      "Every save/delete is auto-snapshotted. If something was lost or deleted by mistake, roll back to an earlier point.",
    restore_this: "Restore this",
    no_history: "No backups yet.",
    reason_save: "Saved tabs",
    reason_delete: "Deleted session",
    "reason_remove-tab": "Removed tab",
    reason_rename: "Renamed",
    reason_import: "Imported",
    "reason_restore-version": "Version restored",
    reason_edit: "Change",
    // backup settings
    backup_title: "Backup (so tabs are never lost outside this extension)",
    backup_hint:
      "Local storage alone can be wiped by an update/crash/uninstall. Back up to a synced folder (Google Drive / OneDrive / Dropbox desktop).",
    backup_off: "Off",
    backup_folder: "Sync folder",
    connect: "Connect",
    change: "Change",
    disconnect: "Disconnect",
    status_connected: "Connected",
    status_disconnected: "Not connected",
    connecting: "Connecting…",
    backup_now: "Back up now",
    auto_backup: "Auto-backup on every change",
    folder_connected: "Folder: {name}",
    folder_verified: "✓ {name}/keeptabs-backup.json · {size} · updated {time}",
    folder_no_file: "Folder: {name} — no backup file written yet",
    path_privacy: "Browsers hide a folder's full path for privacy — tip: pick a dedicated folder (e.g. “KeepTabs Backups”) so it's unambiguous.",
    not_connected: "Not connected",
    star_cta: "Enjoying KeepTabs? Star it on GitHub",
    backing_up: "Backing up…",
    backup_done: "Backed up ✓",
    backup_failed: "Backup failed",
    pick_folder_hint:
      "Tip: pick your Google Drive / OneDrive / Dropbox desktop-sync folder → backups upload automatically, no login, no server.",
    permission_needed: "Folder permission needed — click Connect again",
    language: "Language",
  },
  ko: {
    tagline: "탭을 절대 잃지 않는",
    save_window: "현재 창 저장",
    export: "내보내기",
    import: "가져오기",
    backup_history: "백업 기록",
    settings: "백업",
    stats: "저장 세션 {sessions}개 · 탭 {tabs}개 · 자동 백업 {history}개 보관",
    empty: "저장된 탭이 없습니다. 툴바의 KeepTabs 아이콘을 누르면 현재 창의 탭이 저장돼요.",
    open_all: "모두 열기",
    delete: "삭제",
    name_it: "＋ 이름 짓기",
    saved_n: "저장 {n}",
    tabs_count: "{n}개 탭",
    sessions_count: "{n}개 세션",
    remove_tab: "이 탭 삭제",
    session_name: "세션 이름",
    deleted_toast: "삭제됨 — 백업 기록에서 되돌릴 수 있어요",
    saved_toast: "{n}개 탭 저장됨",
    opened_toast: "{n}개 탭 열기",
    nothing_to_save: "저장할 탭이 없어요",
    exported_toast: "백업 파일 내보냄",
    imported_toast: "가져오기 완료",
    import_failed: "가져오기 실패 — JSON 형식을 확인하세요",
    restored_toast: "해당 시점으로 복원됨",
    history_title: "백업 기록 (버전 복원)",
    history_hint:
      "모든 저장·삭제 시점이 자동 백업됩니다. 실수로 지웠거나 날아갔으면 이전 시점으로 되돌리세요.",
    restore_this: "이 시점으로 복원",
    no_history: "아직 백업 기록이 없어요.",
    reason_save: "탭 저장",
    reason_delete: "세션 삭제",
    "reason_remove-tab": "탭 삭제",
    reason_rename: "이름 변경",
    reason_import: "가져오기",
    "reason_restore-version": "버전 복원",
    reason_edit: "변경",
    backup_title: "백업 (확장 밖에도 저장해서 절대 안 잃도록)",
    backup_hint:
      "로컬 저장만으론 업데이트·크래시·삭제 시 통째로 날아갈 수 있어요. 동기화 폴더(구글드라이브/OneDrive/Dropbox 데스크톱)에 백업하세요.",
    backup_off: "끔",
    backup_folder: "동기화 폴더",
    connect: "연결",
    change: "변경",
    disconnect: "연결 해제",
    status_connected: "연결됨",
    status_disconnected: "연결 안 됨",
    connecting: "연결 중…",
    backup_now: "지금 백업",
    auto_backup: "변경 시마다 자동 백업",
    folder_connected: "폴더: {name}",
    folder_verified: "✓ {name}/keeptabs-backup.json · {size} · {time} 갱신",
    folder_no_file: "폴더: {name} — 아직 백업 파일 없음",
    path_privacy: "브라우저는 보안상 폴더의 전체 경로를 앱에 주지 않아요 — 팁: ‘KeepTabs 백업’ 같은 전용 폴더를 지정하면 헷갈리지 않아요.",
    not_connected: "연결 안 됨",
    star_cta: "KeepTabs가 마음에 드시나요? GitHub에서 별을 눌러주세요",
    backing_up: "백업 중…",
    backup_done: "백업 완료 ✓",
    backup_failed: "백업 실패",
    pick_folder_hint:
      "팁: 구글드라이브/OneDrive/Dropbox 데스크톱 동기화 폴더를 고르면 → 로그인·서버 없이 자동 업로드돼요.",
    permission_needed: "폴더 권한이 필요해요 — 다시 연결을 눌러주세요",
    language: "언어",
  },
};

let lang = "en";

export function useLang(l) {
  if (MESSAGES[l]) lang = l;
} // sync setter (tests / immediate UI)

export function getLang() {
  return lang;
}

export async function initLang() {
  try {
    const obj = await chrome.storage.local.get("keeptabs_lang");
    lang = obj.keeptabs_lang || "en"; // default English
  } catch {
    lang = "en";
  }
  return lang;
}

export async function setLang(l) {
  useLang(l);
  try {
    await chrome.storage.local.set({ keeptabs_lang: l });
  } catch {}
}

export function t(key, params) {
  let s =
    (MESSAGES[lang] && MESSAGES[lang][key]) ??
    (MESSAGES.en && MESSAGES.en[key]) ??
    key;
  if (params)
    for (const k in params) s = s.split(`{${k}}`).join(String(params[k]));
  return s;
}

export const LANGS = [
  { code: "en", label: "English" },
  { code: "ko", label: "한국어" },
];
