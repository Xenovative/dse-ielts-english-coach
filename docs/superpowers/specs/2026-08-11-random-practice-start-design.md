# Random practice start (no paper catalog)

**Date:** 2026-08-11  
**Status:** Approved in chat; awaiting final spec confirmation  
**Repo:** DSE + IELTS English Coach

## Problem

Practice currently lists every paper for the selected exam/skill. Learners can browse and pick favorites, which breaks a “exam-like surprise” feel and makes repeats easy to choose.

## Goal

When a learner has chosen an exam mode and clicks one of the four skills (reading, writing, listening, speaking), the app **immediately starts one practice** — a random paper for that exam + skill. No catalog of titles is shown. Papers should not repeat until the learner has completed the full pool for that exam + skill; then the pool **resets** and random selection continues.

## Non-goals

- Generating brand-new AI/Wikipedia papers on each click (future work).
- Changing scoring, rubrics, or runner UI beyond start/navigation.
- Removing admin ability to load a paper by id (`?paper=`).

## User flow

1. Learner opens Practice (or arrives with `?mode=DSE` etc.).
2. Learner selects exam if not already selected (DSE / IELTS Academic / IELTS General).
3. Learner clicks a skill card.
4. UI shows a short loading state (“Starting practice…”); **no paper list**.
5. Client calls `GET /api/practice/next?mode=&skill=`.
6. Server returns `{ paperId }`; client navigates to `/practice?paper=<paperId>`.
7. Existing `PracticeRunner` loads and runs unchanged.

If skill is clicked without an exam mode, prompt the learner to pick an exam first (do not auto-start).

## Selection rules

For authenticated or guest user `userId`, exam `mode`, skill `skill`:

1. Load all papers matching `examMode.code = mode` and `skill = skill`.
2. Load paper ids the user has **completed** for that skill — sessions with `status` in `submitted` | `scored` (or any session that has a scored `SkillScore` / submission — prefer session status `scored` or `submitted`).
3. Candidate set = papers not in completed set.
4. If candidate set is empty (all done, or no history), candidate set = all papers (pool reset).
5. Pick uniformly at random from candidates; return `paperId`.
6. If zero papers exist for that exam+skill, return 404 with a clear message.

Guests use the same rules against their guest user id. Clearing guest session clears history naturally.

## API

### `GET /api/practice/next?mode=&skill=`

- Auth: required session cookie (including guest).
- Query: `mode` (ExamCode), `skill` (Skill) — both required.
- Response `200`: `{ paperId: string }`
- Errors: `401` unauthenticated, `400` invalid query, `404` no papers.

Existing `GET /api/practice?paper=` unchanged.  
`GET /api/practice?mode=&skill=` may remain for admin/debug but **must not be used by the Practice UI** to render a catalog.

## UI changes

| Surface | Change |
|---------|--------|
| `PracticeLibrary` | Keep exam + skill pickers. Remove paper grid. On skill click with mode set → call `/api/practice/next` → redirect. |
| Sidebar skill links | Include current exam `mode` when known (`/practice?mode=X&skill=Y`); if mode unknown, go to practice with skill only and require exam pick. |
| Dashboard / exam cards | Unchanged entry points; still land on practice with mode. |
| Direct `?paper=` | Still supported for deep links / admin. |

## i18n

Add strings for:

- Starting practice (loading)
- Pick an exam first
- No practices available for this skill

(en, zh-Hant, zh-Hans)

## Testing / acceptance

- With mode + skill, no paper titles listed.
- Two consecutive starts for same mode+skill prefer different papers while unused ones remain.
- After completing all papers for that mode+skill, next start succeeds (pool reset) and may repeat earlier papers.
- Guest and logged-in users both work.
- `?paper=` still opens the runner.

## Out of scope follow-ups

- On-demand AI generation of new papers.
- Hiding paper title inside the runner for “blind” practice.
