import {describe, expect, it} from 'vitest';
import {makeCues} from '../../src/library/cues';

describe('word-level alignment fallback', () => {
  const cue = {i: 1, start: 0, end: 4, text: '讲解机械原理'};
  it('keeps legacy behavior without words', () => {
    const t = makeCues([cue], 4);
    expect(t.cw(1, '机械')).toBe(Math.round(4 * (2 / 6) * 30));
    expect(t.cf(1)).toBe(0);
  });
  it('takes real aligned word onset when present', () => {
    const words = [
      {text: '讲解', start: 0.1, end: 0.8},
      {text: '机械', start: 1.4, end: 2.1},
      {text: '原理', start: 2.5, end: 3.1},
    ];
    expect(makeCues([{...cue, words}], 4).cw(1, '机械')).toBe(42);
    expect(makeCues([{...cue, words}], 4).cw(1, '原理')).toBe(75);
  });
  it('falls back when tokens and subtitle spellings do not align', () => {
    const words = [{text: '讲', start: 1, end: 2}];
    expect(makeCues([{...cue, words}], 4).cw(1, '原理')).toBe(Math.round(4 * (4 / 6) * 30));
  });
  it('still throws on nonexistent cue or phrase', () => {
    const t = makeCues([cue], 4);
    expect(() => t.cw(2, '原理')).toThrow();
    expect(() => t.cw(1, '不存在')).toThrow();
  });
});
