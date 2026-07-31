# Audio assets

Listening papers use spoken TTS clips generated from each paper's transcript
(edge-tts dialogue voices). These are **practice placeholders**, not HKEAA recordings.

Regenerate after changing transcripts:

```bash
python3 -m venv .venv-tts
.venv-tts/bin/pip install edge-tts
.venv-tts/bin/python seed/generate-listening-audio.py
```

Or: `npm run db:generate-audio`

**Do not** add copyrighted official exam audio without a licence.
