/* =====================================================================
   GAME CONTENT. Owned by the GAME DESIGN / STORY agent.
   Two currencies:
   - café coins (tips): café upgrades + decor (catalog.ts).
   - Mocha's PAY (home.wallet): home, konbini, savings jar. ~25-60 a day early.
   ===================================================================== */
import type {
  ChapterDef, DishDef, FurnitureId, IngredientDef, KonbiniGoodDef, RegularDef, Reward, SeasonEventDef, SnackDef,
} from '../types';

/* ---------- Hoshi Mart: ingredients (pay) ---------- */
export const INGREDIENTS: IngredientDef[] = [
  { id: 'rice', name: 'Rice', price: 6 },
  { id: 'flour', name: 'Flour', price: 4 },
  { id: 'honey', name: 'Honey', price: 5 },
  { id: 'curry_roux', name: 'Curry roux', price: 8 },
  { id: 'noodles', name: 'Ramen noodles', price: 6 },
  { id: 'miso', name: 'Miso paste', price: 5 },
  { id: 'bread', name: 'Bread', price: 4 },
  { id: 'veggies', name: 'Veggies', price: 5 },
  { id: 'tofu', name: 'Tofu', price: 4 },
  { id: 'milk', name: 'Milk', price: 4 },
  { id: 'egg', name: 'Eggs', price: 4 },
  { id: 'strawberry', name: 'Strawberries', price: 7 },
];

/* ---------- Hoshi Mart: ready snacks (eaten at once) ---------- */
export const SNACKS: SnackDef[] = [
  { id: 'onigiri_pack', name: 'Onigiri pack', price: 5, energy: 15, happiness: 4 },
  { id: 'melon_bread', name: 'Melon bread', price: 4, energy: 10, happiness: 6 },
  { id: 'dango', name: 'Dango', price: 4, energy: 8, happiness: 8 },
  { id: 'canned_coffee', name: 'Canned coffee', price: 3, energy: 15, happiness: 2 },
  { id: 'pudding', name: 'Pudding', price: 5, energy: 5, happiness: 10 },
  { id: 'ice_cream', name: 'Ice cream', price: 5, energy: 3, happiness: 12 },
];

/* ---------- home recipes ---------- */
export const DISHES: DishDef[] = [
  { id: 'honey_toast', name: 'Honey toast', ingredients: { bread: 1, honey: 1 }, energy: 15, happiness: 8 },
  { id: 'onigiri', name: 'Onigiri', ingredients: { rice: 1 }, energy: 20, happiness: 6, unlock: { chapter: 4 } },
  { id: 'miso_soup', name: 'Miso soup', ingredients: { miso: 1, tofu: 1, veggies: 1 }, energy: 20, happiness: 12, unlock: { chapter: 6 } },
  { id: 'omurice', name: 'Omurice', ingredients: { rice: 1, egg: 2 }, energy: 30, happiness: 12, unlock: { chapter: 9 } },
  { id: 'curry_rice', name: 'Curry rice', ingredients: { rice: 1, curry_roux: 1, veggies: 1 }, energy: 40, happiness: 14, unlock: { chapter: 11 } },
  { id: 'ramen', name: 'Ramen', ingredients: { noodles: 1, egg: 1, veggies: 1, miso: 1 }, energy: 35, happiness: 16, unlock: { chapter: 13 } },
  { id: 'strawberry_parfait', name: 'Strawberry parfait', ingredients: { strawberry: 2, milk: 1 }, energy: 10, happiness: 25, unlock: { chapter: 16 } },
  { id: 'pancakes', name: 'Fluffy pancakes', ingredients: { flour: 1, egg: 1, milk: 1, honey: 1 }, energy: 25, happiness: 18, unlock: { chapter: 17 } },
];

