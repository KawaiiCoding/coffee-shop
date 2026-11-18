/* =====================================================================
   SHARED SCENE LAYOUT. Portrait scene in viewBox units (0 0 360 720).
   The UI overlays a top bar over y 0..56 and a bottom nav over y 650..720,
   so nothing that must be tapped sits there.
   ===================================================================== */
import type { DecorSlot, FurnitureId, HomeActionId, HomeSlot } from './types';

export const SCENE = { w: 360, h: 720 };

/** Back wall spans y 0..WALL_BOTTOM; floor below it. */
export const WALL_BOTTOM = 250;

/** Door (art draws it here). Guests stand at DOOR_SPOT to wait. */
export const DOOR = { x: 28, y: 140, w: 64, h: 110 };
export const DOOR_SPOT = { x: 60, y: 285 };
/** Off-screen-ish point where guests enter/leave (through the door). */
export const ENTRANCE = { x: 60, y: 252 };

/** Window on the back wall. */
export const WINDOW = { x: 120, y: 66, w: 82, h: 84 };

/** Counter on the right. Barista stands behind it at BARISTA (feet).
 *  Counter front face spans x 222..360, y 228..300 (top surface at y ~228).
 *  Ready items sit on the counter top starting at READY_SPOTS. */
export const COUNTER = { x: 222, y: 228, w: 138, h: 72 };
export const BARISTA = { x: 318, y: 238 };
export const MACHINE = { x: 236, y: 186 };           // top-left of espresso machine on counter
export const READY_SPOTS = [
  { x: 286, y: 226 }, { x: 306, y: 226 }, { x: 326, y: 226 }, { x: 346, y: 226 }, // sitting ON the counter top (y 222..237)
];
/** Where the waiter stands to pick up from the counter. */
export const PICKUP_SPOT = { x: 250, y: 318 };

/** Six table slots, two columns with a centre aisle at x=180.
 *  (x,y) = floor point under the table centre (its shadow).
 *  The table top is ~70 wide, surface at about y-34.
 *  A seated guest is drawn with feet at (x + SEAT_OFFSET.x, y + SEAT_OFFSET.y),
 *  BEFORE the table, so the table hides their legs.
 *  The waiter stands at serve point to take/serve/collect. */
export const SEAT_OFFSET = { x: 0, y: -26 };
export const TABLES = [
  { x: 95,  y: 380, serve: { x: 150, y: 392 } },
  { x: 262, y: 392, serve: { x: 207, y: 402 } },
  { x: 95,  y: 498, serve: { x: 150, y: 510 } },
  { x: 262, y: 508, serve: { x: 207, y: 518 } },
  { x: 95,  y: 614, serve: { x: 150, y: 626 } },
  { x: 262, y: 622, serve: { x: 207, y: 632 } },
];
/** Tap radius around a table point that counts as tapping that table. */
export const TABLE_HIT_R = 56;

/** Waiter rests here when idle. Aisle x for walking routes. */
export const WAITER_HOME = { x: 180, y: 330 };
export const AISLE_X = 180;

/** Decor anchors. Art draws each DecorId relative to its slot's anchor:
 *  ceiling: anchor = top-left (0,0), item spans full width, max height 60.
 *  wall:    anchor = centre, max 60x56.
 *  back:    anchor = bottom-centre (stands on the floor line), max 84 wide x 96 tall.
 *  corner:  anchor = bottom-centre, max 40 wide x 80 tall.
 *  rug:     anchor = centre, flat ellipse-ish, max 120 x 46, drawn first on the floor. */
export const DECOR_ANCHOR: Record<DecorSlot, { x: number; y: number }> = {
  ceiling: { x: 0, y: 0 },
  wall: { x: 300, y: 104 },
  back: { x: 161, y: 252 },
  corner: { x: 338, y: 360 },
  rug: { x: 180, y: 470 },
};

/* =====================================================================
   DOOR QUEUE: up to 3 guests wait in a line; index 0 is at DOOR_SPOT.
   ===================================================================== */
export const DOOR_QUEUE = [
  { x: 60, y: 285 }, { x: 104, y: 292 }, { x: 146, y: 299 },
];

/* =====================================================================
   CLEANUP (mode 'cleanup'): where the mess starts. Engine places chores here.
   ===================================================================== */
export const MESS_SPOTS: { kind: 'dust' | 'cobweb' | 'box' | 'spill'; x: number; y: number }[] = [
  { kind: 'cobweb', x: 22, y: 78 },  { kind: 'cobweb', x: 236, y: 70 },
  { kind: 'dust', x: 70, y: 330 },   { kind: 'dust', x: 210, y: 440 },
  { kind: 'dust', x: 300, y: 560 },  { kind: 'dust', x: 120, y: 560 },
  { kind: 'box', x: 180, y: 380 },   { kind: 'box', x: 60, y: 450 },   { kind: 'box', x: 300, y: 440 },
  { kind: 'spill', x: 190, y: 600 },
];

