# AAB RideShare Mobile

Existing university project for Mobile Programming, Weeks 2-6. The Next.js application lives in `aplikacioni/`; it reads three trips from the existing Neon PostgreSQL database. GitHub login identifies the driver, and the server permits departure-time changes only for the authenticated owner with a current driver role. Seat requests remain demonstrations; no real reservation is confirmed.

Week 6 adds a public PWA reader: three previously loaded trips remain readable after an offline refresh, with a saved timestamp, an explicit cache warning and disabled booking. Reconnection requires an explicit refresh before data is described as fresh.

## Reports and submission

- [Week 5: authentication and ownership](./java-05.md)
- [Week 6: PWA and offline evidence](./java-06.md)
- [Implementation and verification history](./WEEK_5_6_IMPLEMENTATION_REPORT.md)
- [Final audit and submission commands](./FINAL_SUBMISSION_AUDIT.md)
- [Explicit files for the future Git add](./SUBMISSION_FILES.txt)
- [Week 4 verification](./WEEK_4_VERIFICATION_REPORT.md)

The user confirmed real GitHub login, the trip 2 save and successful Week 6 browser offline tests. Automated session/action tests use isolated fixture data, while real Neon checks use SELECT only. No screenshot, browser version or per-step browser timestamp is invented. See the reports for the exact scope of each result.

## Local setup

Use Node.js 22.18+ with native TypeScript support, or Node.js 24+. The recorded checks ran on Node.js 25.6.0 and npm 11.8.0. NextAuth is pinned to version 4.24.15.

From the repository root, in PowerShell:

```powershell
Set-Location aplikacioni
npm.cmd ci
```

On a fresh setup only, create a private `.env.local` beside `package.json` using the blank `.env.example` as a reference. Preserve an existing `.env.local`; do not overwrite it with the template. Configure the following privately:

| Setting | Purpose |
| --- | --- |
| `DATABASE_URL` | Connection string for the existing Neon database |
| `NEXTAUTH_URL` | `http://localhost:3000` for the local demonstration |
| `GITHUB_ID` and `GITHUB_SECRET` | Existing GitHub OAuth App client credentials |
| `NEXTAUTH_SECRET` | Private random session encryption secret |

The app also supports `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` and `AUTH_SECRET` instead of the three corresponding legacy names. Nonempty `GITHUB_ID`, `GITHUB_SECRET` and `NEXTAUTH_SECRET` take precedence. Keep one consistent scheme and avoid stale duplicate values. All settings above stay server-side; do not add a `NEXT_PUBLIC_` prefix.

For the existing GitHub OAuth App:

- Homepage: `http://localhost:3000`
- Authorization callback: `http://localhost:3000/api/auth/callback/github`

Use `localhost:3000` consistently. Restart the Next.js server after changing private environment values. Changing the effective session secret invalidates existing session cookies; sign in again.

The existing Neon database is already configured. Do not reset/reseed it, rerun ownership assignments or modify trip 1 for setup. [schema.sql](./schema.sql) and [schema-java05.sql](./aplikacioni/schema-java05.sql) are manual references for a separately reviewed fresh lab setup; the app does not execute them at startup. A new verified account starts as a passenger; changing driver roles/ownership is a deliberate manual administration step, never a form field.

## Checks and production run

Stop an existing RideShare dev/start process before building. Do not run dev, build and start concurrently against the same `.next` directory. From `aplikacioni/`:

```powershell
npm.cmd run build
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run verify:week5-data
npm.cmd run test:production
```

Run commands one at a time and stop on a failure. `npm test` requires the production build and runs isolated data/PWA/auth/outage tests; it does not complete real GitHub OAuth or a browser offline demonstration. `verify:week5-data` and `test:production` require Neon network access and perform real SELECTs/anonymous GETs, with no live trip updates. The preserved verification baseline is **ID 1 at 08:00 and ID 2 at 08:25**. The known `MODULE_TYPELESS_PACKAGE_JSON` test warning is nonfatal.

Then keep the production server running:

```powershell
npm.cmd run start -- --hostname localhost --port 3000
```

Open `http://localhost:3000`. Development uses `npm.cmd run dev`; the offline browser demonstration uses the production build.

### After rotating credentials or seeing API HTTP 503

The production process loads private environment settings when it starts. Editing `.env.local` or running `npm run build` does not replace the process already serving port 3000. A passing `test:db` uses a fresh process and can therefore coexist with a stale production server returning 503.

Stop the actual RideShare Next.js process before rebuilding/restarting. If stopping its terminal leaves port 3000 occupied, identify the listener before taking action:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen |
  Select-Object LocalAddress, LocalPort, OwningProcess
```

Inspect that process locally and stop it only after confirming it is this RideShare server. Do not stop unrelated Node processes or reuse a process ID from an old report. Start one production server with the current private configuration. A build alone is insufficient; if a new start reports an occupied port, the old process may still be serving requests.

With the restarted server running, verify its real routes from a second terminal in `aplikacioni/`:

```powershell
npm.cmd run test:routes -- http://localhost:3000
```

Open `/api/udhetimet` and expect HTTP 200 with three trips, then refresh `/` online. `test:production` starts a separate temporary server; its success alone does not certify the process already bound to port 3000. If the reader still labels data as cached after reconnecting, choose **Rifresko listën**; retain the cache and its timestamp. Do not reset the database, change ownership, extend timeouts or clear browser storage to hide a connection failure.

## Browser checks

For GitHub, open `/panel`, choose **Hyr me GitHub**, complete authorization and confirm your returned profile/driver form. Test **Dil** and refresh to verify the anonymous state. The session lasts up to two hours. A successful login with newly rotated credentials must be tested again; an enabled login button alone does not prove OAuth success.

For offline behavior, online first open `/` and `/offline.html`, wait for the active Service Worker and saved public snapshot, and record three cards and the saved time. In the RideShare tab only, choose DevTools Network -> Offline, open `/` and perform a normal refresh. Expect the three cached cards, original timestamp, cache warning and disabled booking. Restore Online and choose **Rifresko listën** to obtain server data and a refreshed timestamp. Keep ID 1 at 08:00 and ID 2 at 08:25. Full instructions and evidence limits are in [java-06.md](./java-06.md).

## Git and private configuration

Private environment files, credentials/key exports, `node_modules`, `.next`, `out`, logs and temporary files are excluded. Generated `next-env.d.ts` remains local and is regenerated by Next.js; it is excluded from Git. The deliberately blank `.env.example`, lockfile, SQL references and public PNG icons belong in the submission.

The audit contains private credential-rotation steps and the exact allowlist-based add/commit/push commands for later approval. Rotating credentials, publishing commits and creating the professor's submission Issues are separate steps. Never put secret values in reports, screenshots or Issues.