/* ---------- Hoshi Mart: little goods ---------- */
export const GOODS: KonbiniGoodDef[] = [
  { id: 'postcard', name: 'Postcard for Mom', price: 6, happiness: 6 },
  { id: 'magazine', name: 'Comic magazine', price: 8, happiness: 5 },
  { id: 'flowers', name: 'Little bouquet', price: 12, happiness: 10 },
  { id: 'book', name: 'Storybook', price: 25, happiness: 8 },
];

/* ---------- regulars (friends) ---------- */
export const REGULARS: RegularDef[] = [
  {
    id: 'maple', name: 'Maple', firstDay: 2, favourite: 'latte',
    look: { species: 'fox', color: '#e39a62', accessory: 'beret', accentColor: '#7d8fb3', hat: 'none' },
    intro: 'A latte, please! I paint here in the mornings.',
    gifts: [
      { at: 1, reward: { kind: 'book' }, line: 'This book made me smile. For you!' },
      { at: 2, reward: { kind: 'homeItem', id: 'poster_coffee' }, line: 'I drew a poster of your latte!' },
      { at: 4, reward: { kind: 'decor', id: 'painting_latte' }, line: 'A painting for the café wall!' },
      { at: 6, reward: { kind: 'pay', amount: 30 }, line: 'I sold a painting! Treat yourself.' },
    ],
  },
  {
    id: 'cotton', name: 'Cotton', firstDay: 4, favourite: 'cocoa',
    look: { species: 'sheep', color: '#fff6ea', color2: '#e9d2bd', accessory: 'scarf', accentColor: '#e58a94', hat: 'none' },
    intro: 'Something warm, dear? I knit by the window.',
    gifts: [
      { at: 1, reward: { kind: 'ingredient', id: 'milk', amount: 2 }, line: 'Fresh milk from the farm!' },
      { at: 2, reward: { kind: 'homeItem', id: 'quilt_hearts' }, line: 'I knitted you a heart quilt.' },
      { at: 4, reward: { kind: 'homeItem', id: 'curtains_lace' }, line: 'Lace curtains, made with love.' },
    ],
  },
  {
    id: 'fern', name: 'Fern', firstDay: 6, favourite: 'matcha',
    look: { species: 'frog', color: '#a9cf9f', accessory: 'scarf', accentColor: '#e9b949', hat: 'none' },
    intro: 'Ribbit! Matcha is my favourite green thing.',
    gifts: [
      { at: 1, reward: { kind: 'homeItem', id: 'plant_big' }, line: 'A leafy friend for your home!' },
      { at: 2, reward: { kind: 'furniture', id: 'armchair' }, line: 'My old armchair. Very squishy!' },
      { at: 4, reward: { kind: 'ingredient', id: 'veggies', amount: 3 }, line: 'Veggies from my pond garden!' },
      { at: 6, reward: { kind: 'decor', id: 'lamp' }, line: 'A lamp for cozy café evenings.' },
    ],
  },
  {
    id: 'pip', name: 'Pip', firstDay: 8, favourite: 'cookie',
    look: { species: 'duck', color: '#f6e3a1', color2: '#eda65a', accessory: 'scarf', accentColor: '#8fb39b', hat: 'none' },
    intro: 'Quack! Do you have cookies? Big ones?',
    gifts: [
      { at: 1, reward: { kind: 'ingredient', id: 'egg', amount: 3 }, line: 'Eggs! Not mine, I promise.' },
      { at: 2, reward: { kind: 'recipe', id: 'pancakes' }, line: 'Grandma\'s pancake secret. Shh!' },
      { at: 4, reward: { kind: 'homeItem', id: 'fishbowl' }, line: 'A little fish to say hi to.' },
    ],
  },
  {
    id: 'crumb', name: 'Crumb', firstDay: 10, favourite: 'cake',
    look: { species: 'mouse', color: '#cfc3b8', accessory: 'bow', accentColor: '#e58a94', hat: 'none' },
    intro: 'Just a tiny slice of cake... and a big book.',
    gifts: [
      { at: 1, reward: { kind: 'book' }, line: 'A mystery book! Don\'t peek at the end.' },
      { at: 2, reward: { kind: 'book' }, line: 'Another one! Books are like cake.' },
      { at: 4, reward: { kind: 'homeItem', id: 'lamp_moon' }, line: 'A moon lamp for night reading.' },
      { at: 6, reward: { kind: 'decor', id: 'clock_cat' }, line: 'A cat clock. It doesn\'t scare me!' },
    ],
  },
  {
    id: 'pom', name: 'Pom', firstDay: 13, favourite: 'cocoa',
    look: { species: 'bunny', color: '#f2d3d6', accessory: 'bow', accentColor: '#9db3d6', hat: 'none' },
    intro: 'Hi hi! Cocoa with extra marshmallows?',
    gifts: [
      { at: 1, reward: { kind: 'ingredient', id: 'strawberry', amount: 3 }, line: 'Strawberries! I picked the best ones.' },
      { at: 2, reward: { kind: 'homeItem', id: 'rug_cloud' }, line: 'A cloud rug. Soft like me!' },
      { at: 4, reward: { kind: 'decor', id: 'heart_rug' }, line: 'A heart rug for the café!' },
      { at: 6, reward: { kind: 'homeItem', id: 'kitten' }, line: 'This kitten needs a kind home.' },
    ],
  },
  {
    id: 'button', name: 'Button', firstDay: 999, favourite: 'latte',
    look: { species: 'cat', color: '#b9b3c9', accessory: 'apron', accentColor: '#8fb39b', apronColor: '#8fb39b', hat: 'none' },
    intro: 'Hello, partner!',
    gifts: [], // Button's gifts come through chapters
  },
];