/* =====================================================================
   HOME (scene 'home'): Mocha's small flat, same 360x720 portrait viewBox.
   Wall y 0..250, floor below. UI covers y 0..56 (top) and 640..720 (action dock).
   Fixed furniture art draws at these spots; the bear walks to `stand` to do the action.
   ===================================================================== */
export const HOME_WALL_BOTTOM = 250;
export const HOME_SPOTS: Record<HomeActionId, { x: number; y: number; stand: { x: number; y: number }; label: string }> = {
  bath:     { x: 36,  y: 250, stand: { x: 62,  y: 282 }, label: 'Bathroom door' },   // tall door, bottom-centre at (36,250), 56 wide x 120 tall
  save:     { x: 238, y: 132, stand: { x: 238, y: 280 }, label: 'Savings jar' },     // jar on a small shelf, jar centre; shelf under it at y ~150
  cook:     { x: 300, y: 250, stand: { x: 292, y: 286 }, label: 'Little stove' },    // stove bottom-centre at (300,250), ~84 wide x 76 tall
  calendar: { x: 200, y: 205, stand: { x: 200, y: 284 }, label: 'Calendar' },        // wall calendar centre, ~44 x 50, under the window (right of the fireplace)
  sleep:    { x: 96,  y: 452, stand: { x: 178, y: 452 }, label: 'Bed' },             // bed footprint centre-bottom (96,452), ~150 wide, headboard at the left
  eat:      { x: 240, y: 372, stand: { x: 206, y: 380 }, label: 'Dining table' },    // FURNITURE dining_table; bear sits on a stool at its left
  call_mom: { x: 300, y: 452, stand: { x: 256, y: 460 }, label: 'Phone' },           // FURNITURE phone: small round side table, right side
  warm:     { x: 62,  y: 614, stand: { x: 118, y: 612 }, label: 'Fireplace' },       // FURNITURE fireplace in the bottom-left corner, left of the armchair
  read:     { x: 262, y: 620, stand: { x: 262, y: 616 }, label: 'Armchair' },        // FURNITURE armchair bottom-centre; the bear sits in it
};
/** Where each unlockable furniture piece stands (bottom-centre on the floor). */
export const FURNITURE_SPOTS: Record<FurnitureId, { x: number; y: number }> = {
  dining_table: { x: 240, y: 372 },  // round table ~64 wide + one stool on the left; a cooked meal sits on top (y ~ -40)
  phone:        { x: 300, y: 452 },  // right side, small round table
  armchair:     { x: 262, y: 620 },
  fireplace:    { x: 62,  y: 614 },  // bottom-left corner, ~84 wide x 110 tall incl. chimney pipe
  bookshelf:    { x: 340, y: 590 },  // slim, ~38 wide x 90 tall, right wall beside the armchair
  radio:        { x: 344, y: 476 },  // small stand on the right, between the phone and the bookshelf
};
/** Mocha lying in bed (pose 'lie'): body centre on the mattress; the blanket is drawn over him. */
export const BED_LIE = { x: 104, y: 424 };
/** Home decor anchors (same conventions as DECOR_ANCHOR). */
export const HOME_ANCHOR: Record<HomeSlot, { x: number; y: number }> = {
  window: { x: 160, y: 108 }, // centre of the window (window ~100 x 90); curtains frame it, max 150 x 120
  wall:   { x: 92,  y: 112 }, // centre, max 52 x 52 (between bath door and window)
  bed:    { x: 96,  y: 452 }, // same as the bed: quilt drawn over the bed, max 150 x 80
  rug:    { x: 176, y: 548 }, // centre, flat, max 150 x 54
  corner: { x: 336, y: 360 }, // bottom-centre, max 40 x 90
  pet:    { x: 156, y: 630 }, // bottom-centre, max 50 x 40 (between the fireplace and the armchair)
};
/** Where the bear stands when idle at home. */
export const HOME_IDLE = { x: 180, y: 380 };

/* =====================================================================
   KONBINI (scene 'konbini'): a cosy little Japanese-style convenience store
   "Hoshi Mart" (original name — never use a real chain's name, colours or logo).
   Same 360x720 portrait viewBox. Wall y 0..250, floor below. UI covers y 0..56 and 630..720.
   ===================================================================== */
export const KONBINI_WALL_BOTTOM = 250;
export const KONBINI_DOOR = { x: 40, y: 250, w: 64, h: 120 };      // automatic glass door on the left (bottom-centre x 40)
export const KONBINI_ENTER = { x: 44, y: 290 };                    // bear appears here
/** Item slots (26): wall shelves 3x3, drinks fridge 2x2, a double-sided middle aisle shelf 2x4 (gondola),
 *  low snack table 3, hot case on the counter 2. (x,y) = item icon centre; the bear walks to `stand`.
 *  Layout v2: the bottom ~150 units are covered by the basket bar, so everything sits above y ~560. */
