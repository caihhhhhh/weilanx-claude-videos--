/** Opt-in canvas presets; use with ShowConfig w/h/stage/subY/chapter. */
export type VideoFormat = 'portrait-9x16' | 'portrait-3x4' | 'landscape-16x9';
export interface LayoutPreset {
  w: number;
  h: number;
  stage: {top: number; h: number};
  subY: number;
  chapter: {y: number; align: 'center' | 'left'};
  /** Insets are design hints, not guarantees of any specific platform UI. */
  safe: {top: number; right: number; bottom: number; left: number};
}
export const VIDEO_FORMATS: Record<VideoFormat, Readonly<LayoutPreset>> = {
  'portrait-9x16': {
    w: 1080, h: 1920, stage: {top: 270, h: 1100}, subY: 1420,
    chapter: {y: 150, align: 'center'},
    safe: {top: 200, right: 140, bottom: 360, left: 90},
  },
  'portrait-3x4': {
    w: 1080, h: 1440, stage: {top: 210, h: 790}, subY: 1140,
    chapter: {y: 110, align: 'center'},
    safe: {top: 120, right: 90, bottom: 200, left: 90},
  },
  'landscape-16x9': {
    w: 1920, h: 1080, stage: {top: 165, h: 660}, subY: 900,
    chapter: {y: 80, align: 'left'},
    safe: {top: 80, right: 120, bottom: 90, left: 120},
  },
};
export function videoFormat(name: VideoFormat): LayoutPreset {
  const f = VIDEO_FORMATS[name];
  return {
    ...f,
    stage: {...f.stage},
    chapter: {...f.chapter},
    safe: {...f.safe},
  };
}
