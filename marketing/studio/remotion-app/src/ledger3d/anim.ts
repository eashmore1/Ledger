// Small, deterministic animation helpers (everything is a pure function of time).
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const prog = (t: number, a: number, d: number) => clamp((t - a) / d);
export const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);
export const easeIn = (k: number) => k * k * k;
export const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
export const expoOut = (k: number) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k));
export const backOut = (k: number, s = 1.9) => {
  const c = s + 1;
  return 1 + c * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2);
};
/** Damped spring 0 -> 1 (overshoots, settles by k = 1), for pops and landings. */
export const spring = (k: number, freq = 3.2) => {
  if (k <= 0) return 0;
  if (k >= 1) return 1;
  return 1 - Math.exp(-6 * k) * Math.cos(freq * Math.PI * k);
};

/**
 * Presence of an element shown from a to b: pops in (back-out) and shrinks out.
 * Returns 0 when hidden so callers can skip rendering.
 */
export const life = (t: number, a: number, b: number, inD = 0.4, outD = 0.22) => {
  if (t < a || t > b) return 0;
  const i = backOut(prog(t, a, inD));
  const o = 1 - easeIn(prog(t, b - outD, outD));
  return Math.max(0, Math.min(i, o));
};

/** Fade-only presence (no overshoot). */
export const fade = (t: number, a: number, b: number, inD = 0.25, outD = 0.25) => {
  if (t < a || t > b) return 0;
  return Math.min(easeOut(prog(t, a, inD)), 1 - easeIn(prog(t, b - outD, outD)));
};

/** Deterministic pseudo-random in [0,1). */
export const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Smooth 1D noise in [-1,1]. */
export const noise = (x: number, seed = 0) => {
  const i = Math.floor(x), f = x - i;
  const a = rand(i + seed * 101) * 2 - 1, b = rand(i + 1 + seed * 101) * 2 - 1;
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
};

/** Camera shake impulse: decaying wobble after each hit time. */
export const shake = (t: number, hits: number[], amp = 0.06, dur = 0.35) => {
  let x = 0, y = 0;
  for (const h of hits) {
    const k = (t - h) / dur;
    if (k < 0 || k > 1) continue;
    const env = Math.pow(1 - k, 2) * amp;
    x += Math.sin((t - h) * 70) * env;
    y += Math.cos((t - h) * 57) * env;
  }
  return [x, y] as const;
};

export type V3 = [number, number, number];
export const mix3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

/** Keyframed vector track with per-segment easing. */
export type Key = { t: number; v: V3; ease?: (k: number) => number };
export const track = (keys: Key[], t: number): V3 => {
  if (t <= keys[0].t) return keys[0].v;
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i].t) {
      const a = keys[i - 1], b = keys[i];
      const k = (b.ease || easeInOut)(clamp((t - a.t) / Math.max(1e-6, b.t - a.t)));
      return mix3(a.v, b.v, k);
    }
  }
  return keys[keys.length - 1].v;
};
