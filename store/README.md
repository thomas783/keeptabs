# Chrome Web Store assets

1280×800 listing screenshots (English + Korean) plus the sources used to render them.

## Screenshots (upload these)
| Order | English | Korean | Shows |
|-------|---------|--------|-------|
| 1 | `keeptabs-store-1280x800.png` | `keeptabs-store-ko-1280x800.png` | Hero: tab clutter → one click → tidy |
| 2 | `keeptabs-store-ui-1280x800.png` | `keeptabs-store-ui-ko-1280x800.png` | Saved-session list (real UI) |
| 3 | `keeptabs-store-backups-1280x800.png` | `keeptabs-store-backups-ko-1280x800.png` | Version history / one-click restore |
| 4 | `keeptabs-store-backup-1280x800.png` | `keeptabs-store-backup-ko-1280x800.png` | Sync-folder backup (connected) |

Listing copy lives in `../STORE_LISTING.md`.

## Sources / how to regenerate
Serve the repo root and render at a 1280×800 viewport (e.g. Playwright, `scale: css`).

- **Hero 1**: `screenshot-hero.html` / `screenshot-hero-ko.html` — self-contained; uses `real-tabs.png` (a real crammed Chrome tab strip) and live favicon images.
- **2–4**: captured from `../harness.html` (the local dev harness) — switch language via the header selector, and open the Backups / Backup-settings modal. The sync-folder "Connected" state is set for the shot the way a connected user sees it.

`real-tabs.png` was captured from an actual Chrome window with ~36 tabs (`screencapture`).
