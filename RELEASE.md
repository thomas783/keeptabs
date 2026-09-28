# Releasing KeepTabs

Releases go to the Chrome Web Store through the `publish` GitHub Actions workflow
(`.github/workflows/publish.yml`). It runs the tests, zips the extension (excluding
`tests/`, `store/`, `worker/`, Markdown files, and other dev-only files), uploads the
zip, and submits it for review. Store credentials live in repo secrets
(`CWS_EXTENSION_ID`, `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN`).

## Regular release (no new permissions)

1. Bump `version` in `manifest.json` on a branch, open a PR, merge it once CI passes.
2. Tag the merge commit on `main` and push the tag:
   ```sh
   git checkout main && git pull
   git tag -a v1.3.0 -m "KeepTabs 1.3.0"
   git push origin v1.3.0
   ```
3. The workflow uploads and submits for review. With the dashboard's default setting,
   the item is published automatically once review passes.

## Release that adds a permission

The Web Store requires a justification for every permission on the **Privacy practices**
tab, but the field for a new permission only appears **after** a package containing it
has been uploaded. A tag push uploads and submits in one go, so the submission is
rejected with `Publish condition not met: … mandatory privacy information`.
Use the manual workflow instead:

1. Bump `version` in `manifest.json` and merge to `main` (as above). **Don't push a tag yet.**
2. **Actions → publish → Run workflow** on `main` with `action = upload`.
   This builds and uploads the package as a draft, without submitting it.
3. In the [developer dashboard](https://chrome.google.com/webstore/devconsole), open
   KeepTabs → **Privacy practices**, fill in the new permission's justification, and
   update the data-usage disclosures if the release collects or sends anything new.
   Click **Save draft**.
4. **Run workflow** again with `action = publish` to submit the draft for review
   (or click **Submit for review** in the dashboard).
5. Optional: record the release as a GitHub Release instead of pushing a `v*` tag.
   A tag push would re-run the full workflow and fail, because that version is already uploaded.

Also update `PRIVACY.md` (the **Permissions** section) in the same PR that adds the permission.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Publish condition not met: … mandatory privacy information` | A permission has no justification, or required privacy fields are empty | Fill the Privacy practices tab, **Save draft**, then run `action = publish` |
| Upload fails because the version already exists | That version was already uploaded (e.g. a tag pushed after a manual upload) | Bump `version` for a new upload; to submit the existing draft, run `action = publish` |
| Dashboard pages can't be automated | Chrome blocks extensions (including browser-automation tools) from scripting Web Store pages | Edit the dashboard by hand |

## Feedback relay (`worker/`)

The in-extension feedback form posts to a Cloudflare Worker that creates GitHub issues.
It is deployed separately from the extension and is not part of the store package.

```sh
cd worker
npx wrangler@4 deploy                      # deploy code/config changes
npx wrangler@4 secret put GITHUB_TOKEN     # rotate the token
```

- The token is a fine-grained PAT scoped to this repo with **Issues: Read and write** only.
  It lives only in the Worker's secrets. To shut the relay off quickly, revoke the token
  or disable the Worker in the Cloudflare dashboard.
- `ALLOWED_ORIGINS` in `worker/wrangler.toml` allows only the Web Store extension ID.
  To test the form from an unpacked build, add that build's `chrome-extension://<id>`
  origin and redeploy.
