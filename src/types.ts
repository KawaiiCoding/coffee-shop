/* =====================================================================
   SHARED CONTRACT. Art, engine and UI all build against this file.
   Do not change a name or signature here without updating every user.
   ===================================================================== */

/* ---------- ids ---------- */
export type ThemeId = 'everyday' | 'spring' | 'summer' | 'christmas' | 'halloween';
export type Species = 'bear' | 'cat' | 'bunny' | 'fox' | 'sheep' | 'duck' | 'frog' | 'mouse' | 'ghost';
export type Mood = 'calm' | 'happy' | 'cross' | 'sleepy';
export type Accessory = 'none' | 'bow' | 'flower' | 'scarf' | 'beret' | 'apron';
export type HatKind = 'none' | 'santa' | 'witch' | 'flowercrown';
/** 'lie' = lying on its back, head to the LEFT, feet at (0,0) is the body's centre on the mattress (used for sleeping). */
export type Pose = 'stand' | 'sit' | 'walk' | 'lie';
/** Things a character can hold in its paws. */
export type HeldProp = 'towel' | 'phone' | 'book' | 'bowl' | 'spatula' | 'basket' | 'gift' | 'chopsticks';

/** Things guests order. Drinks brew at the machine; food is taken from the display instantly. */
export type MenuItemId =
  | 'latte' | 'cocoa' | 'matcha' | 'cake' | 'cookie'
  | 'gingerbread_latte' | 'pumpkin_latte' | 'sakura_latte';

export type TableStyle = 'yarn' | 'wood' | 'teacup';

export type DecorSlot = 'ceiling' | 'wall' | 'back' | 'corner' | 'rug';
export type DecorId =
  // ceiling: full-width, hangs from top of wall
  | 'bunting' | 'string_lights' | 'paper_lanterns'
  // wall: small framed / shelf thing above the counter
  | 'yarn_shelf' | 'painting_latte' | 'clock_cat'
  // back: furniture standing against the back wall under the window
  | 'record_player' | 'bookshelf' | 'piano' | 'cat_bed'
  // corner: tall thin item right of the first table row
  | 'plant' | 'lamp' | 'flower_vase'
  // rug: flat, on the floor in the centre aisle, drawn under everything
  | 'round_rug' | 'heart_rug' | 'stripe_rug';

export type UpgradeId =
  | 'tables'      // level n => 3 + n tables (max level 3 => 6 tables)
  | 'machine'     // faster brewing
  | 'tray'        // level n => 2 + n items carried (max 1)
  | 'cushions'    // patience drains slower
  | 'shoes'       // waiter walks faster
  | 'tipjar'      // tips are collected automatically
  | 'menu_cocoa' | 'menu_matcha' | 'menu_cake' | 'menu_cookie'
  | 'table_style'; // level 0 yarn, 1 wood, 2 teacup (cosmetic)

export type SfxName =
  | 'tap' | 'bell' | 'seat' | 'order' | 'brew' | 'ding' | 'pickup'
  | 'serve' | 'coin' | 'angry' | 'buy' | 'dayEnd' | 'error'
  | 'page' | 'sweep' | 'pop' | 'place' | 'cook' | 'splash' | 'phone' | 'yawn' | 'jar'
  | 'chime' | 'register' | 'gift' | 'wish' | 'crackle' | 'eat' | 'door' | 'unlock'
  | 'irasshaimase' | 'arigato';       // konbini clerk voice lines (spoken with a Japanese system voice when available)

/* ---------- looks ---------- */
export interface CharacterLook {
  species: Species;
  color: string;           // main body colour
  color2?: string;         // secondary (duck beak/feet, sheep face)
  accessory: Accessory;
  accentColor: string;     // bow / flower / scarf / beret colour
  apronColor?: string;     // only used with accessory 'apron'
  hat: HatKind;
}

export interface DrawCharacterOpts {
  pose: Pose;
  mood: Mood;
  facing: 1 | -1;          // 1 = facing right, -1 = mirrored
  walkPhase?: number;      // 0..1 for a small bob/step while walking
  carrying?: MenuItemId[]; // waiter's tray (drawn held at side)
  holding?: HeldProp;      // a prop held in front (home actions, konbini basket, gifts)
  towel?: boolean;         // wrapped in a fluffy towel with a towel turban (just out of the bath)
}

