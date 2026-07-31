"""
Generate spoken listening audio from paper transcripts (edge-tts).
Replaces sine/echo placeholders with exam-style dialogue speech.

Usage: .venv-tts/bin/python seed/generate-listening-audio.py
"""
from __future__ import annotations

import asyncio
import json
import re
import subprocess
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
AUDIO_DIR = ROOT / "public" / "audio"
BANK = ROOT / "seed" / "content" / "bank-generated.json"
HAND = ROOT / "seed" / "content" / "listening.json"
VOICE_A = "en-US-JennyNeural"
VOICE_B = "en-US-GuyNeural"


def clean_line(line: str) -> tuple[str | None, str]:
    """Return (voice_key, spoken_text). voice_key is A or B for dialogue."""
    line = line.strip()
    if not line:
        return None, ""
    m = re.match(
        r"^(Narrator|Teacher|Student(?:\s*[ABC])?|Organiser|Organizer|Participant|"
        r"Interviewer|Expert|Speaker\s*[AB])\s*:\s*(.*)$",
        line,
        re.I,
    )
    if m:
        role = m.group(1).lower()
        text = m.group(2).strip()
        # Alternate “host/authority” vs “student/participant” voices
        if any(
            role.startswith(x)
            for x in ("student", "participant", "speaker b")
        ):
            return "B", text
        return "A", text
    return "A", line


def transcript_to_segments(transcript: str) -> list[tuple[str, str]]:
    segments: list[tuple[str, str]] = []
    # Prefer newline dialogue; else split on em-dash turns
    if "\n" in transcript:
        parts = transcript.split("\n")
    else:
        parts = re.split(r"\s+[—–-]\s+", transcript)

    for part in parts:
        voice, text = clean_line(part)
        if voice and text:
            segments.append((voice, text))
    if not segments and transcript.strip():
        segments.append(("A", transcript.strip()))
    return segments


async def synth_segment(text: str, voice: str, out: Path) -> None:
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(str(out))


async def build_clip(transcript: str, mp3_path: Path) -> float:
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    segments = transcript_to_segments(transcript)
    tmp_parts: list[Path] = []
    try:
        for i, (who, text) in enumerate(segments):
            part = AUDIO_DIR / f"_part_{mp3_path.stem}_{i}.mp3"
            voice = VOICE_A if who == "A" else VOICE_B
            await synth_segment(text, voice, part)
            tmp_parts.append(part)

        if not tmp_parts:
            raise RuntimeError(f"No speech segments for {mp3_path.name}")

        # Concat with ffmpeg; convert to wav sibling
        list_file = AUDIO_DIR / f"_concat_{mp3_path.stem}.txt"
        list_file.write_text("".join(f"file '{p.name}'\n" for p in tmp_parts))
        wav_path = mp3_path.with_suffix(".wav")
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                str(list_file),
                "-ar",
                "44100",
                "-ac",
                "2",
                "-c:a",
                "libmp3lame",
                "-b:a",
                "192k",
                str(mp3_path),
            ],
            cwd=str(AUDIO_DIR),
            check=True,
            capture_output=True,
        )
        subprocess.run(
            ["ffmpeg", "-y", "-i", str(mp3_path), "-ar", "44100", "-ac", "2", str(wav_path)],
            check=True,
            capture_output=True,
        )
        probe = subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=nw=1:nk=1",
                str(mp3_path),
            ],
            check=True,
            capture_output=True,
            text=True,
        )
        return float(probe.stdout.strip() or "0")
    finally:
        for p in tmp_parts:
            p.unlink(missing_ok=True)
        (AUDIO_DIR / f"_concat_{mp3_path.stem}.txt").unlink(missing_ok=True)


def collect_jobs() -> list[tuple[str, str]]:
    jobs: list[tuple[str, str]] = []
    for path in (BANK, HAND):
        data = json.loads(path.read_text())
        papers = data if isinstance(data, list) else [data]
        for paper in papers:
            if paper.get("skill") != "listening":
                continue
            for asset in paper.get("audioAssets") or []:
                url = asset.get("url") or ""
                transcript = asset.get("transcript") or ""
                if url.startswith("/audio/") and transcript:
                    jobs.append((url.removeprefix("/audio/"), transcript))
    # de-dupe by filename
    seen: set[str] = set()
    unique: list[tuple[str, str]] = []
    for name, tr in jobs:
        if name in seen:
            continue
        seen.add(name)
        unique.append((name, tr))
    return unique


async def main() -> None:
    jobs = collect_jobs()
    print(f"Generating {len(jobs)} listening clips with edge-tts…")
    for name, transcript in jobs:
        out = AUDIO_DIR / name
        if not name.endswith(".mp3"):
            out = out.with_suffix(".mp3")
        dur = await build_clip(transcript, out)
        print(f"  ✓ {out.name} ({dur:.1f}s)")
    # remove old test artifacts
    for junk in AUDIO_DIR.glob("_tts-test*"):
        junk.unlink(missing_ok=True)
    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
