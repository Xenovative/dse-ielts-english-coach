# Audio assets

Listening papers use spoken TTS clips generated from each paper's transcript
(edge-tts dialogue voices). These are **practice placeholders**, not HKEAA recordings.

Regenerate after changing transcripts:

```bash
# Windows / macOS / Linux (recommended)
npm run setup:venv
npm run db:generate-audio
```

Manual venv (either OS):

```bash
python -m venv .venv-tts
# Windows: .venv-tts\Scripts\pip install -r requirements-tts.txt
# Unix:    .venv-tts/bin/pip install -r requirements-tts.txt
npm run db:generate-audio
```

**Do not** add copyrighted official exam audio without a licence.
