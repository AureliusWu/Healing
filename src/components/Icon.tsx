import type { CSSProperties } from 'react';

const paths: Record<string, string> = {
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm13 0a3 3 0 1 0-6 0 3 3 0 0 0 6 0',
  'eye-off': 'm3 3 18 18M10 5h2c6 0 10 7 10 7s-1 2-3 4M6 6c-3 2-4 6-4 6s4 7 10 7c2 0 3-1 4-1M9 9a4 4 0 0 0 6 6',
  expand: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
  shrink: 'M3 8h5V3m8 0v5h5M8 21v-5H3m13 5v-5h5',
  rotate: 'M16 5a8 8 0 0 0-12 5M4 5v5h5m-1 9a8 8 0 0 0 12-5m0 5v-5h-5m-6-7h6v10H9Z',
  leaf: 'M19 4C10 2 3 7 5 15c4 4 11 4 14-11ZM5 20l9-10',
  arrow: 'M4 12h15m-6-6 6 6-6 6',
  book: 'M3 4h6c2 0 3 1 3 3v14c0-2-1-3-3-3H3Zm18 0h-6c-2 0-3 1-3 3v14c0-2 1-3 3-3h6Z',
  save: 'M4 3h13l4 4v14H3V3Zm3 0v6h9V3M7 21v-8h10v8',
  gear: 'M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1Zm6 9a3 3 0 1 0-6 0 3 3 0 0 0 6 0',
  users: 'M12 21v-3c0-3-2-5-5-5s-5 2-5 5v3m10-8c4 0 8 1 8 5v3M10 6a3 3 0 1 0-6 0 3 3 0 0 0 6 0m9 1a3 3 0 1 0-6 0 3 3 0 0 0 6 0',
  history: 'M3 10a9 9 0 1 1 2 8M3 3v7h7m2-4v6l4 2',
  close: 'm6 6 12 12M6 18 18 6',
  home: 'm3 10 9-7 9 7v11h-6v-7H9v7H3Z',
  sound: 'M3 9h4l5-5v16l-5-5H3Zm13-1c2 2 2 6 0 8m3-11c4 4 4 10 0 14',
  muted: 'M3 9h4l5-5v16l-5-5H3Zm13 0 6 6m-6 0 6-6',
  play: 'm7 4 14 8-14 8Z',
  pause: 'M7 4v16M17 4v16',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  upload: 'M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5',
  check: 'm4 12 5 5 11-11',
  sun: 'M12 3v2m0 14v2M3 12h2m14 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2m-3 5a4 4 0 1 0-8 0 4 4 0 0 0 8 0',
};
export function Icon({ name, size = 20, style }: { name: string; size?: number; style?: CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}><path d={paths[name] ?? paths.leaf} /></svg>;
}
