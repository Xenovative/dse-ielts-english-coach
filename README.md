# DSE + IELTS English Coach

A responsive, mobile-first, multilingual exam-prep platform for **HKDSE English**,
**IELTS Academic**, and **IELTS General Training**. Practice **reading, writing,
listening, and speaking** with deterministic scoring and AI feedback that
*explains* rather than hallucinates.

> **Status: Vertical slice.** This build delivers a fully runnable foundation —
> auth (+ guest), multilingual UI, dashboard, and a complete **Reading** module
> end-to-end (practice → submit → deterministic score → results). Writing,
> Listening, and Speaking are wired through the same engine with seed content and
> working UI, ready to deepen skill-by-skill.

---

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS (dark mode via `class`) |
| Database | Prisma ORM — **SQLite** for dev (swap to Postgres for prod) |
| Auth | Custom JWT (`jose`) in httpOnly cookies + bcrypt, plus guest mode |
| i18n | `react-i18next` client provider (cookie/localStorage, no reload) |
| Validation | Zod on every API route |
| AI feedback | Provider-agnostic interface: `mock` (default) / `openai` / `ollama` |
| Speech-to-text | Provider interface: `mock` (default) / `vosk` (offline) |
| Rate limiting | In-memory sliding window (swap for Redis in prod) |
| Tests | Vitest |

---

## Quick start

```bash
# 1. Install Node deps
npm install

# 2. Configure env (defaults work out of the box for local dev)
# Windows PowerShell:  Copy-Item .env.example .env
# macOS / Linux:       cp .env.example .env

# 3. Create the database + apply schema
npx prisma migrate dev

# 4. Seed exam content + demo users
npm run db:seed

# 5. Python venv for avatar TTS / listening audio (Windows + Linux)
npm run setup:venv
# Optional speaking STT (Whisper): npm run setup:venv:stt

# 6. Run
npx next dev -p 3000
# open http://localhost:3000
```

### Demo accounts (from the seed)

| Role | Email | Password |
| --- | --- | --- |
| Student | `student@example.com` | `student1234` |
| Admin | `admin@example.com` | `admin1234` |

Or click **Continue as guest** on the login/signup page — no account needed.

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` / `npx next dev -p 3000` | Start the dev server |
| `npm run setup:venv` | Create `.venv-tts` + install `edge-tts` (Windows/Linux) |
| `npm run setup:venv:stt` | Same + Flask / faster-whisper for local STT |
| `npm run stt:server` | Start local Whisper STT on `:8787` |
| `npm run db:generate-audio` | Regenerate listening MP3s via edge-tts |
| `npm run build` | `prisma generate` + production build |
| `npm start` | Start the production server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Run the Vitest suite |
| `npm run db:seed` | Reset + seed content and demo users |
| `npm run prisma:migrate` | Create/apply a migration |
| `npm run prisma:push` | Push schema without a migration |

---

## Project structure

```
app/
  (marketing)/         # public landing
  (auth)/              # login, signup (+ guest)
  (dashboard)/         # dashboard, practice, results, settings (auth-gated)
  api/                 # auth, practice, submissions, feedback,
                       # speech-to-text, progress, language, admin/content
components/            # layout, language-switcher, question-renderer,
                       # audio-player, mic-recorder, writing-editor,
                       # score-panel, progress-chart, feedback-panel, ...
lib/
  db/                  # Prisma client singleton
  auth/                # JWT sessions, bcrypt, guards (server-only)
  i18n/                # react-i18next provider + settings
  rubrics/             # DSE/IELTS scales + deterministic auto-scoring
  llm/                 # provider-agnostic AI feedback engine
  vosk/                # provider-agnostic speech-to-text
  validators/          # Zod schemas
  services/            # practice, scoring, progress, content ingestion
  utils/               # api helpers, text, json, rate-limit