/* ---------- chapters: the long gentle story ---------- */
export const CHAPTERS: ChapterDef[] = [
  { id: 1, title: 'First Tray', goal: 'Serve 5 guests', done: `Five happy guests on your very first tray! Button's old phone is yours.`,
    check: { kind: 'served', count: 5 },
    story: 'phone_gift', rewards: [{ kind: 'furniture', id: 'phone' }] },
  { id: 2, title: 'Hello, Mom', goal: 'Call Mom on the phone', done: `Mom's voice made the little flat feel warm.`,
    check: { kind: 'calls', count: 1 },
    story: 'first_call', rewards: [{ kind: 'pay', amount: 15 }] },
  { id: 3, title: 'Settling In', goal: 'Work until day 3', done: `Mocha knows every table by heart now.`,
    check: { kind: 'day', day: 3 },
    story: 'konbini_open', rewards: [{ kind: 'pay', amount: 20 }], unlocks: { konbini: true } },
  { id: 4, title: 'Shopping Basket', goal: 'Shop at Hoshi Mart', done: `A full basket! Now there's always something to cook.`,
    check: { kind: 'konbini', count: 1 },
    rewards: [{ kind: 'recipe', id: 'onigiri' }, { kind: 'ingredient', id: 'rice', amount: 2 }] },
  { id: 5, title: 'Dinner Time', goal: 'Cook 3 meals', done: `Three dinners, all by himself. A chef needs a table!`,
    check: { kind: 'cooked', count: 3 },
    story: 'table_time', rewards: [{ kind: 'furniture', id: 'dining_table' }] },
  { id: 6, title: 'A Friendly Face', goal: 'Befriend Maple', done: `Maple saves you the seat by the window now.`,
    check: { kind: 'friend', id: 'maple', level: 1 },
    rewards: [{ kind: 'recipe', id: 'miso_soup' }, { kind: 'tips', amount: 30 }] },
  { id: 7, title: 'Busy Paws', goal: 'Serve 40 guests', done: `Forty guests! Yarn Street loves its little café.`,
    check: { kind: 'served', count: 40 },
    rewards: [{ kind: 'tips', amount: 40 }, { kind: 'decor', id: 'string_lights' }] },
  { id: 8, title: 'Coin by Coin', goal: 'Save 100 in the jar', done: `The jar is getting heavy. Coin by coin!`,
    check: { kind: 'savings', amount: 100 },
    rewards: [{ kind: 'homeItem', id: 'photo_mom' }, { kind: 'pay', amount: 20 }] },
  { id: 9, title: 'Comfy Spot', goal: 'Get an armchair (Fern\'s friend)', done: `The squishiest seat in the world. Time to read!`,
    check: { kind: 'furniture', id: 'armchair' },
    story: 'cozy_read', rewards: [{ kind: 'book' }, { kind: 'recipe', id: 'omurice' }] },
  { id: 10, title: 'Make a Wish', goal: 'Catch a shooting star', done: `Mocha wished that everyone stays happy.`,
    check: { kind: 'wishes', count: 1 },
    story: 'star_wish', rewards: [{ kind: 'homeItem', id: 'quilt_stars' }] },
  { id: 11, title: 'Home Sweet Home', goal: 'Own 4 home items', done: `The tiny flat really feels like home now.`,
    check: { kind: 'homeItems', count: 4 },
    rewards: [{ kind: 'recipe', id: 'curry_rice' }, { kind: 'pay', amount: 30 }] },
  { id: 12, title: 'The Bicycle', goal: 'Buy the bicycle', done: `The bicycle is Mocha's! Mom's hills are just a ride away.`,
    check: { kind: 'dream' },
    story: 'dream', rewards: [{ kind: 'pay', amount: 30 }, { kind: 'happiness', amount: 20 }] },
  { id: 13, title: 'A New Dream', goal: 'Become good friends with Cotton', done: `Cotton is a dear friend now, and winter is coming...`,
    check: { kind: 'friend', id: 'cotton', level: 3 },
    story: 'fire_dream', rewards: [{ kind: 'recipe', id: 'ramen' }] },
  { id: 14, title: 'Before Winter', goal: 'Save 200 for a fireplace', done: `Crackle, crackle. Let the snow come!`,
    check: { kind: 'furniture', id: 'fireplace' },
    story: 'fireplace', rewards: [{ kind: 'happiness', amount: 15 }, { kind: 'ingredient', id: 'milk', amount: 2 }] },
  { id: 15, title: 'Story Time', goal: 'Befriend Crumb', done: `Crumb found Mocha's books a proper home.`,
    check: { kind: 'friend', id: 'crumb', level: 2 },
    story: 'mom_dream', rewards: [{ kind: 'furniture', id: 'bookshelf' }, { kind: 'book' }] },
  { id: 16, title: 'Mom\'s Big Visit', goal: 'Call Mom 15 times', done: `Mom finally saw the café. She cried a little (happy tears).`,
    check: { kind: 'calls', count: 15 },
    story: 'mom_visits_cafe', rewards: [{ kind: 'recipe', id: 'strawberry_parfait' }, { kind: 'decor', id: 'flower_vase' }] },
  { id: 17, title: 'Radio Nights', goal: 'Serve 200 guests', done: `Two hundred guests! Soft songs for slow evenings.`,
    check: { kind: 'served', count: 200 },
    story: 'party_dream', rewards: [{ kind: 'furniture', id: 'radio' }, { kind: 'recipe', id: 'pancakes' }] },
  { id: 18, title: 'Friends\' Party', goal: 'Befriend Pom', done: `Everyone squeezed into the tiny flat. Best party ever!`,
    check: { kind: 'friend', id: 'pom', level: 2 },
    story: 'friends_party', rewards: [{ kind: 'decor', id: 'paper_lanterns' }, { kind: 'happiness', amount: 20 }] },
  { id: 19, title: 'Starry Sky', goal: 'Catch 5 shooting stars', done: `Five wishes caught. The sky knows Mocha's name.`,
    check: { kind: 'wishes', count: 5 },
    rewards: [{ kind: 'homeItem', id: 'curtains_stars' }, { kind: 'pay', amount: 50 }] },
  { id: 20, title: 'Always Cozy', goal: 'Work until day 60', done: `Sixty days of coffee, friends and honey toast.`,
    check: { kind: 'day', day: 60 },
    story: 'forever_cozy', rewards: [{ kind: 'pay', amount: 100 }, { kind: 'tips', amount: 100 }] },
];

