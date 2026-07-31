#!/usr/bin/env python3
"""Local free Whisper STT server for speaking practice.

Loads faster-whisper once, then transcribes uploaded audio via POST /transcribe.
Uses a single full-file pass (callers should send the complete turn, not tiny chunks).
Defaults follow Handy's offline quality approach: small.en + Silero VAD via faster-whisper.
"""

from __future__ import annotations

import os
import subprocess
import tempfile
from pathlib import Path

from flask import Flask, jsonify, request
from faster_whisper import WhisperModel

HOST = os.environ.get("WHISPER_STT_HOST", "127.0.0.1")
PORT = int(os.environ.get("WHISPER_STT_PORT", "8787"))
# small.en ≈ Handy's "Small" tier — cleaner exam speech than tiny/base.
MODEL_SIZE = os.environ.get("WHISPER_MODEL", "small.en")

app = Flask(__name__)


def pick_device() -> tuple[str, str]:
    device = os.environ.get("WHISPER_DEVICE", "").strip().lower()
    compute = os.environ.get("WHISPER_COMPUTE", "").strip()
    if device in {"cpu", "cuda"}:
        return device, compute or ("float16" if device == "cuda" else "int8")
    try:
        import torch

        if torch.cuda.is_available():
            return "cuda", compute or "float16"
    except Exception:
        pass
    return "cpu", compute or "int8"


DEVICE, COMPUTE = pick_device()
print(f"[whisper-stt] loading model {MODEL_SIZE} on {DEVICE}/{COMPUTE} …", flush=True)
MODEL = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE)
print("[whisper-stt] ready", flush=True)


def to_wav_16k(src: Path) -> Path:
    dst = src.with_suffix(".16k.wav")
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(src),
            "-ar",
            "16000",
            "-ac",
            "1",
            "-c:a",
            "pcm_s16le",
            str(dst),
        ],
        check=True,
        capture_output=True,
    )
    return dst


@app.get("/health")
def health():
    return jsonify({"ok": True, "model": MODEL_SIZE, "device": DEVICE})


@app.post("/transcribe")
def transcribe():
    if "audio" not in request.files:
        return jsonify({"error": "missing audio"}), 400
    f = request.files["audio"]
    if not f.filename:
        return jsonify({"error": "empty filename"}), 400

    suffix = Path(f.filename).suffix or ".webm"
    with tempfile.TemporaryDirectory() as tmp:
        raw = Path(tmp) / f"input{suffix}"
        f.save(raw)
        try:
            wav = to_wav_16k(raw)
        except subprocess.CalledProcessError as err:
            msg = (err.stderr or b"")[:200].decode("utf-8", "ignore")
            return jsonify({"error": f"ffmpeg failed: {msg}"}), 400

        segments, info = MODEL.transcribe(
            str(wav),
            language="en",
            task="transcribe",
            beam_size=5,
            best_of=5,
            patience=1.0,
            vad_filter=True,
            vad_parameters={
                "min_silence_duration_ms": 500,
                "speech_pad_ms": 200,
            },
            condition_on_previous_text=False,
            without_timestamps=True,
            temperature=0.0,
        )
        parts = [seg.text.strip() for seg in segments if seg.text and seg.text.strip()]
        text = " ".join(parts).strip()
        while "  " in text:
            text = text.replace("  ", " ")
        return jsonify(
            {
                "transcript": text,
                "provider": f"whisper:{MODEL_SIZE}",
                "language": getattr(info, "language", "en"),
            }
        )


if __name__ == "__main__":
    app.run(host=HOST, port=PORT, threaded=True)