/* ---------- catalogue data (owned by engine, displayed by UI) ---------- */
export interface MenuItemDef {
  id: MenuItemId; name: string; price: number;
  brewSeconds: number;     // 0 = food, ready instantly
  festival?: ThemeId;      // only on the menu during that theme
  unlockedBy?: UpgradeId;  // not on the menu until this upgrade is bought
}
export interface UpgradeDef {
  id: UpgradeId; name: string; description: string;
  costs: number[];         // cost of each level; length = max level
}
export interface DecorDef {
  id: DecorId; slot: DecorSlot; name: string; cost: number;
  charm: number;           // adds to café charm: +tips% and faster guest arrival
}
export interface ThemeDef {
  id: ThemeId; name: string;
  months: number[];        // 1-12, months when 'auto' picks this theme
  specialItem?: MenuItemId;
}

/* ---------- live game state (engine writes, renderer + UI read) ---------- */
export type GuestPhase =
  | 'entering'   // walking from off-screen to the door spot
  | 'door'       // waiting at door to be seated (patience drains)
  | 'toTable'    // walking to the table
  | 'reading'    // reading menu (short, no input)
  | 'ordering'   // shows order bubble, waits for waiter (patience drains)
  | 'waiting'    // order taken, waits for item (patience drains slower)
  | 'eating'     // item delivered
  | 'leaving';   // walking out (happy or cross)

export interface Guest {
  id: number;
  look: CharacterLook;
  phase: GuestPhase;
  table: number | null;    // table index
  x: number; y: number;    // scene coords (feet)
  patience: number;        // 0..1
  order: MenuItemId | null;
  timer: number;           // seconds in current phase
  mood: Mood;
  happy: boolean;          // set when leaving
}

export type WaiterTask =
  | { kind: 'take'; table: number }
  | { kind: 'serve'; table: number }
  | { kind: 'collect'; table: number }
  | { kind: 'pickup' };

export interface Waiter {
  x: number; y: number;
  facing: 1 | -1;
  tray: MenuItemId[];
  path: { x: number; y: number }[];  // remaining waypoints
  task: WaiterTask | null;           // performed on arrival
  queue: WaiterTask[];               // taps queued while walking
  walkPhase: number;
}

export interface TableState {
  index: number;
  unlocked: boolean;
  guestId: number | null;
  item: MenuItemId | null;  // item on the table while eating
  coins: number;            // uncollected tip
}

export interface CounterState {
  queue: MenuItemId[];                                  // orders waiting to brew
  brewing: { item: MenuItemId; progress: number } | null; // progress 0..1
  ready: MenuItemId[];                                  // on the counter, max 4
}

export interface Effect {
  id: number;
  kind: 'coin' | 'heart' | 'angry' | 'sparkle' | 'text' | 'broom';
  x: number; y: number;
  age: number; life: number;  // seconds
  text?: string;
}

export interface DayStats {
  day: number; served: number; lost: number; tips: number; stars: 0 | 1 | 2 | 3;
  /** The bear's pay for the day (goes to progress.home.wallet). 0 while the day runs. */
  salary: number;
}

/* ---------- story ---------- */
/** Story ids: the original five plus any id the story designer adds in src/story.ts STORIES. */
export type StoryId = 'intro' | 'cleanup_done' | 'payday' | 'home_intro' | 'dream' | (string & {});
/** One illustration per panel, drawn by art.storyArtSvg (viewBox 0 0 320 240). */
export type StoryArtId =
  | 'ad' | 'walk_to_cafe' | 'interview' | 'hired' | 'messy_shop'
  | 'shop_ready' | 'payday' | 'home_evening' | 'dream_bike' | 'dream_mom'
  // v3 illustrations (story-c.ts)
  | 'phone_gift' | 'regular_gift' | 'konbini_open' | 'shooting_star' | 'cooking_first'
  | 'fireplace_night' | 'mom_visits_cafe' | 'friends_party' | 'festival_coming' | 'new_dream';
export interface StoryPanel { art: StoryArtId; text: string; speaker?: string }

