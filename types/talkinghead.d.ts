declare module "@met4citizen/talkinghead" {
  export class TalkingHead {
    constructor(node: HTMLElement, opt?: Record<string, unknown>);
    lipsync: Record<string, unknown>;
    audioCtx: AudioContext;
    isSpeaking: boolean;
    isAudioPlaying: boolean;
    showAvatar(
      avatar: Record<string, unknown>,
      onprogress?: ((ev: ProgressEvent) => void) | null,
    ): Promise<void>;
    speakAudio(
      audio: Record<string, unknown>,
      opt?: Record<string, unknown> | null,
      onsubtitles?: ((...args: unknown[]) => void) | null,
    ): void;
    stopSpeaking(): void;
    setMixerGain(speech: number, background?: number | null, fadeSecs?: number): void;
    setSlowdownRate(k: number): void;
    getSlowdownRate(): number;
    dispose(): void;
    stop(): void;
  }
}

declare module "@met4citizen/talkinghead/modules/lipsync-en.mjs" {
  export class LipsyncEn {
    preProcessText(s: string): string;
    wordsToVisemes(word: string): {
      visemes: string[];
      times: number[];
      durations: number[];
    };
  }
}
