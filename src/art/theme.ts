import type { ThemeId } from '../types';

/** Palette tokens for a theme, also used by the UI for colouring. */
export interface ThemePalette {
  wall: string; floor: string; trim: string; accent: string; accent2: string;
  ink: string; paper: string; text: string;
}

/** Full art-side theme data (superset of ThemePalette). */
export interface ThemeArt {
  wall: string; wallDot: string; dado: string; trim: string;
  floorA: string; floorB: string;
  door: string; doorWin: string; rug: string[]; bunt: string[];
  accent: string; accent2: string; paper: string; text: string;
  curtain: string; stitch: string;
}

export const TH: Record<ThemeId, ThemeArt> = {
  everyday: {
    wall: '#f8dccd', wallDot: '#f2c6b4', dado: '#eebfae', trim: '#b57a5e',
    floorA: '#e6bf92', floorB: '#d8ab7c', door: '#8fc3a7', doorWin: '#bfe6f5',
    rug: ['#f4a9a8', '#fde6c4', '#8fc3a7', '#fde6c4'], bunt: ['#f4a9a8', '#f6cf6b', '#8fc3a7', '#9dbbe6'],
    accent: '#c4506a', accent2: '#8fc3a7', paper: '#fffaf2', text: '#5a3a33',
    curtain: '#f6cf6b', stitch: '#ffffff',
  },
  spring: {
    wall: '#fde6ea', wallDot: '#f7c9d3', dado: '#f6c1cc', trim: '#b8697a',
    floorA: '#ecd0aa', floorB: '#dfbd92', door: '#a9d6a0', doorWin: '#fbd3df',
    rug: ['#f6a9bd', '#fff2f4', '#a9d6a0', '#fff2f4'], bunt: ['#f6a9bd', '#fff2f4', '#a9d6a0', '#f9d77e'],
    accent: '#d9607e', accent2: '#a9d6a0', paper: '#fffafb', text: '#5e3540',
    curtain: '#a9d6a0', stitch: '#ffffff',
  },
  christmas: {
    wall: '#f3e1d0', wallDot: '#ead0ba', dado: '#c9584f', trim: '#8a4a3a',
    floorA: '#d9a877', floorB: '#c99665', door: '#4f8f68', doorWin: '#35507f',
    rug: ['#c9584f', '#fff6ea', '#4f8f68', '#fff6ea'], bunt: ['#c9584f', '#4f8f68', '#f6cf6b', '#fff6ea'],
    accent: '#c9584f', accent2: '#4f8f68', paper: '#fffaf2', text: '#5a3330',
    curtain: '#c9584f', stitch: '#fff6ea',
  },
  halloween: {
    wall: '#7a5f96', wallDot: '#8c72a8', dado: '#4c3766', trim: '#2f2145',
    floorA: '#b98463', floorB: '#a77353', door: '#f08a3c', doorWin: '#3a2a66',
    rug: ['#f08a3c', '#3b2a55', '#9b6fc4', '#3b2a55'], bunt: ['#f08a3c', '#2f2145', '#9b6fc4', '#b6d65a'],
    accent: '#e0782e', accent2: '#9b6fc4', paper: '#f8f1fc', text: '#3b2a55',
    curtain: '#9b6fc4', stitch: '#d9c6ef',
  },
};

export function palette(theme: ThemeId): ThemePalette {
  const t = TH[theme] ?? TH.everyday;
  return {
    wall: t.wall, floor: t.floorA, trim: t.trim, accent: t.accent, accent2: t.accent2,
    ink: '#6b4a3a', paper: t.paper, text: t.text,
  };
}

/** Hat a staff member wears in this theme. */
export const THEME_HAT: Record<ThemeId, 'none' | 'santa' | 'witch' | 'flowercrown'> = {
  everyday: 'none', spring: 'flowercrown', christmas: 'santa', halloween: 'witch',
};
