# AAB RideShare — Week 4 Implementation Report

**Project:** AAB RideShare — Mobile Programming, Week 4\
**Repository:** `blackstackdev777/rideshare-mobile`\
**Application directory:** `aplikacioni/`\
**Report date:** 22 October 2026

**Overall status:** The database integration code and university documentation have been prepared. A real read-only Neon query and the data-layer tests passed. Dependency installation did not finish because the C: drive ran out of space. A successful production build and complete application verification have not been established.

This report records the implementation session and its actual results. Historical database and data-layer results below were not rerun merely to prepare this document. No passwords, connection strings, or private environment-variable values are included.

## 1. Scope and initial inspection

The objective was to connect the existing Week 3 application to the existing Neon PostgreSQL database while preserving previous assignments, trip IDs, routes, Albanian text, and the request-seat simulation.

The inspection covered the application pages, shared trip module, trip card, layout, CSS, Next.js configuration, TypeScript configuration, package manifest, ESLint configuration, ignore rules, and existing assignment documents.

The existing implementation used Next.js App Router, React 19, and TypeScript with strict checking. Its dependency manifest allowed Next.js 15.5 and later compatible releases. Three trips were hardcoded in `src/lib/udhetimet.ts`; the homepage also contained a fixed trip count. Details and request pages used the same synchronous lookup function.

Existing routes were retained:

- `/`
- `/udhetimi/[id]`
- `/udhetimi/[id]/kerkesa`

No official professor requirements document for Week 4 was found in the repository. The work followed the requirements supplied in the task. The final submission still needs comparison with the professor's official brief.

## 2. Files created

All paths below are relative to the repository root. This list includes this implementation report.

| File | Purpose |
| --- | --- |
| `.gitignore` | Add repository-level protection for private environment files while allowing an empty example file. |
| `schema.sql` | Document the existing PostgreSQL schema and three sample records using repeatable SQL. |
| `java-04.md` | Provide the Albanian university report, actual results, limitations, and manual verification instructions. |
| `WEEK_4_IMPLEMENTATION_REPORT.md` | Record the complete implementation work, file inventory, test outcomes, failures, and remaining steps. |
| `aplikacioni/.env.example` | Provide an empty configuration template with no private connection value. |
| `aplikacioni/package-lock.json` | Record exact dependency resolutions for a reproducible installation. |
| `aplikacioni/src/app/error.tsx` | Add an Albanian error screen with a page-refresh retry button. |
| `aplikacioni/scripts/test-database.mjs` | Add a read-only test of the real database and assignment records. |
| `aplikacioni/scripts/test-data.mjs` | Test conversions, query parameterization, empty results, invalid IDs, and sanitized errors with controlled HTTP responses. |
| `aplikacioni/scripts/test-routes.mjs` | Prepare HTTP checks comparing local application pages with the current PostgreSQL records. |

## 3. Files modified

| File | Change |
| --- | --- |
| `aplikacioni/.gitignore` | Ignore generated TypeScript build information. Existing private environment-file exclusions remain in place. |
| `aplikacioni/package.json` | Declare the Neon and server-only packages; add type-checking and test scripts. |
| `aplikacioni/eslint.config.mjs` | Assign the configuration array to a named variable before exporting it to address the observed ESLint warning. |
| `aplikacioni/src/lib/udhetimet.ts` | Replace the hardcoded trip array and synchronous lookup with server-only asynchronous PostgreSQL queries and result conversion. |
| `aplikacioni/src/app/page.tsx` | Await database trips, calculate the count dynamically, handle an empty list, and enable dynamic rendering. |
| `aplikacioni/src/app/layout.tsx` | Update the Week 4 and PostgreSQL/Neon labels while keeping the existing page structure. |
| `aplikacioni/src/app/udhetimi/[id]/page.tsx` | Await the database lookup and enable dynamic rendering; preserve details, not-found handling, and the seat-request control. |
| `aplikacioni/src/app/udhetimi/[id]/kerkesa/page.tsx` | Await current database availability and enable dynamic rendering while preserving the simulation. |

There are 10 newly created files and 8 modified existing files in the Week 4 inventory, including this report.

Previous assignment files were preserved, including `README.md`, `java-02.md`, `java-03.md`, `exit-ticket.md`, `prd (1).md`, and `skica.png`. The trip card component, existing not-found page, application CSS, and TypeScript configuration were not changed. The existing private `.env.local` file was not created or overwritten by this implementation.

## 4. PostgreSQL and Neon integration

### Connection and dependencies

