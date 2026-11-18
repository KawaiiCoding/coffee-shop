/* =====================================================================
   SHARED CONTRACT. Art, engine and UI all build against this file.
   Do not change a name or signature here without updating every user.
   ===================================================================== */

/* ---------- ids ---------- */
export type ThemeId = 'everyday' | 'spring' | 'christmas' | 'halloween';
export type Species = 'bear' | 'cat' | 'bunny' | 'fox' | 'sheep' | 'duck' | 'frog' | 'mouse' | 'ghost';
export type Mood = 'calm' | 'happy' | 'cross' | 'sleepy';
export type Accessory = 'none' | 'bow' | 'flower' | 'scarf' | 'beret' | 'apron';
export type HatKind = 'none' | 'santa' | 'witch' | 'flowercrown';
export type Pose = 'stand' | 'sit' | 'walk';

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
  | 'serve' | 'coin' | 'angry' | 'buy' | 'dayEnd' | 'error';

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
  kind: 'coin' | 'heart' | 'angry' | 'sparkle' | 'text';
  x: number; y: number;
  age: number; life: number;  // seconds
  text?: string;
}

export interface DayStats {
  day: number; served: number; lost: number; tips: number; stars: 0 | 1 | 2 | 3;
}

export interface Settings {
  music: boolean; sfx: boolean; musicVolume: number; sfxVolume: number; hints: boolean;
}

export interface Progress {
  version: 1;
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
  mode: 'title' | 'playing' | 'paused' | 'dayEnd';
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
  | { type: 'decor' };                // placed decor or theme changed (renderer should rebuild static layer)

export interface GameApi {
  readonly state: GameState;
  readonly catalog: {
    menu: MenuItemDef[]; upgrades: UpgradeDef[]; decor: DecorDef[]; themes: ThemeDef[];
  };
  subscribe(fn: (e: GameEvent) => void): () => void;
  update(dt: number): void;            // advance simulation; called every frame by main.ts
  startDay(): void;                    // from title or dayEnd
  quitToTitle(): void;                 // abandon the current day and go back to the title screen
  pause(): void;
  resume(): void;
  tapScene(x: number, y: number): void; // scene coords (viewBox units)
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
}
