---
title: Deploy runbook (demo)
category: engineering
order: 1
---

Fictional runbook for **SSR / Worker** deploy smoke tests.

## Preconditions

- Branch is green locally: `npm run build`
- Secrets present in the host (not in git)

## Commands

```bash
npm ci
npm run build
npm run deploy
```

## After deploy

- [ ] Open `/` and confirm the handbook loads
- [ ] Hit `/p/testing/short-note`
- [ ] Confirm `/api/auth/*` still behaves (login / session)

### Rollback

If something breaks, redeploy the last known-good Worker version from the Cloudflare dashboard.