messages/              # en.json, zh-Hant.json, zh-Hans.json
prisma/                # schema.prisma + migrations
seed/                  # seed.ts + content/*.json
tests/                 # Vitest unit tests
```

---

## Internationalization

- Three locales: **English** (default), **繁體中文**, **简体中文**.
- Switching is instant (no reload) via a client `react-i18next` provider.
- Preference persists in a cookie + `localStorage`, and to the DB for logged-in
  users (`POST /api/language`).
- The sticky top language switcher appears on every page; a theme toggle
  (light / dark / system) sits beside it.
- Add a language by dropping a `messages/<locale>.json` file and extending
  `LOCALES` in `lib/i18n/settings.ts`.

---

## AI feedback engine

Scoring is **deterministic** (rubric-based in `lib/rubrics` + `lib/llm/deterministic-score.ts`)
so numbers never depend on a model. The selected provider only writes the prose
(strengths, mistakes, corrections, next steps). Output always matches the
`StructuredFeedback` contract.

Switch providers via `.env`:

```bash
AI_PROVIDER=mock     # default, offline, no key
# AI_PROVIDER=openai # set OPENAI_API_KEY (works with any OpenAI-compatible base URL)
# AI_PROVIDER=ollama # set OLLAMA_BASE_URL / OLLAMA_MODEL for a local LLM
```

If a real provider fails or returns malformed JSON, the engine transparently
falls back to the deterministic mock so the app never breaks.

---

## Speech-to-text (Vosk)

Default `STT_PROVIDER=mock` returns a placeholder transcript so the speaking flow
(record → upload → transcribe → score) runs with zero setup.

### Enabling real offline Vosk

```bash
npm install vosk
# download a model, e.g. the small English model:
mkdir -p models && cd models
curl -LO https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
unzip vosk-model-small-en-us-0.15.zip
cd ..
# then in .env:
# STT_PROVIDER=vosk
# VOSK_MODEL_PATH=./models/vosk-model-small-en-us-0.15
```

> Vosk expects mono 16 kHz PCM WAV. Browser recordings are typically WebM/Opus,
> so add an `ffmpeg` transcode step before transcription (marked as an extension
> point in `lib/vosk/index.ts`). Vosk runs on the Node runtime — it will not work
> on serverless/edge platforms like Vercel Functions.

---

## Listening audio

The listening seed references files in `public/audio/`. Drop matching MP3s there
to enable real playback (see `public/audio/README.md`). Answer keys work
regardless, so the flow is testable without audio.

---

## Content management

All content is seeded from JSON in `seed/content/` and validated by the same Zod
schema (`adminPaperSchema`) used by the admin API — official and generated
content share one code path (`lib/services/content.ts`).

- Add content at runtime: `POST /api/admin/content` (admin only) with a paper
  payload.
- `source` distinguishes `official` / `mock` / `custom`.
- Add a new paper by dropping a JSON file in `seed/content/` and referencing it
  in `seed/seed.ts`.

---

## API reference

| Method | Route | Body / Query | Notes |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | `{ email, password, name? }` | Sets session cookie |
| POST | `/api/auth/login` | `{ email, password }` | |
| POST | `/api/auth/guest` | — | Creates ephemeral guest |
| POST | `/api/auth/logout` | — | |
| GET | `/api/practice` | `?mode=&skill=&paper=` | List, or a single public paper (no answer keys) |
| POST | `/api/submissions` | `{ paperId, skill, answers?/responseText?/audioUrl? }` | Deterministic scoring |
| POST | `/api/feedback` | `{ submissionId }` | AI prose feedback (cached, idempotent) |
| POST | `/api/speech-to-text` | multipart `audio` | Transcription |
| GET | `/api/progress` | — | Summary, weak areas, trend |
| POST | `/api/language` | `{ locale?, theme? }` | Persist prefs |
| POST | `/api/admin/content` | paper JSON | Admin only |

Every request is Zod-validated; errors return `{ error: { code, message, details? } }`.

---

## Scoring rules

- **DSE**: `Level 1 … 5**` (localized exam-style bands).
- **IELTS**: `Band 0.0 … 9.0` in 0.5 steps.
- Reading/Listening: objective auto-scoring by answer key and question type
  (MCQ, True/False/Not Given, matching, short answer, summary completion).
- Writing/Speaking: transparent heuristics (length, lexical variety, cohesion,
  sentence structure, task overlap) produce rubric sub-scores; the LLM explains.
- Scores are stored per skill and per attempt (`SkillScore`, `ProgressMetric`)
  for history and trend charts.

---

## Moving to PostgreSQL (production)

1. In `prisma/schema.prisma` set `datasource db { provider = "postgresql" }`.
2. Set `DATABASE_URL` to your Postgres connection string.
3. `npx prisma migrate dev` (or `migrate deploy` in CI/CD).

The schema is Postgres-compatible (enum-like values are strings; structured
fields are JSON-as-text for portability).

---

## Deployment notes

- **Frontend + API + Postgres** (e.g. Vercel + a managed Postgres): works with
  `AI_PROVIDER=mock` or `openai` and `STT_PROVIDER=mock`.
- **Speaking with real Vosk** requires a Node server (a container / VM), not
  edge/serverless. Deploy on Render, Fly.io, Railway, or a VPS.
- Always set a strong `JWT_SECRET` in production (`openssl rand -base64 32`).

---

## Testing

```bash
npm test
```

Covers exam-scale mapping (DSE/IELTS), objective auto-scoring, deterministic
feedback (determinism + monotonicity), the mock feedback contract, and Zod
validators.

---

## Roadmap (expanding the slice)

1. Deepen Writing (inline mistake highlighting, attempt comparison).
2. Real listening audio + section navigation + transcript reveal.
3. Speaking: `ffmpeg` transcode + real Vosk + pronunciation timing metrics.
4. Highlight-evidence-in-passage interaction for reading.
5. Redis rate limiting + school/paid-plan multi-tenancy.
```