export const KONBINI_SLOTS: { x: number; y: number; stand: { x: number; y: number }; area: 'shelf' | 'fridge' | 'aisle' | 'table' | 'hot' }[] = [
  ...[110, 160, 210].flatMap((y) => [{ x: 130 }, { x: 175 }, { x: 220 }].map((p) => ({ x: p.x, y, stand: { x: p.x, y: 292 }, area: 'shelf' as const }))),
  ...[120, 182].flatMap((y) => [{ x: 280 }, { x: 326 }].map((p) => ({ x: p.x, y, stand: { x: p.x, y: 292 }, area: 'fridge' as const }))),
  ...[352, 392].flatMap((y) => [62, 104, 146, 188].map((x) => ({ x, y, stand: { x, y: 432 }, area: 'aisle' as const }))),
  { x: 82, y: 486, stand: { x: 82, y: 520 }, area: 'table' }, { x: 132, y: 486, stand: { x: 132, y: 520 }, area: 'table' },
  { x: 182, y: 486, stand: { x: 182, y: 520 }, area: 'table' },
  { x: 262, y: 452, stand: { x: 252, y: 520 }, area: 'hot' }, { x: 292, y: 452, stand: { x: 282, y: 520 }, area: 'hot' },
];
/** Shelf furniture the art draws behind the slots. */
export const KONBINI_SHELF = { x: 104, y: 80, w: 142, h: 160 };    // wall shelving unit (3 shelves at the slot rows, items sit on them)
export const KONBINI_FRIDGE = { x: 254, y: 64, w: 98, h: 180 };    // glass-door drinks fridge
/** Middle aisle: a low double-sided gondola shelf with 2 boards (items sit on boards just below y 352 / 392), end-cap sign on the left. */
export const KONBINI_AISLE = { x: 38, y: 330, w: 176, h: 84 };
export const KONBINI_TABLE = { x: 56, y: 470, w: 152, h: 46 };     // low snack display table (top at y ~478)
/** Self-serve coffee machine on a cabinet, back-right floor next to the fridge. */
export const KONBINI_COFFEE = { x: 300, y: 270, w: 54, h: 110 };   // bottom at y ~380
/** Counter + register + clerk at the right, raised so the basket bar never covers it. Tap here to pay. */
export const KONBINI_COUNTER = { x: 230, y: 458, w: 130, h: 64 };  // top surface y ~458; hot case on its left end (x 246..308)
export const KONBINI_CLERK = { x: 322, y: 460 };                   // clerk feet (behind the counter)
export const KONBINI_PAY_SPOT = { x: 268, y: 540 };                // bear stands here to pay
/** Where other shoppers wander (NPCs). */
export const KONBINI_BROWSE = [
  { x: 130, y: 292 }, { x: 220, y: 292 }, { x: 300, y: 292 }, { x: 70, y: 432 }, { x: 170, y: 432 }, { x: 120, y: 520 }, { x: 230, y: 540 },
];

/* =====================================================================
   SECRET HOTSPOTS (v4): invisible tap spots on things that are already drawn.
   Tapping one (radius r) counts toward a journal secret and plays a tiny reaction.
   Café spots only count when no café action took the tap (empty-floor taps).
   ===================================================================== */
export const SECRET_SPOTS: Record<string, { scene: 'cafe' | 'home' | 'konbini'; x: number; y: number; r: number }> = {
  cafe_clock:        { scene: 'cafe', x: 300, y: 104, r: 26 },   // wall decor slot (cat clock when placed)
  cafe_window:       { scene: 'cafe', x: 161, y: 108, r: 34 },
  cafe_record:       { scene: 'cafe', x: 161, y: 210, r: 34 },   // back slot (record player) — double-tap toggles music already
  cafe_plant:        { scene: 'cafe', x: 338, y: 330, r: 22 },
  cafe_barista:      { scene: 'cafe', x: 318, y: 200, r: 24 },
  cafe_door_bell:    { scene: 'cafe', x: 60,  y: 150, r: 18 },
  cafe_menu_board:   { scene: 'cafe', x: 250, y: 150, r: 22 },
  home_moon:         { scene: 'home', x: 185, y: 85,  r: 18 },   // moon in the window
  home_kettle:       { scene: 'home', x: 318, y: 200, r: 18 },
  home_duck_sign:    { scene: 'home', x: 36,  y: 170, r: 16 },
  home_box:          { scene: 'home', x: 214, y: 480, r: 22 },   // the moving box
  home_pillow:       { scene: 'home', x: 40,  y: 420, r: 18 },
  home_jar:          { scene: 'home', x: 238, y: 132, r: 18 },
  home_photo:        { scene: 'home', x: 92,  y: 112, r: 22 },   // wall slot (photo of Mom when placed)
  home_fireplace:    { scene: 'home', x: 62,  y: 562, r: 30 },
  konbini_star_sign: { scene: 'konbini', x: 180, y: 60, r: 26 },
  konbini_clerk:     { scene: 'konbini', x: 322, y: 420, r: 24 },
  konbini_coffee_machine: { scene: 'konbini', x: 327, y: 320, r: 26 },
  konbini_umbrella:  { scene: 'konbini', x: 96, y: 300, r: 18 },
};
/** Where the morning newspaper lies at home (on the floor just inside the bath/front door side). */
export const HOME_NEWSPAPER = { x: 112, y: 300, r: 26 };