/* ---------- getting the café ready (mode 'cleanup') ---------- */
export type MessKind = 'dust' | 'cobweb' | 'box' | 'spill';
export type ChoreKind = MessKind | 'place_table' | 'place_decor';
export interface Chore {
  id: number;
  kind: ChoreKind;
  x: number; y: number;      // scene point (mess: its centre; place_table: the table floor point; place_decor: slot anchor)
  hp: number; maxHp: number; // taps left / taps needed (dust 2, cobweb 2, box 1, spill 3, place_* 1)
  table?: number;            // place_table: table index
  slot?: DecorSlot;          // place_decor: slot ('ceiling' bunting, 'back' record player)
  done: boolean;
}

/* ---------- guided first customer ---------- */
export type TutorialStepId = 'seat' | 'take' | 'pickup' | 'serve' | 'collect';
export interface TutorialState {
  active: boolean;
  step: number;              // index into TUTORIAL_STEPS (src/story.ts); === length when finished
  done: boolean[];           // one per step
}

/* ---------- the bear at home ---------- */
/** 'cook' opens the recipe picker (cookDish); 'eat' eats the cooked meal at the dining table; 'warm' sits by the fireplace;
 *  'calendar' opens the calendar (UI only, no bear action). */
export type HomeActionId = 'cook' | 'eat' | 'bath' | 'call_mom' | 'read' | 'save' | 'sleep' | 'warm' | 'calendar';
export type HomeSlot = 'wall' | 'window' | 'bed' | 'rug' | 'corner' | 'pet';
/** Big home furniture that is unlocked over time (gifts, chapters, purchases). The bed, bath door, stove and jar are always there. */
export type FurnitureId = 'phone' | 'armchair' | 'dining_table' | 'fireplace' | 'bookshelf' | 'radio';
export type HomeItemId =
  | 'poster_coffee' | 'photo_mom'          // wall
  | 'curtains_lace' | 'curtains_stars'     // window
  | 'quilt_hearts' | 'quilt_stars'         // bed (quilt on the bed)
  | 'rug_round' | 'rug_cloud'              // rug
  | 'plant_big' | 'lamp_moon'              // corner
  | 'fishbowl' | 'kitten';                 // pet
export interface HomeActionDef {
  id: HomeActionId; name: string; description: string;
  cost: number;              // paid from the wallet (save = amount moved into the savings jar)
  energy: number; happiness: number; // change applied when done (0..100 stats)
  oncePerDay: boolean;
  seconds: number;           // how long the bear does it (animation)
}
export interface HomeItemDef { id: HomeItemId; slot: HomeSlot; name: string; cost: number; happiness: number }
export interface HomeProgress {
  wallet: number;            // the bear's own money (salary), separate from café coins
  savings: number;           // in the savings jar
  dreamGoal: number;         // savings needed for the dream (a bicycle to visit Mom)
  dreamDone: boolean;
  energy: number;            // 0..100; high = waiter walks faster next day
  happiness: number;         // 0..100; high = bigger tips next day
  owned: HomeItemId[];
  placed: Record<HomeSlot, HomeItemId | null>;
  doneToday: HomeActionId[]; // reset when a work day starts
  furniture: FurnitureId[];  // unlocked big furniture
  pantry: Partial<Record<IngredientId | SnackId, number>>; // groceries at home
  meal: DishId | null;       // cooked dish waiting on the dining table (or stove if no table)
  books: number;             // books owned (reading needs armchair + a book)
  fireOn: boolean;           // fireplace lit
}
export interface HomeBear {
  x: number; y: number; facing: 1 | -1; walkPhase: number;
  path: { x: number; y: number }[];
  action: HomeActionId | null; // action being walked to / performed
  actionTimer: number;         // seconds left performing it (0 = walking or idle)
}

export interface Settings {
  music: boolean; sfx: boolean; musicVolume: number; sfxVolume: number; hints: boolean;
}

