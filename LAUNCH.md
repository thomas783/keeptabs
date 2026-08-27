# Launch drafts

Ready-to-post copy for launching KeepTabs. Honest, value-first, no competitor bashing.

- **Store:** https://chromewebstore.google.com/detail/obggnihijfooppjkddcpgpkmpcnamoap
- **Code:** https://github.com/thomas783/keeptabs

---

## Product Hunt

**Name:** KeepTabs

**Tagline (≤60 chars):**
> Save your tabs in one click — and never lose them

**Description (≤260 chars):**
> A local-first tab manager that auto-snapshots a version on every save and delete — so an update, crash, or accidental delete can always be rolled back. One-click save, one-click restore, optional Drive/Dropbox folder backup. No account, no subscription.

**Topics:** Chrome Extensions · Productivity · Bookmarking

**Maker's first comment:**
> Hi PH 👋 I'm the maker.
>
> I built KeepTabs after losing a whole window of saved tabs to a bad update — which shouldn't be possible for a tool whose job is to keep them. So the core idea is **durability**: every save and delete writes a full snapshot to a local history buffer (last 50), so you can roll back any change with one click.
>
> Everything is **local-first** — nothing is sent to a server, no account, no subscription, no telemetry. If you want an off-device copy, point it at a Google Drive / OneDrive / Dropbox folder and it writes a backup file there via the File System Access API — no login, no backend.
>
> It's free and open about what it does. Would love feedback, especially on the restore/backup flow.

---

## Hacker News — Show HN

**Title:**
> Show HN: KeepTabs – local-first tab manager that version-backs-up every change

**Body:**
> I kept losing saved tabs — an extension update or a bad edit would wipe a session — so I built KeepTabs around one idea: never lose a tab.
>
> How it works:
> - One click saves the whole window into a named session and clears the clutter.
> - Every mutation (save/delete/rename/remove) appends a full snapshot of all sessions to a local ring buffer (last 50). Nothing overwrites destructively, so you can restore any earlier state in one click.
> - Storage is `chrome.storage.local` — local-first, no server, no account, no telemetry.
> - Optional off-device backup: pick a folder (e.g. a Drive/OneDrive/Dropbox desktop-sync folder) and it writes `keeptabs-backup.json` there via the File System Access API. Your OS sync client handles the rest — no backend on my side.
>
> It's an MVP but I use it daily. No build step, plain ES modules; unit tests cover the storage/backup/i18n logic. Code is on GitHub.
>
> Store: <link> · Code: <github>
>
> Feedback welcome — particularly on the version-history UX and whether the folder-backup approach makes sense to you.

---

## Reddit (r/chrome_extensions, r/productivity, r/webdev)

> **Title:** I built a local-first tab manager that keeps a version history, so you can never lose a saved session (free, open, no account)
>
> **Body:**
> Maker here. I got tired of losing saved tabs when an extension updated or I mis-clicked, so I made **KeepTabs**.
>
> What it does:
> - One click saves your whole window into a tidy, named session; reopen individually or all at once.
> - **Every save/delete is auto-snapshotted (last 50) → one-click restore** of any earlier state. This is the main point: mistakes are undoable.
> - **Local-first:** data stays in your browser (`chrome.storage.local`). No account, no subscription, no telemetry, nothing sent to a server.
> - Optional: back up to a Drive/OneDrive/Dropbox desktop folder (writes a JSON file there) so sessions survive outside the extension — no login, no server.
> - Export/import JSON, rename sessions, EN/KO UI.
>
> Free. Store: <link> · Code (open): <github>
>
> Happy to take questions or feature requests — especially what you'd want from the backup/restore side.
>
> _(Check each subreddit's self-promo rules first; some want a specific flair or limit promo to certain days/threads.)_

---

## X / Twitter thread

> **1/** I kept losing saved browser tabs — a bad extension update or a mis-click would wipe a whole session. So I built KeepTabs: a local-first tab manager that keeps a version history, so you never lose one. 🧵
>
> **2/** One click saves your whole window into a named session. Every save & delete auto-snapshots (last 50) → roll back any change with one click. Mistakes are undoable.
>
> **3/** Local-first: your data stays in your browser. No account, no subscription, no telemetry, nothing sent to a server. Want an off-device copy? Point it at a Drive/OneDrive/Dropbox folder — it writes a backup file there. No login, no backend.
>
> **4/** It's free and the code is open.
> Add to Chrome: <link>
> Code: <github>
> Feedback very welcome 🙏

---

## Launch tips
- **Ratings matter most** for Web Store ranking — ask a handful of early users to leave an honest review right after installing.
- **Product Hunt:** launch 12:01am PT; have the maker's comment ready; reply to every comment that day. Add the gallery images (hero + screenshots) and the small promo tile.
- **Show HN:** post in the morning US time; keep it plain and technical; don't over-format; be responsive in comments.
- **Reddit:** value first, promo second; read each sub's rules; a short demo GIF outperforms static images.
- **Don't** name or knock other extensions — let the durability angle stand on its own.
- Consider a short **demo GIF** (save a window → close → restore from Backups) for Reddit/X — I can help script/record one.