/* ---------- real-calendar seasons ---------- */
export const SEASON_EVENTS: SeasonEventDef[] = [
  { id: 'new_year', name: 'New Year', month: 1, day: 1, leadDays: 7,
    blurb: 'Mochi, wishes and a fresh new year!', gift: { kind: 'pay', amount: 20 } },
  { id: 'valentine', name: 'Valentine\'s Day', month: 2, day: 14, leadDays: 10,
    blurb: 'Pink hearts and sweet treats for friends.', gift: { kind: 'ingredient', id: 'strawberry', amount: 2 } },
  { id: 'spring', name: 'Spring Blossom', month: 3, day: 20, theme: 'spring', leadDays: 20,
    blurb: 'Sakura lattes and pink petals!', gift: { kind: 'tips', amount: 20 } },
  { id: 'summer', name: 'Summer Days', month: 6, day: 21, theme: 'summer', leadDays: 14,
    blurb: 'Sunny days and cold ice cream!', gift: { kind: 'pay', amount: 15 } },
  { id: 'tanabata', name: 'Tanabata', month: 7, day: 7, leadDays: 10,
    blurb: 'Write a wish and hang it on bamboo.', gift: { kind: 'happiness', amount: 15 } },
  { id: 'halloween', name: 'Halloween', month: 10, day: 31, theme: 'halloween', leadDays: 30,
    blurb: 'Pumpkin lattes and friendly ghosts!', gift: { kind: 'ingredient', id: 'flour', amount: 2 } },
  { id: 'christmas', name: 'Christmas', month: 12, day: 25, theme: 'christmas', leadDays: 25,
    blurb: 'Snowy lattes and twinkly lights!', gift: { kind: 'book' } },
];

