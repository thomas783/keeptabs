# KeepTabs — Privacy Policy

_Last updated: 2026-08-25_

KeepTabs is a local-first browser extension for saving and restoring your tabs. **It does not collect, transmit, sell, or share any personal or user data.**

## What data KeepTabs stores
- Your saved tab sessions (tab URLs, titles, favicons), version-history snapshots, and your settings.
- All of this is stored **locally in your browser** via `chrome.storage.local`.

## What KeepTabs does NOT do
- It makes **no network requests** and sends nothing to any server. There is no backend.
- It uses **no analytics, tracking, or telemetry**.
- It has **no account and no sign-in**.
- It does **not** sell or transfer your data to third parties, and does not use your data for any purpose unrelated to saving and restoring your tabs.

## Optional folder backup
If you choose to enable the optional "Sync folder" backup, KeepTabs uses the browser's File System Access API to write a single backup file (`keeptabs-backup.json`) **only to a folder you pick on your own device**. The extension never uploads this file; if the folder happens to be a Google Drive / OneDrive / Dropbox desktop-sync folder, your own OS sync client handles syncing it. Your data stays yours.

## Permissions
- **tabs** — to read the URL, title, and favicon of tabs in the current window so they can be saved locally, and to reopen saved tabs on request.
- **storage** — to persist saved sessions, history snapshots, and settings locally.

## Contact
Questions or issues: https://github.com/thomas783/keeptabs/issues