export interface Progress {
  version: 3;                         // v1/v2 saves are migrated
  chapter: number;                    // index into CHAPTERS of the current goal (=== length when all done)
  konbiniOpen: boolean;
  friendship: Partial<Record<RegularId, number>>;  // points; level = floor(points / 3)
  giftsReceived: string[];            // `${regularId}:${index}` or `event:${id}:${year}`
  recipes: DishId[];                  // known recipes
  stats: Stats;
  secrets: string[];                  // SecretDef ids discovered (journal pages unlocked), in discovery order
  secretCounters: Record<string, number>; // small counters secrets use (taps on the clock, nights by the fire...)
  newsReadDay: number;                // last progress.day whose newspaper was read (0 = never)
  newsSeen: string[];                 // ids of news pieces already printed (so stories don't repeat), capped ~200
  storySeen: StoryId[];
  cleanupDone: boolean;
  home: HomeProgress;
  coins: number;
  day: number;                        // next day to play, starts at 1
  totalServed: number;
  upgrades: Partial<Record<UpgradeId, number>>;
  ownedDecor: DecorId[];
  placed: Record<DecorSlot, DecorId | null>;
  theme: ThemeId | 'auto';
  settings: Settings;
  tutorialDone: boolean;
}

export interface GameState {
  /** title → story(intro) → cleanup → story(cleanup_done) → playing ⇄ paused → dayEnd → home → (sleep) playing ...
   *  'story' shows state.story panels over everything (UI). 'cleanup' = getting the café ready (chores).
   *  'home' = the bear's home (state.scene === 'home'). */
  mode: 'title' | 'story' | 'cleanup' | 'playing' | 'paused' | 'dayEnd' | 'home' | 'konbini';
  /** Which place the renderer draws. */
  scene: Scene;
  /** Konbini visit (scene 'konbini'). */
  konbini: KonbiniState;
  /** Popup waiting to be shown (gift / unlock / chapter done / wish / festival). UI shows it, dismissPopup() clears it. */
  popup: Popup | null;
  /** A shooting star crossing the home window (night only, rare). x,y scene coords, t 0..1 across. */
  shootingStar: { x: number; y: number; t: number } | null;
  /** Today's real-world calendar info. */
  calendar: CalendarInfo;
  /** A secret hotspot's little reaction animation playing right now (t 0..1). */
  reaction: { spot: SecretSpotId; t: number } | null;
  /** Story being shown (mode 'story'). panel = index into STORIES[id]. */
  story: { id: StoryId; panel: number } | null;
  /** Café chores during mode 'cleanup' (empty otherwise). */
  chores: Chore[];
  /** Guided first-customer tutorial (day 1). */
  tutorial: TutorialState;
  /** The bear at home (scene 'home'). */
  homeBear: HomeBear;
  progress: Progress;
  theme: ThemeId;                     // resolved theme in use
  dayTime: number;                    // seconds elapsed in current day
  dayLength: number;                  // seconds; door closes after this
  doorOpen: boolean;
  guests: Guest[];
  waiter: Waiter;
  counter: CounterState;
  tables: TableState[];               // always 6 entries; locked ones not drawn
  selectedGuest: number | null;       // guest at the door picked to be seated
  hint: { text: string; target: { x: number; y: number } | null } | null;
  effects: Effect[];
  dayStats: DayStats;                 // running stats of current day
  lastDay: DayStats | null;           // filled when a day ends
  time: number;                       // total seconds since start (for animation)
}

/* ---------- module APIs ---------- */
export type GameEvent =
  | { type: 'sfx'; name: SfxName }
  | { type: 'toast'; text: string }
  | { type: 'dayEnd'; stats: DayStats }
  | { type: 'progress' }              // coins/upgrades/decor/settings changed (UI should refresh menus)
  | { type: 'decor' }                 // placed decor or theme changed (renderer should rebuild static layer)
  | { type: 'scene'; scene: Scene }   // the place changed (music switches playlist)
  | { type: 'popup' }                 // state.popup was set
  | { type: 'sheet'; sheet: 'cook' | 'calendar' | 'news' | 'journal' }; // a home tap asks the UI to open the recipe picker / calendar / newspaper / journal

