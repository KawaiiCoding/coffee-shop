/* =====================================================================
   SHARED SCENE LAYOUT. Portrait scene in viewBox units (0 0 360 720).
   The UI overlays a top bar over y 0..56 and a bottom nav over y 650..720,
   so nothing that must be tapped sits there.
   ===================================================================== */
import type { DecorSlot } from './types';

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
  { x: 286, y: 236 }, { x: 306, y: 236 }, { x: 326, y: 236 }, { x: 346, y: 236 },
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
