/* Random guest looks and the fixed staff looks. */
import type { Accessory, CharacterLook, HatKind, Species, ThemeId } from '../types';

const BASE_SPECIES: Species[] = ['bear', 'cat', 'bunny', 'fox', 'sheep', 'duck', 'frog', 'mouse'];

const COLORS: Record<Species, string[]> = {
  bear: ['#c89b74', '#e3bfa0', '#a8805f', '#f0d2b4'],
  cat: ['#f2c9a0', '#d9d2c8', '#9c8b82', '#f4a96b', '#fbf3ea'],
  bunny: ['#f7e6ea', '#e9d4c4', '#c9b8b0', '#fbf6f2'],
  fox: ['#e8935a', '#d97b45', '#f0b07a'],
  sheep: ['#fbf6ee', '#efe6da', '#f4e1e6'],
  duck: ['#fbe7a1', '#f6f2e8', '#f8d77a'],
  frog: ['#a8d5a2', '#8cc7a0', '#bfe0a8'],
  mouse: ['#cfc6cf', '#e7dcd6', '#bdb3ad'],
  ghost: ['#f6f4ff', '#eef0ff'],
};
const COLOR2: Partial<Record<Species, string[]>> = {
  sheep: ['#e7cdb7', '#d9b8a0', '#8d6f62'],
  duck: ['#f2a65a', '#f19a4a'],
};
const ACCENTS = ['#e46f8f', '#7fb8d8', '#f2c14e', '#9b7fd1', '#7fc8a9', '#e8784e', '#c4506a'];
const ACCESSORIES: Accessory[] = ['none', 'bow', 'flower', 'scarf', 'beret'];

const pick = <T,>(rng: () => number, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length) % arr.length];

export function randomLook(rng: () => number, theme: ThemeId): CharacterLook {
  const pool = theme === 'halloween' ? [...BASE_SPECIES, 'ghost' as Species, 'ghost' as Species] : BASE_SPECIES;
  const species = pick(rng, pool);
  let hat: HatKind = 'none';
  const hatRoll = rng();
  if (theme === 'christmas' && hatRoll < 0.3) hat = 'santa';
  else if (theme === 'halloween' && hatRoll < 0.3) hat = 'witch';
  else if (theme === 'spring' && hatRoll < 0.3) hat = 'flowercrown';
  const look: CharacterLook = {
    species,
    color: pick(rng, COLORS[species]),
    accessory: pick(rng, ACCESSORIES),
    accentColor: pick(rng, ACCENTS),
    hat,
  };
  const c2 = COLOR2[species];
  if (c2) look.color2 = pick(rng, c2);
  return look;
}

export const WAITER_LOOK: CharacterLook = {
  species: 'bear', color: '#d7a77e', accessory: 'apron', accentColor: '#c4506a', apronColor: '#fffaf2', hat: 'none',
};
export const BARISTA_LOOK: CharacterLook = {
  species: 'cat', color: '#f4d6dc', accessory: 'apron', accentColor: '#8fc3a7', apronColor: '#8fc3a7', hat: 'none',
};

/** A regular friend's fixed look, dressed up for the current festival (seasonal hat if they wear none). */
export function regularLook(look: CharacterLook, theme: ThemeId): CharacterLook {
  if (look.hat !== 'none') return { ...look };
  const hat: HatKind = theme === 'christmas' ? 'santa' : theme === 'halloween' ? 'witch' : theme === 'spring' ? 'flowercrown' : 'none';
  return { ...look, hat };
}
