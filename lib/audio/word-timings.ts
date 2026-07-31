/**
 * Estimate word timings for TalkingHead speakAudio from plain text + duration.
 * Times/durations are in milliseconds.
 */
export function estimateWordTimings(
  text: string,
  durationMs: number,
): { words: string[]; wtimes: number[]; wdurations: number[] } {
  const words = text
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
  if (!words.length || durationMs <= 0) {
    return { words: [], wtimes: [], wdurations: [] };
  }

  const totalChars = words.reduce((sum, w) => sum + Math.max(1, w.length), 0);
  let t = 0;
  const wtimes: number[] = [];
  const wdurations: number[] = [];

  for (const word of words) {
    const share = Math.max(1, word.length) / totalChars;
    const dur = Math.max(60, share * durationMs);
    wtimes.push(t);
    wdurations.push(dur);
    t += dur;
  }

  const scale = durationMs / Math.max(1, t);
  return {
    words,
    wtimes: wtimes.map((x) => x * scale),
    wdurations: wdurations.map((x) => x * scale),
  };
}

/**
 * Build crude Oculus viseme pulses from audio energy (no transcript needed).
 * Used for listening papers where the transcript is withheld from the client.
 */
export function estimateVisemesFromAudio(
  buffer: AudioBuffer,
): { visemes: string[]; vtimes: number[]; vdurations: number[] } {
  const channel = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const windowMs = 80;
  const hopMs = 60;
  const windowSamples = Math.max(1, Math.floor((windowMs / 1000) * sampleRate));
  const hopSamples = Math.max(1, Math.floor((hopMs / 1000) * sampleRate));

  const visemes: string[] = [];
  const vtimes: number[] = [];
  const vdurations: number[] = [];

  let peak = 0;
  for (let i = 0; i < channel.length; i += hopSamples) {
    let sum = 0;
    const end = Math.min(channel.length, i + windowSamples);
    for (let j = i; j < end; j++) sum += channel[j] * channel[j];
    const rms = Math.sqrt(sum / Math.max(1, end - i));
    if (rms > peak) peak = rms;
  }
  const threshold = Math.max(0.02, peak * 0.18);

  const cycle = ["aa", "E", "I", "O", "U", "DD", "nn"] as const;
  let cycleIdx = 0;

  for (let i = 0; i < channel.length; i += hopSamples) {
    let sum = 0;
    const end = Math.min(channel.length, i + windowSamples);
    for (let j = i; j < end; j++) sum += channel[j] * channel[j];
    const rms = Math.sqrt(sum / Math.max(1, end - i));
    if (rms < threshold) continue;

    const tMs = (i / sampleRate) * 1000;
    const level = Math.min(1, rms / Math.max(peak, 1e-6));
    const dur = 50 + level * 70;
    visemes.push(cycle[cycleIdx % cycle.length]!);
    vtimes.push(tMs);
    vdurations.push(dur);
    cycleIdx += 1;
  }

  return { visemes, vtimes, vdurations };
}
