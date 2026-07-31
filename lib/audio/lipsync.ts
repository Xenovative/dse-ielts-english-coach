/**
 * Derive a 0–1 mouth-open amount from a Web Audio AnalyserNode.
 * Uses time-domain RMS for jaw motion + a light mid-band boost for consonants.
 */
export function mouthOpenFromAnalyser(
  analyser: AnalyserNode,
  timeBuf: Uint8Array,
  freqBuf: Uint8Array,
): number {
  // Cast needed across TS lib DOM / ArrayBufferView variance.
  analyser.getByteTimeDomainData(timeBuf as unknown as Uint8Array<ArrayBuffer>);
  analyser.getByteFrequencyData(freqBuf as unknown as Uint8Array<ArrayBuffer>);

  let sumSq = 0;
  for (let i = 0; i < timeBuf.length; i++) {
    const v = (timeBuf[i]! - 128) / 128;
    sumSq += v * v;
  }
  const rms = Math.sqrt(sumSq / timeBuf.length);

  const midStart = Math.floor(freqBuf.length * 0.12);
  const midEnd = Math.floor(freqBuf.length * 0.45);
  let mid = 0;
  let n = 0;
  for (let i = midStart; i < midEnd; i++) {
    mid += freqBuf[i]!;
    n += 1;
  }
  const midNorm = n ? mid / (n * 255) : 0;

  const level = Math.min(1, rms * 4.2 + midNorm * 0.55);
  if (level < 0.04) return 0;
  return Math.min(1, Math.pow(level, 0.72));
}

export function createAnalyser(ctx: AudioContext): AnalyserNode {
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.55;
  return analyser;
}