export interface GameApi {
  readonly state: GameState;
  readonly catalog: {
    menu: MenuItemDef[]; upgrades: UpgradeDef[]; decor: DecorDef[]; themes: ThemeDef[];
    homeActions: HomeActionDef[]; homeItems: HomeItemDef[];
    ingredients: IngredientDef[]; snacks: SnackDef[]; dishes: DishDef[]; goods: KonbiniGoodDef[];
    regulars: RegularDef[]; chapters: ChapterDef[]; seasonEvents: SeasonEventDef[]; secrets: SecretDef[];
  };
  /* story (mode 'story') */
  storyNext(): void;                   // next panel; after the last one the story's follow-up happens
  storySkip(): void;                   // jump to the end of the current story (same follow-up)
  /* home */
  goHome(): void;                      // from dayEnd → home (first time plays 'home_intro')
  homeAction(id: HomeActionId): boolean; // bear walks to the spot and does it; 'sleep' starts the next day
  buyHomeItem(id: HomeItemId): boolean; // pays from wallet and places it
  placeHomeItem(id: HomeItemId): void;
  homeBonus(): { speed: number; tips: number }; // multipliers applied in the café, for UI display
  canDoHomeAction(id: HomeActionId): { ok: boolean; reason?: string };
  /* v3 */
  goTo(scene: 'home' | 'konbini'): void;            // walk between home and the konbini (konbini only when unlocked)
  cookDish(id: DishId): boolean;                     // after 'cook' was chosen: uses pantry ingredients
  canCook(id: DishId): { ok: boolean; missing: Partial<Record<IngredientId, number>> };
  konbiniTake(id: KonbiniStockId): boolean;          // bear walks to the shelf and puts one in the basket
  konbiniRemove(id: KonbiniStockId): void;           // take one back out of the basket
  konbiniCheckout(): boolean;                        // pay at the counter from the wallet
  basketTotal(): number;
  dismissPopup(): void;
  currentGoal(): { chapter: number; title: string; goal: string; progress: number } | null;
  friendLevel(id: RegularId): number;
  setFire(on: boolean): void;
  eatSnack(id: SnackId): boolean;                    // eat a konbini snack from the pantry right away
  /** Mocha's journal: every secret in catalogue order, with found state. */
  journal(): { def: SecretDef; found: boolean; foundIndex: number }[];
  /** Today's newspaper (generated once per day, stable within the day). */
  newspaper(): NewsIssue;
  /** Mark today's paper as read (small happiness, counts for secrets). */
  readNewspaper(): void;
  subscribe(fn: (e: GameEvent) => void): () => void;
  update(dt: number): void;            // advance simulation; called every frame by main.ts
  startDay(): void;                    // from title, dayEnd or home. Routes through intro story / cleanup when not done yet.
  quitToTitle(): void;                 // abandon the current day and go back to the title screen
  pause(): void;
  resume(): void;
  tapScene(x: number, y: number): void; // scene coords (viewBox units); works in 'playing', 'cleanup' and 'home'
  buyUpgrade(id: UpgradeId): boolean;
  upgradeLevel(id: UpgradeId): number;
  buyDecor(id: DecorId): boolean;      // buys and places it
  placeDecor(id: DecorId): void;       // places an owned item in its slot
  setTheme(theme: ThemeId | 'auto'): void;
  setSettings(patch: Partial<Settings>): void;
  charm(): number;
  resetSave(): void;
}

export interface AudioApi {
  unlock(): void;                      // call on first user gesture
  playSfx(name: SfxName): void;
  applySettings(s: Settings): void;    // music on/off, volumes
  setScene(scene: Scene): void;        // switch playlist: 'tracks' (café), 'home', 'konbini' (falls back to café list)
}

/* =====================================================================
   v3: CALENDAR & SEASONS, FOOD & KONBINI, FRIENDS & PROGRESSION
   ===================================================================== */
export type Scene = 'cafe' | 'home' | 'konbini';

/* ---------- calendar (real-world date drives the season) ---------- */
export type SeasonEventId = 'new_year' | 'valentine' | 'spring' | 'tanabata' | 'summer' | 'halloween' | 'christmas';
export interface SeasonEventDef {
  id: SeasonEventId; name: string;
  month: number; day: number;          // date of the event (1-12, 1-31)
  theme?: ThemeId;                     // theme it brings (from `leadDays` before until a few days after)
  leadDays: number;                    // "coming soon" starts this many days before
  blurb: string;                       // one short cute line, e.g. "Snowy lattes and twinkly lights!"
  gift?: Reward;                       // given once on the day (when the player plays on/after it that year)
}
export interface CalendarInfo {
  date: { year: number; month: number; day: number; weekday: number };
  season: 'winter' | 'spring' | 'summer' | 'autumn';
  next: { id: SeasonEventId; name: string; daysLeft: number; blurb: string } | null;
  today: SeasonEventId | null;
}

