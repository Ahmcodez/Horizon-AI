# Security practices for this repo

## Secrets never get committed
- Real credentials (API keys, database URLs, auth secrets) live only in
  untracked `.env.local` files, never in code, never in commit messages.
- `.env.example` documents *which* variables are needed, with empty/blank
  values only.
- Before every commit, changed files are checked against the categories
  below — if something looks like a credential, it's excluded and flagged
  instead of committed.

## What's git-ignored by default
- `node_modules/`, build output (`dist/`), and lockfile noise
- All `.env*` variants except `.env.example`
- Key/cert files (`*.pem`, `*.key`, `*.p12`, `*.pfx`)
- Anything under `secrets/` or `credentials/`, and `service-account*.json`
  (common name for cloud provider service account keys)
- Editor/OS artifacts (`.vscode/`, `.idea/`, `.DS_Store`)

## If a personal access token or API key is ever pasted into chat
Treat it as compromised the moment it's shared — even if it's only used
once and never committed. The right move is:
1. Use it for the immediate task only
2. Revoke/regenerate it from the provider's dashboard right after
3. Never write it into a file that gets committed, logged, or echoed back

## History check
Repo history has been scanned for committed secrets (token-shaped strings,
`.env` files, key files) as of this doc's addition — clean. Worth re-running
that check periodically, especially before making a private repo public:

```bash
git log -p --all | grep -iE 'ghp_[a-zA-Z0-9]{20,}|sk-[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16}'
```
