---
plan: morning-digest
status: ready
owner: rook
opened: 2026-10-29
---

# Morning digest

The night's run log is a JSONL file nobody reads. By breakfast someone has to know what ran,
what retried, what failed, and whose it was, without opening `runs/`. rig already serves the
status board; the digest is one more page on it.

Out of scope: notifications, history across nights, auth (rig only listens on localhost).

## 1. Run log reader

Read `runs/<night>.jsonl` into one row per job: job, owner, runs, retries, last status, last
error, first and last time. One JSON object per line (`at`, `job`, `status`: `ok | retry | fail`,
`owner`, optional `error`). Lives in `src/digest/`. Two parts: the contract first (1a), then the
reader (1b).

### 1a. Contract

`src/digest/types.ts` only. It fixes these points:

- `DigestRow` as described above.
- `readNight(runsDir, night)` returns `{ rows, badLines }`.
- Rows come back already sorted by job. The page and the JSON take them as given and never sort
  themselves (ADR 0001: they must not disagree).
- A night with no file returns `null`. The page turns that into 404.
- `night` must match `^\d{4}-\d{2}-\d{2}$`. Anything else is treated as a missing night.

Done when: `pnpm typecheck` passes with the types in place.

### 1b. Reader

The reader behind the 1a contract: one row per job, sorted by job, returned as
`{ rows, badLines }`.

- A line that doesn't parse is counted in `badLines`, never thrown. The night still renders.
- `owner` can be `null`. Keep the row; show the owner as `—`.

Done when: reader tests pass on `runs/2026-10-28.jsonl` (5 jobs, 1 bad line).

## 2. Digest page

Four small parts. Each can start once 1a is merged. 2a–2c can close only after 1b (and 2b/2c
after 2a, where their Done when compares against the page). Small, well-specified work: a cheaper
model is fine here. Each route lives in its own module, so parallel workers do not collide.

### 2a. Page

`GET /digest/:night` renders the rows with the usual layout: one table, in the order the reader
returns them, retries of 3 or more and any `fail` marked. `owner: null` shows as `—`. When
`badLines` is above 0 the page shows one line, for example "1 line skipped". A night with no file,
or a `night` that doesn't match `^\d{4}-\d{2}-\d{2}$`, returns 404; an empty file renders
"nothing ran".

Done when: `/digest/2026-10-28` renders locally, a missing night returns 404, and an empty file
shows "nothing ran".

### 2b. JSON

`GET /api/digest/:night` returns the same rows as JSON, plus `badLines`. Agents read this one; the
page and the JSON must never disagree (ADR 0001). A missing or invalid `night` is treated as in 2a.

Done when: the JSON for 2026-10-28 lists the same jobs in the same order as the page.

### 2c. Board link

The status board links each night on disk to its digest, with its ok / retry / fail counts beside
it. The counts are jobs by last status, not raw line counts, so they match the page table.

Done when: both nights on disk link to a digest that renders.

### 2d. Route tests

Route tests for 2a and 2b: 200, 404 for a night with no file, the empty night, a night with a bad
line, and an invalid `:night` such as `../x`. Use a temp runs dir; `runs/` is read-only.

Done when: `pnpm test` is green and those five cases exist as tests.

## 3. Preview for review

The reviewer reads the page from a copy, not from the lane. Run rig with `LANE_MARKER` set and save
`/digest/2026-10-28` as one HTML file, lane banner included (a command, not a browser's "save as";
the page is self-contained, ADR 0001). Check that the file contains the marker; if it does not,
there is nothing to clean up later.

Put the file on your own public host: any public bucket or static host that allows overwriting the
file later (ADR 0003), so it opens from a public HTTPS link. The repo is never the host (ADR 0003,
AGENTS.md Rules).

Before publishing, ask the human to approve: the page shows real owner names on a public link.
Then send the reviewer the link and the issues for this plan. Record the final URL and the upload
command (no credentials) in the issue's closing comment. Section 4 needs them.

Done when: the preview link is sent to the reviewer.

## 4. Clean up

### 4a. Clean up the preview

The preview carries this lane's marker on a public link (ADR 0003). Starts only after the
reviewer's feedback is in (a human comment on the preview issue) or 3 days after the link was
sent, whichever comes first. Save the page again with `LANE_MARKER` unset (the banner reads "no
marker set") and upload it over the same link, using the URL and upload command recorded in
issue 3.

Done when: a GET on the link contains "no marker set" and does not contain the lane marker value.

### 4b. Archive the plan

Move `plan.md` to `docs/plans/done/morning-digest.md` with its issue list. The list is the output
of `gh issue list --label plan-morning-digest` (or the `docs/issues/` file names in file mode).

Done when: `plan.md` is gone from the root and the archived file ends with the issue list.