The application uses `@neondatabase/serverless` for PostgreSQL queries over HTTPS and `server-only` to protect the database module from client-component imports.

The newly declared dependencies resolve in the lockfile to:

| Package | Version |
| --- | --- |
| `@neondatabase/serverless` | 1.2.0 |
| `server-only` | 0.0.1 |

The lockfile resolves the existing compatible Next.js dependency to 15.5.28. The existing major-version dependency ranges were preserved.

The application reads `DATABASE_URL` from the server environment. Its private value remains in local configuration and is not included here. It is not given a public environment-variable prefix or passed to a client component.

### Queries and value conversion

`lexoUdhetimet()` selects the six existing trip columns and sorts by ID. `gjejUdhetimin(id)` selects the matching row with a bound ID parameter. The queries use the Neon tagged-template interface, not string concatenation or unsafe SQL interpolation.

Before a detail query, the function rejects malformed IDs, leading-zero IDs, negative IDs, and values above the supported positive PostgreSQL `INTEGER` limit. Valid but absent IDs return `undefined`, allowing the page to call `notFound()`.

Database values are mapped to the existing `Udhetim` type:

| Database field | Application representation |
| --- | --- |
| `id` | String used by existing routes |
| `nisja`, `destinacioni` | Existing text fields |
| `ora` | `HH:MM` display extracted from the PostgreSQL time value |
| `cmimi` | JavaScript number converted from the numeric result |
| `vendet_e_lira` | Numeric `vende` property |

The three data-dependent pages use `dynamic = "force-dynamic"`. Database requests use `cache: "no-store"` and a 15-second abort timeout. These settings are intended to make a new page request or refresh read the current database values. A live database-time-change demonstration has not yet verified that behavior through the running application. Timeout expiry was not separately exercised.

### Meeting-point metadata

The existing database schema has no `vendtakimi` column. The three original meeting-point labels were retained as local server metadata so the existing detail screen keeps that information. A new database trip without a known label receives “Përcaktohet nga shoferi”.

These labels do not create fallback trips. Trip existence, departure, destination, time, price, and seat availability come from PostgreSQL.

### Real database evidence

A successful read-only query against the existing Neon database returned:

| ID | Departure | Destination | Time | Price | Available seats |
| --- | --- | --- | --- | --- | --- |
| 1 | Prishtinë | AAB | 08:00 | EUR 2 | 2 |
| 2 | Fushë Kosovë | AAB | 08:15 | EUR 2 | 1 |
| 3 | Lipjan | AAB | 07:45 | EUR 3 | 0 |

This proves database connectivity and the returned records at the time of testing. It does not establish that the complete application rendered those records in a browser.

### Schema documentation

`schema.sql` documents the existing table with its primary key, required fields, `TIME`, `NUMERIC(6,2)`, and nonnegative-seat constraint. Sample inserts use `ON CONFLICT (id) DO NOTHING` within a transaction so rerunning the script does not overwrite existing records.

The schema script was not executed against the existing database. No database migration, reset, recreation, or destructive database command was performed.

## 5. Application behavior implemented

| Situation | Implemented behavior | Verification limit |
| --- | --- | --- |
| Trips returned | Render cards and calculate the displayed count. | Real records and mapping tested; page rendering not tested. |
| Successful query returns no trips | Display “Nuk ka udhëtime për momentin” with count zero. | Empty result tested in the data layer; browser screen not tested. |
| Valid ID has no row | Return no trip and use the existing not-found page. | Data-layer result tested; HTTP 404 not tested. |
| Invalid ID | Reject it before querying. | Tested in the data layer. |
| Database or configuration failure | Throw a fixed, sanitized error; render the new error boundary. | Sanitized exceptions tested; browser error screen not tested. |
| Trip has seats | Keep the demonstrative pending-request flow. | Existing flow retained in code; click-through not tested. |
| Trip has zero seats | Disable the request button and reject the direct request-page simulation. | Real zero-seat record confirmed; application UI not tested. |

The request remains a simulation. No booking is inserted, no seat count is reduced, and no message is sent to a driver. The Albanian interface, existing route structure, and responsive CSS were retained.

## 6. Security checks and precautions

- The shared database module imports `server-only`.
- The error component does not import the database module or private configuration.
- The card imports the trip type using `import type`.
- User-provided IDs are bound SQL parameters and are validated before querying.
- Original driver errors are replaced with fixed application messages. Their private details are not logged or attached as the new error's cause.
- Connection failures do not silently produce mock trips or an empty successful result.
- Ignore checks confirmed that `.env.local` and `.env.production` are excluded. The private local environment file is not tracked by Git.
- The actual private database URL was checked against the 17 implementation submission files that existed before this report; it was absent from all of them. This new report includes no connection values.
- Real database testing used only `SELECT`. Database contents were not modified.
- No credentials or screenshots containing private configuration were included in the documentation.

