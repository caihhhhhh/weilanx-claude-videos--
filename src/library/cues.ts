export interface WordTiming {
  /** Token text as returned by the ASR / forced aligner. */
  text: string;
  start: number;
  end: number;
}
export interface Cue {
  i: number;
  start: number;
  end: number;
  text: string;
  /** Optional timestamped tokens for precise keyword animation. */
  words?: WordTiming[];
}

export const FPS = 30;
export type CueAt = (frame: number) => Cue | null;

/** Generate deterministic timings; word timings take precedence when supplied. */
export function makeCues(raw: Cue[], voiceSeconds: number) {
  const CUES = raw;
  const DURATION = Math.ceil(voiceSeconds * FPS);

  const get = (n: number) => {
    const c = CUES[n - 1];
    if (!c) throw new Error(`cue ${n} does not exist`);
    return c;
  };

  const cf = (n: number) => Math.round(get(n).start * FPS);
  const ce = (n: number) => Math.round(get(n).end * FPS);

  /** Locate phrase onset using aligned token timestamps, falling back to legacy character interpolation. */
  const cw = (n: number, phrase: string) => {
    const c = get(n);
    const idx = c.text.indexOf(phrase);
    if (idx < 0) throw new Error(`"${phrase}" not in cue ${n}: ${c.text}`);
    if (c.words?.length) {
      const normalizedText = c.words.map(w => w.text).join('');
      const at = normalizedText.indexOf(phrase);
      if (at >= 0) {
        let pos = 0;
        for (const word of c.words) {
          if (pos + word.text.length > at) return Math.round(word.start * FPS);
          pos += word.text.length;
        }
      }
    }
    return Math.round((c.start + ((c.end - c.start) * idx) / c.text.length) * FPS);
  };

  /** Current active subtitle; holds the preceding cue for at most 0.4s in pauses. */
  const cueAt: CueAt = (frame) => {
    const t = frame / FPS;
    for (let k = 0; k < CUES.length; k++) {
      const c = CUES[k];
      const next = CUES[k + 1];
      const hold = Math.min(c.end + 0.4, next ? next.start : Infinity);
      if (t >= c.start && t < hold) return c;
    }
    return null;
  };

  return {CUES, DURATION, cf, ce, cw, cueAt};
}