/** How each furniture piece is described in popups / the calendar of unlocks. */
export const FURNITURE_INFO: Record<FurnitureId, { name: string; blurb: string }> = {
  phone: { name: 'Old phone', blurb: 'Button\'s old phone. Call Mom any evening!' },
  dining_table: { name: 'Dining table', blurb: 'A little round table for warm dinners.' },
  armchair: { name: 'Armchair', blurb: 'Fern\'s squishy chair. Perfect for reading.' },
  fireplace: { name: 'Fireplace', blurb: 'A crackly wood stove for snowy nights.' },
  bookshelf: { name: 'Bookshelf', blurb: 'A home for all your storybooks.' },
  radio: { name: 'Radio', blurb: 'Soft songs for slow evenings.' },
};
/** Starting state of a brand-new home (super basic). */
export const START_HOME = { furniture: [] as FurnitureId[], recipes: ['honey_toast'] as const, books: 0, pantry: { bread: 2, honey: 2, melon_bread: 1 } };
/** Numbers the engines use.
 *  Pay/day = payBase + served*payPerServed + stars*payPerStar + min(day, payPerDayMax).
 *  Day 1 (~6 served, 2 stars): ~33. Day 10 (~12 served, 3 stars): ~58. Later ~70-80. */
export const ECONOMY = {
  payBase: 14, payPerServed: 3, payPerStar: 4, payPerDayMax: 15,
  friendPointsServed: 1, friendPointsFavourite: 2, pointsPerLevel: 5,
  shootingStarChancePerMinute: 0.25, wishReward: [{ kind: 'pay', amount: 10 }, { kind: 'happiness', amount: 5 }] as Reward[],
};
