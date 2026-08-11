# Random Practice Start Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide the practice paper catalog; when exam + skill are chosen, auto-start a random unused paper (reset pool when exhausted).

**Architecture:** Add `pickNextPracticePaper(userId, examCode, skill)` in `lib/services/practice.ts` that excludes papers with scored/submitted sessions for that user, then resets to full pool if empty. Expose via `GET /api/practice/next`. Rewrite `PracticeLibrary` to start practice instead of listing papers.

**Tech Stack:** Next.js App Router, Prisma, Zod, react-i18next, Vitest

## Global Constraints

- Prefer unused papers; when none left, reset pool and pick randomly.
- No paper catalog in the Practice UI.
- Direct `?paper=` links still work.
- Require exam mode before starting a skill.

---

### Task 1: Selection service + unit tests

**Files:**
- Modify: `lib/services/practice.ts`
- Create: `tests/practice-next.test.ts` (pure helper if extracted) OR test selection logic via exported helper

**Interfaces:**
- Produces: `pickNextPracticePaper(userId: string, examCode: ExamCode, skill: Skill): Promise<string | null>`

- [x] **Step 1:** Extract/export `pickNextPracticePaper` using Prisma: papers for exam+skill; completed = sessions where userId matches and status in `submitted`|`scored`; candidates = unused else all; random pick.
- [x] **Step 2:** Add a small pure helper `chooseRandomUnused(allIds, completedIds)` unit-tested with Vitest for empty/partial/full completion.
- [x] **Step 3:** Commit (skipped — commit on request)

### Task 2: API route + validator

**Files:**
- Create: `app/api/practice/next/route.ts`
- Modify: `lib/validators/index.ts`

**Interfaces:**
- Consumes: `pickNextPracticePaper`, `getSession`
- Produces: `GET` → `{ paperId }`

- [x] **Step 1:** Add `practiceNextQuerySchema` requiring `mode` + `skill`.
- [x] **Step 2:** Implement route with auth + pick + 404 if null.
- [x] **Step 3:** Commit (skipped — commit on request)

### Task 3: PracticeLibrary UX + i18n + sidebar

**Files:**
- Modify: `components/practice/PracticeLibrary.tsx`
- Modify: `messages/en.json`, `zh-Hant.json`, `zh-Hans.json`
- Modify: `components/layout/SapphireSidebar.tsx` (skill links preserve mode from URL if on practice)

- [x] **Step 1:** Update copy (title, starting, pick exam, no papers).
- [x] **Step 2:** On skill click with mode → fetch `/api/practice/next` → `router.push(/practice?paper=...)`.
- [x] **Step 3:** Remove paper grid; show loading/error states.
- [x] **Step 4:** Sidebar skill links: if searchParams has mode, include it (use `useSearchParams` in sidebar or pass mode).
- [x] **Step 5:** Commit (skipped — commit on request)

### Task 4: Smoke verify

- [x] **Step 1:** Run `npx vitest run tests/practice-next.test.ts` (and related).
- [ ] **Step 2:** Manual: open practice → pick DSE → click Reading → lands in runner without seeing list.
