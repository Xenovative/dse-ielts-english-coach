# Demo-day freeze checklist

Use this before presenting.

## Services

1. Next.js: `npm run dev -- -p 3001` → http://localhost:3001
2. Whisper STT: `npm run stt:server` (or auto-starts on first STT call)
3. Confirm STT: `curl -s http://127.0.0.1:8787/health` → `"model":"small.en","ok":true`
4. Python venv present: `.venv-tts` (edge-tts + faster-whisper)

## Account

- Student: `student@example.com` / `student1234`
- Admin (optional): `admin@example.com` / `admin1234`

## Demo path (keep it short)

1. Login → Dashboard
2. **Listening**: open **DSE Paper 3 — Listening (Sample)** (short clip). Avatar plays; if avatar fails, use the HTML audio fallback. Answer questions → Submit.
3. **Reading**: any short paper → answer a few items → Submit → show score + feedback.
4. **Writing**: paste a prepared ≥150-word paragraph → Submit (AI timeout ~35s; offline mock feedback if OpenRouter is slow).
5. **Speaking**: open avatar session → tap **Hear the question** → 60s prep countdown (auto-starts) → speak for 120s → follow-ups → Submit on page.
6. **Results** / dashboard progress.

## Backup if OpenRouter is down

In `.env`:

```bash
AI_PROVIDER=mock
```

Restart Next.js. Scores and feedback still appear offline.

## Pre-warm (2 minutes before talk)

1. Open one speaking paper once (loads GLB + TTS).
2. Open the listening sample once.
3. Confirm Network tab has **no** calls to `127.0.0.1:7297`.

## Prepared sample speaking answers

- Main: “I enjoy community events because they help people feel connected. For example, festivals bring neighbours together.”
- Follow-up: “Volunteering also builds confidence and communication skills.”