/* ---------- food ---------- */
export type IngredientId = 'rice' | 'egg' | 'milk' | 'flour' | 'honey' | 'curry_roux' | 'noodles' | 'veggies' | 'tofu' | 'strawberry' | 'bread' | 'miso';
export type SnackId = 'melon_bread' | 'pudding' | 'canned_coffee' | 'dango' | 'onigiri_pack' | 'ice_cream';
export type DishId = 'honey_toast' | 'onigiri' | 'omurice' | 'curry_rice' | 'ramen' | 'pancakes' | 'miso_soup' | 'strawberry_parfait';
export interface IngredientDef { id: IngredientId; name: string; price: number }
export interface SnackDef { id: SnackId; name: string; price: number; energy: number; happiness: number }
export interface DishDef {
  id: DishId; name: string;
  ingredients: Partial<Record<IngredientId, number>>;
  energy: number; happiness: number;
  unlock?: { chapter: number };        // recipe appears from this chapter on
}
/** Non-food things sold at the konbini. */
export type KonbiniGoodId = 'book' | 'magazine' | 'flowers' | 'postcard';
export interface KonbiniGoodDef { id: KonbiniGoodId; name: string; price: number; happiness: number }
export type KonbiniStockId = IngredientId | SnackId | KonbiniGoodId;

/* ---------- friends (regular café guests) ---------- */
export type RegularId = 'maple' | 'cotton' | 'fern' | 'pip' | 'crumb' | 'pom' | 'button';
export type Reward =
  | { kind: 'pay'; amount: number }
  | { kind: 'tips'; amount: number }
  | { kind: 'furniture'; id: FurnitureId }
  | { kind: 'homeItem'; id: HomeItemId }
  | { kind: 'decor'; id: DecorId }
  | { kind: 'book' }
  | { kind: 'ingredient'; id: IngredientId; amount: number }
  | { kind: 'recipe'; id: DishId }
  | { kind: 'happiness'; amount: number };
export interface RegularDef {
  id: RegularId; name: string; look: CharacterLook;
  favourite: MenuItemId;               // serving it gives extra friendship
  intro: string;                       // short line the first time they come
  gifts: { at: number; reward: Reward; line: string }[]; // friendship level → gift + a short line
  firstDay: number;                    // day they start visiting
}

/* ---------- chapters (the long-term story goals) ---------- */
export type GoalCheck =
  | { kind: 'day'; day: number }
  | { kind: 'served'; count: number }            // total guests served
  | { kind: 'friend'; id: RegularId; level: number }
  | { kind: 'cooked'; count: number; dish?: DishId }
  | { kind: 'konbini'; count: number }           // konbini purchases (checkouts)
  | { kind: 'calls'; count: number }             // calls to Mom
  | { kind: 'savings'; amount: number }
  | { kind: 'dream' }                            // bicycle bought
  | { kind: 'furniture'; id: FurnitureId }
  | { kind: 'homeItems'; count: number }
  | { kind: 'wishes'; count: number };           // shooting stars caught
export interface ChapterDef {
  id: number; title: string;
  goal: string;                        // short, e.g. "Serve 10 guests"
  check: GoalCheck;
  story?: StoryId;                     // played when the chapter is completed
  rewards: Reward[];
  unlocks?: { konbini?: boolean };     // konbini becomes visitable
}
export interface Popup {
  kind: 'gift' | 'unlock' | 'chapter' | 'wish' | 'festival' | 'secret';
  title: string; text: string;
  from?: RegularId | 'button' | 'mom' | 'star';
  rewards: Reward[];
}
export interface Stats { cooked: number; konbini: number; calls: number; wishes: number; served: number; daysPlayed: number }

/* ---------- konbini live state ---------- */
export interface KonbiniState {
  basket: { id: KonbiniStockId; qty: number }[];
  bear: HomeBear;                      // reuses the walking bear struct (action unused)
}

/* =====================================================================
   v4: MOCHA'S JOURNAL — hidden discoveries
   ===================================================================== */
/** How a secret is found. The secrets engine checks these.
 *  tap: tapping a hidden hotspot (see SECRET_SPOTS in layout.ts) `times` times (in one visit/scene stay).
 *  event: a game moment happened `times` times in total (counted in secretCounters), optionally only when `when` matches. */
export type SecretTrigger =
  | { kind: 'tap'; spot: SecretSpotId; times: number; when?: SecretWhen }
  | { kind: 'event'; event: SecretEventId; times: number; when?: SecretWhen };
