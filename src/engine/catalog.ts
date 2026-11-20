/* Static game data: menu, upgrades, decor, themes. */
import type {
  DecorDef, DecorId, DecorSlot, MenuItemDef, MenuItemId, ThemeDef, ThemeId, UpgradeDef, UpgradeId,
} from '../types';
import { autoTheme } from './calendar';

export const MENU: MenuItemDef[] = [
  { id: 'latte', name: 'Latte', price: 6, brewSeconds: 2.5 },
  { id: 'cocoa', name: 'Hot Cocoa', price: 7, brewSeconds: 3, unlockedBy: 'menu_cocoa' },
  { id: 'matcha', name: 'Matcha Latte', price: 8, brewSeconds: 3.5, unlockedBy: 'menu_matcha' },
  { id: 'cake', name: 'Strawberry Cake', price: 9, brewSeconds: 0, unlockedBy: 'menu_cake' },
  { id: 'cookie', name: 'Cookie', price: 5, brewSeconds: 0, unlockedBy: 'menu_cookie' },
  { id: 'gingerbread_latte', name: 'Gingerbread Latte', price: 12, brewSeconds: 4, festival: 'christmas' },
  { id: 'pumpkin_latte', name: 'Pumpkin Spice Latte', price: 12, brewSeconds: 4, festival: 'halloween' },
  { id: 'sakura_latte', name: 'Sakura Latte', price: 11, brewSeconds: 4, festival: 'spring' },
];

export const UPGRADES: UpgradeDef[] = [
  { id: 'tables', name: 'More Tables', description: 'Adds another table for guests.', costs: [60, 120, 200] },
  { id: 'machine', name: 'Espresso Machine', description: 'Drinks brew faster.', costs: [50, 100, 180] },
  { id: 'tray', name: 'Big Tray', description: 'Carry 3 items at once.', costs: [80] },
  { id: 'cushions', name: 'Comfy Cushions', description: 'Guests wait more patiently.', costs: [40, 80, 140] },
  { id: 'shoes', name: 'Quick Shoes', description: 'Your waiter walks faster.', costs: [50, 110] },
  { id: 'tipjar', name: 'Tip Jar', description: 'Tips are collected automatically.', costs: [120] },
  { id: 'menu_cocoa', name: 'Hot Cocoa', description: 'Add hot cocoa to the menu.', costs: [30] },
  { id: 'menu_matcha', name: 'Matcha Latte', description: 'Add matcha lattes to the menu.', costs: [60] },
  { id: 'menu_cake', name: 'Strawberry Cake', description: 'Add cake to the menu.', costs: [80] },
  { id: 'menu_cookie', name: 'Cookies', description: 'Add cookies to the menu.', costs: [40] },
  { id: 'table_style', name: 'Table Style', description: 'Wooden, then teacup tables.', costs: [70, 140] },
];

export const DECOR: DecorDef[] = [
  { id: 'bunting', slot: 'ceiling', name: 'Crochet Bunting', cost: 30, charm: 1 },
  { id: 'string_lights', slot: 'ceiling', name: 'String Lights', cost: 120, charm: 3 },
  { id: 'paper_lanterns', slot: 'ceiling', name: 'Paper Lanterns', cost: 180, charm: 4 },
  { id: 'yarn_shelf', slot: 'wall', name: 'Yarn Shelf', cost: 30, charm: 1 },
  { id: 'painting_latte', slot: 'wall', name: 'Latte Painting', cost: 90, charm: 2 },
  { id: 'clock_cat', slot: 'wall', name: 'Cat Clock', cost: 150, charm: 3 },
  { id: 'record_player', slot: 'back', name: 'Record Player', cost: 60, charm: 2 },
  { id: 'bookshelf', slot: 'back', name: 'Bookshelf', cost: 140, charm: 3 },
  { id: 'cat_bed', slot: 'back', name: 'Cat Bed', cost: 200, charm: 4 },
  { id: 'piano', slot: 'back', name: 'Little Piano', cost: 260, charm: 5 },
  { id: 'plant', slot: 'corner', name: 'Potted Plant', cost: 30, charm: 1 },
  { id: 'lamp', slot: 'corner', name: 'Floor Lamp', cost: 80, charm: 2 },
  { id: 'flower_vase', slot: 'corner', name: 'Flower Vase', cost: 110, charm: 3 },
  { id: 'round_rug', slot: 'rug', name: 'Round Rug', cost: 30, charm: 1 },
  { id: 'stripe_rug', slot: 'rug', name: 'Striped Rug', cost: 70, charm: 2 },
  { id: 'heart_rug', slot: 'rug', name: 'Heart Rug', cost: 100, charm: 3 },
];

export const THEMES: ThemeDef[] = [
  { id: 'everyday', name: 'Everyday', months: [1, 2, 9, 11] },
  { id: 'spring', name: 'Spring Blossom', months: [3, 4, 5], specialItem: 'sakura_latte' },
  { id: 'summer', name: 'Summer Breeze', months: [6, 7, 8] },
  { id: 'halloween', name: 'Halloween', months: [10], specialItem: 'pumpkin_latte' },
  { id: 'christmas', name: 'Christmas', months: [12], specialItem: 'gingerbread_latte' },
];

export const STARTER_DECOR: Record<DecorSlot, DecorId> = {
  ceiling: 'bunting', wall: 'yarn_shelf', back: 'record_player', corner: 'plant', rug: 'round_rug',
};

export const menuDef = (id: MenuItemId): MenuItemDef => MENU.find((m) => m.id === id)!;
export const upgradeDef = (id: UpgradeId): UpgradeDef | undefined => UPGRADES.find((u) => u.id === id);
export const decorDef = (id: DecorId): DecorDef | undefined => DECOR.find((d) => d.id === id);
export const themeDef = (id: ThemeId): ThemeDef => THEMES.find((t) => t.id === id) ?? THEMES[0];
export const isFood = (id: MenuItemId): boolean => menuDef(id).brewSeconds === 0;

/** 'auto' resolves by the real-world calendar (festival lead-up first, else season). */
export function resolveTheme(theme: ThemeId | 'auto', date: Date): ThemeId {
  if (theme !== 'auto') return theme;
  return autoTheme(date);
}

/** Items guests can order now (unlocked, non-festival) plus the theme's special. */
export function availableMenu(theme: ThemeId, level: (id: UpgradeId) => number): MenuItemId[] {
  const out = MENU.filter((m) => !m.festival && (!m.unlockedBy || level(m.unlockedBy) > 0)).map((m) => m.id);
  const special = themeDef(theme).specialItem;
  if (special) out.push(special);
  return out;
}

export function pickOrder(rng: () => number, theme: ThemeId, level: (id: UpgradeId) => number): MenuItemId {
  const special = themeDef(theme).specialItem;
  if (special && rng() < 0.3) return special;
  const regular = availableMenu(theme, level).filter((id) => id !== special);
  return regular[Math.floor(rng() * regular.length) % regular.length];
}

export function computeStars(served: number, lost: number): 0 | 1 | 2 | 3 {
  if (lost === 0 && served >= 4) return 3;
  if (served + lost > 0 && served / (served + lost) >= 0.75) return 2;
  if (served >= 1) return 1;
  return 0;
}
