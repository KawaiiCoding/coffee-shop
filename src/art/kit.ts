/* =====================================================================
   SHARED DRAWING KIT for every art file. Read-only for art agents
   (the lead art agent may ADD helpers at the bottom, never change these).
   Style: soft brown ink line, round caps, colour fill offset slightly
   from the line like a hand-coloured drawing. Shapes are hand-shaped
   Bezier paths, never perfect rects/circles for main outlines.
   No filters, no noise, no jitter.
   ===================================================================== */

export const INK = '#6b4a3a';
export const EYE = '#4a332b';
export const CREAM = '#fff6ea';
export const BLUSH = '#eda2a2';
export const LINE_W = 2.4;

/** Colour fill, nudged off the ink line. */
export const fl = (d: string, fill: string, opacity = 1) =>
  `<path d="${d}" fill="${fill}"${opacity < 1 ? ` opacity="${opacity}"` : ''} transform="translate(1.3,1)"/>`;

/** Ink line only. */
export const ln = (d: string, w = LINE_W, color = INK) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

/** Filled shape with offset colour + ink outline. */
export const sh = (d: string, fill: string, w = LINE_W) => fl(d, fill) + ln(d, w);

/** Soft ground shadow. */
export const shadow = (cx: number, cy: number, rx: number, ry = rx * 0.2, op = 0.14) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${INK}" opacity="${op}"/>`;

/** Wrap markup in a group with a transform. */
export const g = (transform: string, inner: string) => `<g transform="${transform}">${inner}</g>`;

/** Hand-shaped blob ellipse: an ellipse-like closed path with slight asymmetry
 *  (deterministic: lean in -1..1 tilts the bulge). Use instead of <ellipse> for outlines. */
export function blob(cx: number, cy: number, rx: number, ry: number, lean = 0.15): string {
  const k = 0.56, a = rx * (1 + lean * 0.08), b = ry * (1 - lean * 0.06);
  const r = (n: number) => +n.toFixed(1);
  return `M${r(cx - a)},${r(cy)} C${r(cx - a)},${r(cy - b * k * 1.75)} ${r(cx - a * k)},${r(cy - b)} ${r(cx + lean * 2)},${r(cy - b)} `
    + `C${r(cx + rx * k)},${r(cy - b)} ${r(cx + rx)},${r(cy - ry * k)} ${r(cx + rx)},${r(cy + lean)} `
    + `C${r(cx + rx)},${r(cy + ry * k)} ${r(cx + rx * k)},${r(cy + ry)} ${r(cx)},${r(cy + ry)} `
    + `C${r(cx - a * k)},${r(cy + ry)} ${r(cx - a)},${r(cy + b * k)} ${r(cx - a)},${r(cy)}z`;
}

/** Hand-shaped rounded box (slightly uneven sides). */
export function box(x: number, y: number, w: number, h: number, rad = 6, lean = 1): string {
  const r = (n: number) => +n.toFixed(1);
  return `M${r(x + rad)},${r(y + lean * 0.6)} C${r(x + w * 0.35)},${r(y - lean * 0.4)} ${r(x + w * 0.65)},${r(y + lean * 0.5)} ${r(x + w - rad)},${r(y)} `
    + `Q${r(x + w)},${r(y)} ${r(x + w + lean * 0.3)},${r(y + rad)} `
    + `C${r(x + w - lean * 0.4)},${r(y + h * 0.4)} ${r(x + w + lean * 0.4)},${r(y + h * 0.7)} ${r(x + w)},${r(y + h - rad)} `
    + `Q${r(x + w)},${r(y + h)} ${r(x + w - rad)},${r(y + h)} `
    + `C${r(x + w * 0.6)},${r(y + h + lean * 0.5)} ${r(x + w * 0.3)},${r(y + h - lean * 0.4)} ${r(x + rad)},${r(y + h + lean * 0.2)} `
    + `Q${r(x)},${r(y + h)} ${r(x - lean * 0.2)},${r(y + h - rad)} `
    + `C${r(x + lean * 0.4)},${r(y + h * 0.6)} ${r(x - lean * 0.3)},${r(y + h * 0.3)} ${r(x)},${r(y + rad)} `
    + `Q${r(x)},${r(y)} ${r(x + rad)},${r(y + lean * 0.6)}z`;
}

/** Tiny cute face (for yarn balls, plants, cups...). */
export const tinyFace = (cx: number, cy: number, s = 1) =>
  `<circle cx="${cx - 3.5 * s}" cy="${cy}" r="${1.3 * s}" fill="${EYE}"/><circle cx="${cx + 3.5 * s}" cy="${cy}" r="${1.3 * s}" fill="${EYE}"/>`
  + ln(`M${cx - 1.6 * s},${cy + 2.2 * s} q${1.6 * s},${1.8 * s} ${3.2 * s},0`, 1.1 * s, EYE)
  + `<circle cx="${cx - 6.5 * s}" cy="${cy + 2.4 * s}" r="${1.6 * s}" fill="${BLUSH}" opacity=".8"/><circle cx="${cx + 6.5 * s}" cy="${cy + 2.4 * s}" r="${1.6 * s}" fill="${BLUSH}" opacity=".8"/>`;

/** Wrap inner markup into a standalone <svg> sized `size` px. */
export const standalone = (viewBox: string, size: number, inner: string, label = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${size}" height="${size}"${label ? ` role="img" aria-label="${label}"` : ' aria-hidden="true"'}>${inner}</svg>`;