## 7. Tests performed and actual results

The implementation environment used Windows PowerShell, Node.js 25.6.0, and npm 11.8.0.

| Command or check | Actual result |
| --- | --- |
| Initial npm registry access / `npm ping` | Failed in the sandbox with an access restriction. Access was retried with the required permission. |
| `npm install @neondatabase/serverless server-only` and subsequent cached installation attempts | Did not finish. Package downloads were possible after permission, but extraction and installation exhausted disk space. |
| `npm install --package-lock-only --offline --ignore-scripts --no-audit --no-fund` | Passed. Created the dependency lockfile without completing package installation. |
| `npm run test:db` in the restricted environment | Failed; no private driver details were printed. |
| `npm run test:db` with the required network permission | Passed. Returned three expected trips and verified IDs, directions, value types, and the zero-seat record. |
| Final `npm run test:data` runs during implementation | Passed. Used controlled Neon HTTP responses inside the test process rather than the real database. |
| Parameterization assertion in `test:data` | Passed after correcting the draft test's expectation to match the driver's string serialization of a bound HTTP parameter. The query used `$1` with a separate value. |
| Conversion assertions in `test:data` | Passed for ID string conversion, time formatting, decimal price conversion, numeric seats, and retained meeting-point metadata. |
| Cache assertion in `test:data` | Passed; the test observed `cache: "no-store"`. |
| Empty result and absent-record assertions | Passed; returned an empty list and `undefined`, respectively. |
| Invalid, injection-like, leading-zero, negative, and overflowing IDs | Passed; the test verified that no database request was made for these IDs. |
| Simulated driver failure and missing environment configuration | Passed; fixed application errors were thrown without the injected private-detail marker or fallback data. |
| `npm run typecheck` | Did not pass. The interrupted installation had not created the `tsc` command shim. |
| Direct execution of TypeScript's compiler | Did not pass. Attempts encountered missing Next.js declarations and later missing TypeScript standard-library declarations/global types. Initial missing Next.js types also caused downstream possibly-undefined diagnostics. No clean type-check result was obtained. |
| `npm run lint` | Did not pass because the interrupted installation had not created the `eslint` command shim. |
| Early direct ESLint execution | Reported zero errors and one existing anonymous-default-export configuration warning. That warning was corrected in the configuration file. |
| Later direct ESLint checks after further installation failures | Blocked by missing packages or metadata, including `acorn` and ESLint package information. Final lint verification did not pass. |
| `npm run build` | Failed before a production build could complete because the `next` command was unavailable in the incomplete installation. |
| `node --check` on all three test scripts | Passed. This checks syntax only; it does not execute route tests or resolve their imported dependencies. |
| Manifest versus lockfile dependency comparison | Passed. The declared dependency entries matched. |
| `git diff --check` | Passed. Git emitted Windows line-ending notices, not whitespace-check failures. |
| Environment-file ignore and tracked-file checks | Passed. Private environment files were ignored and the local private environment file was untracked. |
| Previous-assignment file comparison | Passed; no changes were reported for the original assignment documents and sketch. |
| Private database URL scan of the original 17 submission files | Passed; the actual value was absent. |

While developing the data-layer test, an ad hoc PowerShell stdin run had an encoding mismatch for an Albanian character. The saved UTF-8 test file avoided that issue. A draft parameter assertion also initially expected a number instead of the driver's serialized string; the assertion was corrected, and the final data-layer test passed.

Node.js 25 emitted `MODULE_TYPELESS_PACKAGE_JSON` while loading the TypeScript module in `test:data`. This was a module-interpretation warning; all final assertions in that test completed successfully. That test requires Node.js native TypeScript support, such as Node.js 22.18+ or 24+.

The historical successful data-layer and database tests do not substitute for a clean final installation, type check, lint run, or production build.

## 8. Checks not performed

The following must not be described as passed:

- `test:routes` against a running Next.js application. The script was created and its syntax checked, but it was not executed against a functioning server.
- Browser rendering of the trip list, detail pages, pending simulation, unavailable-seat state, not-found page, empty-list screen, or connection-error screen.
- HTTP status-code verification for unknown IDs.
- Mobile layout checks at 375 px or on a physical phone.
- Browser clicks and return navigation.
- Changing a real trip time in Neon and confirming it appears after refresh.
- Production client-bundle or rendered-HTML inspection for secrets. The prepared route test includes response checks, but those checks have not run.
- Executing `schema.sql`, including rerunning it to test repeatability on a database.
- A standalone test of the 15-second timeout expiring.

