/* =====================================================================
   ART API. Every function returns an SVG markup string (no <svg> wrapper
   unless the name ends in Svg). Coordinates are in scene viewBox units.
   Implementation is split over the files in this folder; this module
   re-exports the public surface with the contract's exact signatures.
   ===================================================================== */
import type { DecorId, MenuItemId, StoryArtId, ThemeId } from '../types';
import { storyArtA } from './story-a';
import { storyArtB, bike } from './story-b';
/** Mocha's bicycle (his first dream), parked at home once he has bought it. Centre between the wheels at (0,0). */
export const dreamBike = (): string => `<g stroke-linecap="round" stroke-linejoin="round">${bike(0, 0, 0.72, '#8fd3c1')}</g>`;
export { mess, placeGhost } from './mess';
export { homeSceneDefs, homeBack, homeFront, savingsJar, homeSpotIcon, bathDoor, shootingStar, calendarArt, bedBlanket, HOME_WINDOW } from './home-room';
export { furniture, furnitureFront, furnitureSvg } from './home-furniture';
export { dish, product, dishSvg, productSvg } from './food';
export { konbiniDefs, konbiniBack, konbiniCounterFront, konbiniFront, CLERK_LOOK, konbiniExteriorSvg } from './konbini-art';
import { storyArtC } from './story-c';
export { stickerSvg, lockedStickerSvg, journalCoverSvg, secretReaction, newspaperOnFloor, gazetteMastheadSvg, weatherSvg } from './stickers';
export { homeItem, homeItemSvg } from './home-items';
import { decorA } from './decor-a';
import { decorB } from './decor-b';
export { musicNotes } from './decor-b';
export { upgradeSvg } from './upgrades';
import { item as itemImpl } from './items';

export type { ThemePalette } from './theme';
export { palette } from './theme';
export { sceneDefs, roomBack, roomFront } from './room';
export { character } from './character';
export { seat, table, counterBack, counterFront, brewIndicator } from './furniture';
export { item, itemCoaster, bubble, tapMarker, selectRing, effect } from './items';
export { iconSvg } from './icons';
export type { IconName } from './icons';
export { characterSvg, titleArtSvg } from './title';

const SLOT_A: DecorId[] = ['bunting', 'string_lights', 'paper_lanterns', 'yarn_shelf', 'painting_latte', 'clock_cat'];
const CEILING: DecorId[] = ['bunting', 'string_lights', 'paper_lanterns'];
const WALL: DecorId[] = ['yarn_shelf', 'painting_latte', 'clock_cat'];
const BACK: DecorId[] = ['record_player', 'bookshelf', 'piano', 'cat_bed'];
const CORNER: DecorId[] = ['plant', 'lamp', 'flower_vase'];

/** The top 56 units are under the UI bar, so ceiling decor hangs a little lower than its anchor. */
const CEILING_DROP = 28;

const raw = (id: DecorId, theme: ThemeId): string =>
  `<g stroke-linecap="round" stroke-linejoin="round">${SLOT_A.includes(id) ? decorA(id, theme) : decorB(id, theme)}</g>`;

/** A decor item drawn relative to its slot anchor (see DECOR_ANCHOR in layout.ts):
 *  the caller translates to the anchor; this markup has the anchor at (0,0). */
export function decor(id: DecorId, theme: ThemeId): string {
  const s = raw(id, theme);
  return CEILING.includes(id) ? `<g transform="translate(0,${CEILING_DROP})">${s}</g>` : s;
}

/* ---------- standalone <svg> icons for the UI (menus, cards, buttons) ---------- */
const wrap = (inner: string, vb: string, size: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${vb}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

export function itemSvg(id: MenuItemId, size: number): string {
  return wrap(`<g stroke-linecap="round" stroke-linejoin="round">${itemImpl(id)}</g>`, '-14 -15 28 28', size);
}

export function decorSvg(id: DecorId, theme: ThemeId, size: number): string {
  const vb = CEILING.includes(id) ? '-4 0 188 76'
    : WALL.includes(id) ? '-35 -33 70 66'
    : BACK.includes(id) ? '-50 -102 100 106'
    : CORNER.includes(id) ? '-30 -86 60 90'
    : '-64 -30 128 60';
  return wrap(raw(id, theme), vb, size);
}

const STORY_A: StoryArtId[] = ['ad', 'walk_to_cafe', 'interview', 'hired', 'messy_shop'];
const STORY_B: StoryArtId[] = ['shop_ready', 'payday', 'home_evening', 'dream_bike', 'dream_mom'];
/** Story panel illustration (standalone svg, viewBox 0 0 320 240; UI scales it with CSS). */
export function storyArtSvg(id: StoryArtId): string {
  const inner = STORY_A.includes(id) ? storyArtA(id) : STORY_B.includes(id) ? storyArtB(id) : storyArtC(id);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="320" height="240" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="${id.replace(/_/g, ' ')}">${inner}</svg>`;
}
