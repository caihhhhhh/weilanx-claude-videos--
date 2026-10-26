import {describe, expect, it} from 'vitest';
import {videoFormat, VIDEO_FORMATS} from '../../src/library/video-formats';

describe('video format presets', () => {
  it('has the exact canvas ratios', () => {
    expect(videoFormat('portrait-9x16').w / videoFormat('portrait-9x16').h).toBe(9 / 16);
    expect(videoFormat('portrait-3x4').w / videoFormat('portrait-3x4').h).toBe(3 / 4);
    expect(videoFormat('landscape-16x9').w / videoFormat('landscape-16x9').h).toBe(16 / 9);
  });
  it('keeps subtitles, stage and margins within canvas', () => {
    for (const name of Object.keys(VIDEO_FORMATS) as (keyof typeof VIDEO_FORMATS)[]) {
      const l = videoFormat(name);
      expect(l.stage.top + l.stage.h).toBeLessThanOrEqual(l.h);
      expect(l.subY).toBeLessThan(l.h - l.safe.bottom + 100); // subtitle baseline may overlap safe region for templates
      expect(l.chapter.y).toBeGreaterThanOrEqual(0);
      expect(l.safe.left + l.safe.right).toBeLessThan(l.w);
    }
  });
  it('returns a copy so callers cannot mutate global presets', () => {
    const a = videoFormat('portrait-9x16');
    a.stage.top = 0;
    expect(videoFormat('portrait-9x16').stage.top).toBe(270);
  });
});