No screenshots or user-testing results were invented.

## 9. Installation errors, recovery work, and final local state

The initial network restriction was followed by a separate storage failure: the C: drive reached zero free space and npm reported `ENOSPC` while extracting packages.

Recovery attempts were restricted to generated files from this task's dependency installation. They included removing generated source maps and duplicate npm backup directories, using cached packages, trying NTFS compression on generated dependencies, and temporarily recovering cached package files for static checks. These attempts did not produce a complete working dependency installation.

The incomplete `aplikacioni/node_modules` directory was removed at the end. It had been created by these installation attempts; no existing assignment or application source files were deleted. The last measured free space after that cleanup was approximately 371 MB. This is a historical measurement, not a current free-space guarantee.

During preparation of this report, filesystem checks confirmed that `aplikacioni/node_modules` and `aplikacioni/.next/BUILD_ID` were absent. No dependency installation, live database test, or application build was rerun for this documentation request.

The root problem requiring action is insufficient disk space. Free at least 1 GB on C: as initial headroom, then retry installation; additional space may be needed. Cached npm downloads are not equivalent to installed dependencies. The lockfile exists and is ready for `npm ci`.

## 10. Does the Next.js application build successfully?

**A successful production build has not been verified.**

The attempted `npm run build` failed because the incomplete installation did not provide the `next` executable. There is no successful build result or production build artifact from this work. The absence of a verified build means the application should not yet be presented as fully tested or ready for submission.

The observed failures do not establish a specific application-code build defect; they also do not prove that the code is free of such defects. That question remains open until dependencies install successfully and the full checks run.

## 11. Remaining local commands

First free disk space. Keep the existing private `.env.local` file in place; do not overwrite it with the empty example.

Run these commands individually in PowerShell and resolve any failure before continuing:

```powershell
Set-Location C:\Users\Lenovo\Documents\GitHub\rideshare-mobile\aplikacioni
npm.cmd ci
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test:data
npm.cmd run test:db
npm.cmd run build
npm.cmd run start
```

Keep the production server running. In another terminal inside `aplikacioni/`, run:

```powershell
npm.cmd run test:routes
```

For development, use `npm.cmd run dev` and open `http://localhost:3000`. Production start requires a successful build first. If port 3000 is occupied, use `npm.cmd run start -- --port 3004` and `npm.cmd run test:routes -- http://localhost:3004`.

The database and route scripts expect the assignment's three records. The database test also expects trip 3 to have zero seats. They read current times rather than requiring the original times.

## 12. Remaining manual verification

1. Confirm all three records appear on the homepage and that the displayed count is correct.
2. Open each trip's details and compare time, price, and available seats with Neon.
3. For trips 1 and 2, click “Kërko vend”, verify “Simulim: Në pritje”, and follow the return links.
4. For trip 3, verify the disabled request button and the direct `/udhetimi/3/kerkesa` unavailable-seat message.
5. Open `/udhetimi/99` and check the not-found screen and HTTP status.
6. Check the layout at 375 px and on a phone, including horizontal overflow and usable controls.
7. Use a separate controlled test process to verify the visible connection-error screen without overwriting the real environment file or exposing driver details. Do not delete real records to exercise an empty list.
8. In Neon SQL Editor, record trip 1's current time, change only that trip to another time, refresh the homepage and details, and record the observed result. Restore the recorded original time if the change was only a test. The Albanian report contains example SQL for this demonstration; it has not been executed during this work.
9. Compare the completed work with the professor's official Week 4 requirements and add any required evidence only after performing it.
10. Update both reports with the actual subsequent type-check, lint, build, HTTP, and manual-test results.

## 13. Git and submission state

All Week 4 work remains uncommitted. No staging, commit, or push was performed as part of the implementation or this report request. Git commands used for reporting and verification were read-only status, diff, tracked-file, and ignore checks.

Before any later submission, review from the repository root:

```powershell
git status --short
git diff --check
git check-ignore -v aplikacioni/.env.local
git ls-files -- aplikacioni/.env.local
```

The last command should return no tracked file. Include the source changes, tests, schema, lockfile, empty configuration example, and reports when preparing a submission. Keep private environment files, generated dependencies, and build output excluded. Committing or pushing is a separate manual action and was not performed here.