export interface SecretWhen {
  theme?: ThemeId; season?: 'winter' | 'spring' | 'summer' | 'autumn'; festivalToday?: SeasonEventId;
  fireOn?: boolean; minDay?: number; chapterAtLeast?: number; hourFrom?: number; hourTo?: number; // real-world local hour
  weekday?: number;                    // 0 Sunday .. 6 Saturday
}
export type SecretSpotId =
  // café
  | 'cafe_clock' | 'cafe_window' | 'cafe_record' | 'cafe_plant' | 'cafe_barista' | 'cafe_door_bell' | 'cafe_menu_board'
  // home
  | 'home_moon' | 'home_kettle' | 'home_duck_sign' | 'home_box' | 'home_pillow' | 'home_jar' | 'home_photo' | 'home_fireplace'
  // konbini
  | 'konbini_star_sign' | 'konbini_clerk' | 'konbini_coffee_machine' | 'konbini_umbrella';
export type SecretEventId =
  | 'served_perfect' | 'served_regular' | 'served_favourite' | 'lost_guest' | 'day_three_stars' | 'tutorial_done'
  | 'cooked' | 'cooked_all_recipes' | 'ate_snack' | 'bath' | 'called_mom' | 'read' | 'slept' | 'warmed'
  | 'read_newspaper' | 'konbini_checkout' | 'bought_sale_item' | 'konbini_big_basket' | 'wish' | 'festival_day' | 'bought_home_item' | 'bought_upgrade'
  | 'bought_decor' | 'record_toggle' | 'all_regulars_met' | 'saved_coin' | 'rich_wallet' | 'night_owl' | 'early_bird';
export interface SecretDef {
  id: string;
  title: string;                       // journal page title, e.g. "The winking clock"
  page: string;                        // Mocha's diary entry (2-3 short sentences, first person, cute)
  hint: string;                        // shown on the locked page, vague and playful ("Clocks have secrets too...")
  sticker: StickerId;                  // sticker on the page (art.stickerSvg)
  trigger: SecretTrigger;
  reward?: Reward;                     // small optional bonus
}
export type StickerId =
  | 'clock_wink' | 'moon_smile' | 'kettle_song' | 'duck_quack' | 'box_cat' | 'pillow_fort' | 'jar_sparkle' | 'mom_photo'
  | 'fire_heart' | 'star_wish' | 'record_note' | 'plant_sprout' | 'bell_ring' | 'menu_doodle' | 'button_paw'
  | 'konbini_star' | 'clerk_bow' | 'coffee_cup' | 'umbrella_frog' | 'perfect_day' | 'chef_hat' | 'snack_bag'
  | 'bubble_bath' | 'phone_heart' | 'book_stack' | 'sleepy_moon' | 'big_basket' | 'festival_lantern' | 'friend_circle'
  | 'night_owl' | 'early_bird' | 'golden_coin' | 'rainy_window' | 'sunflower' | 'snowflake' | 'pumpkin_grin';

/* =====================================================================
   v4: THE YARN STREET GAZETTE — a fresh newspaper every morning at home
   ===================================================================== */
export type Weather = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy' | 'starry';
export interface NewsArticle {
  id: string;                          // unique per piece (template id + variant), stored in newsSeen
  section: 'town' | 'cafe' | 'friends' | 'konbini' | 'season' | 'mystery' | 'mom' | 'fun';
  title: string; text: string;         // short and cute (title ≤ 40 chars, text ≤ 140 chars)
  sticker?: StickerId;                 // small picture
  regular?: RegularId;                 // shows that friend's portrait
}
export interface NewsIssue {
  day: number;                         // progress.day it was printed for
  dateLabel: string;                   // e.g. "Tue, Nov 18"
  weather: Weather; weatherLine: string;
  headline: NewsArticle;
  articles: NewsArticle[];             // 2-3 smaller pieces
  sale: { item: KonbiniStockId; percent: number; line: string } | null; // today's Hoshi Mart deal (applied at checkout)
  horoscope: string;                   // "Bears: a warm drink brings luck today."
  hint: string | null;                 // a cryptic nudge toward an undiscovered journal secret
  comic: { panels: [string, string, string] };  // tiny 3-panel joke as text captions
}
