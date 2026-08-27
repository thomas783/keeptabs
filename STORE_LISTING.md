# Chrome Web Store — Listing Copy

Paste these into the Developer Dashboard when publishing KeepTabs. English (primary).

---

## Product name (max 45 chars)
KeepTabs — never lose a tab

## Summary / short description (max 132 chars)
Save all your tabs in one click with automatic version backups. Restore anytime. Local-first, no account, no subscription.

## Category
Productivity  (sub: Workflow & Planning)

## Language
English (add Korean as an additional locale if desired — the extension UI ships EN + KO)

---

## Detailed description

**KeepTabs saves your open tabs in one click — and never loses them.**

KeepTabs is a lightweight tab manager and session saver: it collapses a window full of tabs into a tidy, named list you can reopen anytime. The difference is durability — **every save and delete is automatically version-snapshotted**, so an extension update, a browser crash, or an accidental delete can always be rolled back.

**Why KeepTabs**
- One click saves the whole window and clears the clutter
- Automatic version history — restore any earlier state from the "Backups" panel (last 50 snapshots)
- Rename sessions, reopen tabs individually or all at once, remove single tabs
- Export / import your sessions as JSON anytime
- Optional backup to a synced folder (Google Drive / OneDrive / Dropbox desktop app) so your tabs survive even outside the extension — no login, no server
- **Local-first & private:** your data stays in your browser. Nothing is sent to any server. No account, no subscription, no telemetry.

**Never-lose by design**
Every change appends a full snapshot to a local history buffer, so destructive edits can't silently wipe your saved tabs. The optional folder backup uses the browser's File System Access API and writes only to the folder you pick.

Built for anyone who has ever lost a window full of tabs.

---

## Single purpose (Privacy tab)
KeepTabs saves the tabs of the current browser window into local storage so the user can view, organize, and restore them later, with automatic local version history and an optional backup to a user-chosen folder.

## Permission justifications (Privacy tab)

**tabs**
Used to read the URL, title, and favicon of tabs in the current window so they can be saved to the user's session list, and to open saved tabs again when the user asks. Tab data is stored locally and never transmitted off the device.

**storage**
Used to persist saved sessions, version-history snapshots, and settings locally via chrome.storage.local.

*(No host permissions, no remote code, no content scripts.)*

## Data usage / privacy disclosures
- Does this item collect or use personal/sensitive user data? **The extension does not collect or transmit any user data.**
- All tab data and settings are stored locally in the browser (chrome.storage.local).
- The optional "sync folder" backup writes a JSON file only to a folder the user explicitly selects on their own device; it is never uploaded by the extension.
- Data is **not** sold or transferred to third parties.
- No analytics, no tracking, no external network requests.

## Privacy policy
A privacy policy URL is required if any data is handled. Suggested one-liner to host (e.g., a GitHub Pages page or the repo README):

> "KeepTabs stores all data locally in your browser and never transmits it. It makes no network requests and collects no analytics. Optional folder backups are written only to a folder you choose on your own device."

---

## Assets checklist for the dashboard
- [x] Store icon 128×128 — `icons/icon-128.png`
- [x] Screenshots 1280×800 — `store/keeptabs-store-*.png` (EN + KO sets)
- [x] Small promo tile 440×280 — `store/promo-small-440x280.jpeg`
- [x] Marquee promo tile 1400×560 — `store/promo-marquee-1400x560.jpeg`
- [x] Privacy policy URL — https://github.com/thomas783/keeptabs/blob/main/PRIVACY.md
