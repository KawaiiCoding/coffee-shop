/* =====================================================================
   AUDIO — music playlist (HTMLAudioElement, shuffled loop with fades)
   and synthesized cozy SFX (WebAudio). Never throws.
   ===================================================================== */
import type { AudioApi, Settings, SfxName } from '../types';

const DEFAULTS: Settings = { music: true, sfx: true, musicVolume: 0.6, sfxVolume: 0.8, hints: true };

type Ctx = AudioContext;
type Wave = OscillatorType;

export function createAudio(): AudioApi {
  let settings: Settings = { ...DEFAULTS };
  let unlocked = false;

  /* ------------------------------ SFX ------------------------------ */
  let ctx: Ctx | null = null;
  let master: GainNode | null = null;
  let noiseBuf: AudioBuffer | null = null;
  const lastPlayed: Partial<Record<SfxName, number>> = {};

  function getCtx(): Ctx | null {
    if (ctx) return ctx;
    try {
      const AC: typeof AudioContext | undefined = (globalThis as unknown as {
        AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext;
      }).AudioContext ?? (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = sfxGain();
      master.connect(ctx.destination);
    } catch {
      ctx = null; master = null;
    }
    return ctx;
  }

  const sfxGain = () => (settings.sfx ? Math.pow(clamp01(settings.sfxVolume), 1.5) * 0.9 : 0);

  /** One enveloped oscillator note. t = offset from now (s). */
  function tone(c: Ctx, freq: number, t: number, dur: number, o: {
    type?: Wave; gain?: number; slideTo?: number; attack?: number; vibrato?: number; lowpass?: number;
  } = {}): void {
    const now = c.currentTime + t;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, now);
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, now + dur);
    const peak = o.gain ?? 0.3;
    const atk = o.attack ?? 0.006;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(peak, now + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    let out: AudioNode = g;
    if (o.lowpass) {
      const f = c.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = o.lowpass;
      g.connect(f); out = f;
    }
    if (o.vibrato) {
      const lfo = c.createOscillator();
      const lg = c.createGain();
      lfo.frequency.value = 11; lg.gain.value = o.vibrato;
      lfo.connect(lg); lg.connect(osc.frequency);
      lfo.start(now); lfo.stop(now + dur + 0.05);
    }
    osc.connect(g);
    out.connect(master!);
    osc.start(now);
    osc.stop(now + dur + 0.05);
  }

  /** Soft filtered noise puff (steam / click texture). */
  function noise(c: Ctx, t: number, dur: number, o: { gain?: number; freq?: number; q?: number } = {}): void {
    if (!noiseBuf) {
      noiseBuf = c.createBuffer(1, Math.floor(c.sampleRate * 0.6), c.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const now = c.currentTime + t;
    const src = c.createBufferSource();
    src.buffer = noiseBuf; src.loop = true;
    const f = c.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = o.freq ?? 1800; f.Q.value = o.q ?? 0.8;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(o.gain ?? 0.12, now + Math.min(0.08, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(f); f.connect(g); g.connect(master!);
    src.start(now); src.stop(now + dur + 0.05);
  }

  /** Chime-y note: sine + quiet octave partial. */
  function chime(c: Ctx, freq: number, t: number, dur: number, gain = 0.22): void {
    tone(c, freq, t, dur, { gain, attack: 0.004 });
    tone(c, freq * 2, t, dur * 0.6, { gain: gain * 0.25, attack: 0.004 });
  }

  const SFX: Record<SfxName, (c: Ctx) => void> = {
    tap: (c) => { tone(c, 880, 0, 0.06, { gain: 0.18, slideTo: 560 }); },
    seat: (c) => { tone(c, 520, 0, 0.1, { type: 'triangle', gain: 0.2, slideTo: 780 }); },
    pickup: (c) => {
      tone(c, 660, 0, 0.07, { type: 'triangle', gain: 0.16 });
      tone(c, 990, 0.06, 0.09, { type: 'triangle', gain: 0.16 });
    },
    order: (c) => {
      tone(c, 740, 0, 0.08, { type: 'triangle', gain: 0.16 });
      tone(c, 880, 0.08, 0.12, { type: 'triangle', gain: 0.16 });
    },
    bell: (c) => { chime(c, 1318.5, 0, 0.7, 0.2); chime(c, 1046.5, 0.13, 0.9, 0.18); },
    brew: (c) => { noise(c, 0, 0.45, { gain: 0.06, freq: 2400, q: 0.6 }); tone(c, 180, 0, 0.25, { gain: 0.05, lowpass: 600 }); },
    ding: (c) => { chime(c, 1568, 0, 0.5, 0.2); },
    serve: (c) => { chime(c, 880, 0, 0.55, 0.22); chime(c, 698.5, 0.2, 0.75, 0.2); },
    coin: (c) => {
      [988, 1319, 1760].forEach((f, i) => tone(c, f, i * 0.055, 0.12, { type: 'square', gain: 0.05, lowpass: 3200 }));
      tone(c, 2637, 0.17, 0.18, { gain: 0.06 });
    },
    buy: (c) => {
      [784, 988, 1175, 1568].forEach((f, i) => tone(c, f, i * 0.06, 0.16, { type: 'triangle', gain: 0.14 }));
      chime(c, 2093, 0.26, 0.4, 0.08);
    },
    angry: (c) => { tone(c, 190, 0, 0.32, { type: 'sawtooth', gain: 0.12, slideTo: 140, vibrato: 18, lowpass: 420 }); },
    dayEnd: (c) => {
      [523.3, 659.3, 784, 1046.5].forEach((f, i) => chime(c, f, i * 0.13, i === 3 ? 0.9 : 0.3, 0.18));
      chime(c, 1318.5, 0.52, 0.9, 0.08);
    },
    error: (c) => { tone(c, 230, 0, 0.16, { gain: 0.28, slideTo: 150, lowpass: 900 }); },
    // soft paper flick: two quick airy rustles
    page: (c) => {
      noise(c, 0, 0.09, { gain: 0.07, freq: 3400, q: 0.7 });
      noise(c, 0.05, 0.16, { gain: 0.05, freq: 5600, q: 0.9 });
    },
    // brushy broom swish
    sweep: (c) => {
      noise(c, 0, 0.26, { gain: 0.1, freq: 2400, q: 0.5 });
      noise(c, 0.12, 0.22, { gain: 0.07, freq: 3800, q: 0.6 });
    },
    // bubbly pop
    pop: (c) => {
      tone(c, 320, 0, 0.09, { gain: 0.24, slideTo: 980 });
      tone(c, 1250, 0.05, 0.07, { gain: 0.08, slideTo: 1700 });
    },
    // soft wooden thunk
    place: (c) => {
      tone(c, 170, 0, 0.16, { type: 'triangle', gain: 0.3, slideTo: 105, lowpass: 900 });
      tone(c, 520, 0, 0.05, { type: 'triangle', gain: 0.08, lowpass: 1400 });
      noise(c, 0, 0.06, { gain: 0.05, freq: 900, q: 1.2 });
    },
    // sizzle in the pan: crackly high noise
    cook: (c) => {
      noise(c, 0, 0.75, { gain: 0.035, freq: 6200, q: 0.4 });
      for (let i = 0; i < 6; i++) noise(c, 0.04 + i * 0.1 + Math.random() * 0.04, 0.05, { gain: 0.05, freq: 4200 + Math.random() * 2400, q: 2 });
    },
    // water bloop
    splash: (c) => {
      tone(c, 380, 0, 0.12, { gain: 0.2, slideTo: 1100 });
      tone(c, 560, 0.09, 0.12, { gain: 0.14, slideTo: 1500 });
      noise(c, 0.02, 0.28, { gain: 0.05, freq: 1300, q: 0.6 });
    },
    // two soft ring tones
    phone: (c) => {
      for (const t of [0, 0.42]) {
        tone(c, 740, t, 0.3, { type: 'triangle', gain: 0.1, vibrato: 22, attack: 0.02 });
        tone(c, 932, t, 0.3, { type: 'triangle', gain: 0.06, vibrato: 22, attack: 0.02 });
      }
    },
    // sleepy descending hum
    yawn: (c) => {
      tone(c, 520, 0, 0.95, { type: 'triangle', gain: 0.12, slideTo: 230, attack: 0.14, lowpass: 1200, vibrato: 4 });
      noise(c, 0.1, 0.7, { gain: 0.025, freq: 900, q: 0.5 });
    },
    // coin clinking into a glass jar
    jar: (c) => {
      tone(c, 2637, 0, 0.06, { type: 'square', gain: 0.05, lowpass: 3600 });
      chime(c, 3136, 0.05, 0.5, 0.08);
      chime(c, 2349, 0.15, 0.45, 0.06);
      tone(c, 1760, 0.22, 0.3, { gain: 0.04 });
    },
  };

  function playSfx(name: SfxName): void {
    try {
      if (!settings.sfx || settings.sfxVolume <= 0 || !unlocked) return;
      const c = getCtx();
      if (!c || !master) return;
      if (c.state === 'suspended') void c.resume().catch(() => {});
      const now = performance.now();
      if ((lastPlayed[name] ?? -1e9) > now - 45) return; // de-dupe bursts
      lastPlayed[name] = now;
      SFX[name]?.(c);
    } catch { /* never throw from audio */ }
  }

  /* ----------------------------- MUSIC ----------------------------- */
  let tracks: string[] | null = null;
  let loading: Promise<void> | null = null;
  let order: string[] = [];
  let pos = 0;
  let el: HTMLAudioElement | null = null;
  let fadeTimer: number | null = null;
  let fadingOut = false;
  let failures = 0;
  let level = 0; // current fade multiplier 0..1

  const musicTarget = () => (settings.music ? Math.pow(clamp01(settings.musicVolume), 1.6) * 0.8 : 0);
  const wantMusic = () => unlocked && settings.music && settings.musicVolume > 0
    && !(typeof document !== 'undefined' && document.hidden);

  function loadPlaylist(): Promise<void> {
    if (loading) return loading;
    loading = (async () => {
      try {
        const res = await fetch('./music/playlist.json', { cache: 'no-cache' });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json() as { tracks?: unknown };
        tracks = Array.isArray(data.tracks) ? data.tracks.filter((t): t is string => typeof t === 'string' && !!t) : [];
      } catch {
        tracks = [];
      }
    })();
    return loading;
  }

  function shuffle(): void {
    const prev = order[order.length - 1];
    order = [...(tracks ?? [])];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    if (order.length > 1 && order[0] === prev) [order[0], order[1]] = [order[1], order[0]];
    pos = 0;
  }

  function trackUrl(name: string): string {
    const path = name.split('/').map(encodeURIComponent).join('/');
    try { return new URL('./music/' + path, document.baseURI).href; } catch { return './music/' + path; }
  }

  function setVol(): void {
    if (el) el.volume = clamp01(musicTarget() * level);
  }

  /** Fade level toward `to` over ms, then call done. */
  function fade(to: number, ms: number, done?: () => void): void {
    if (fadeTimer !== null) clearInterval(fadeTimer);
    const from = level;
    const start = performance.now();
    fadeTimer = window.setInterval(() => {
      const k = Math.min(1, (performance.now() - start) / ms);
      level = from + (to - from) * k;
      setVol();
      if (k >= 1) {
        if (fadeTimer !== null) clearInterval(fadeTimer);
        fadeTimer = null;
        done?.();
      }
    }, 50);
  }

  function ensureEl(): HTMLAudioElement {
    if (el) return el;
    el = new Audio();
    el.preload = 'auto';
    el.addEventListener('ended', () => next());
    el.addEventListener('error', () => {
      failures++;
      if (tracks && failures < tracks.length * 2) setTimeout(next, 300);
    });
    el.addEventListener('playing', () => { failures = 0; });
    el.addEventListener('timeupdate', () => {
      if (!el || fadingOut || !isFinite(el.duration)) return;
      if (el.duration - el.currentTime < 2.2 && el.duration > 6) {
        fadingOut = true;
        fade(0, 2000);
      }
    });
    return el;
  }

  function next(): void {
    if (!tracks || tracks.length === 0) return;
    if (pos >= order.length) shuffle();
    const name = order[pos++];
    const a = ensureEl();
    fadingOut = false;
    a.src = trackUrl(name);
    level = 0; setVol();
    if (!wantMusic()) return;
    void a.play().then(() => fade(1, 1800)).catch(() => { /* autoplay blocked or bad file */ });
  }

  async function startMusic(): Promise<void> {
    try {
      await loadPlaylist();
      if (!tracks || tracks.length === 0 || !wantMusic()) return;
      if (el && el.src && el.paused && !el.ended) {
        void el.play().then(() => fade(fadingOut ? 0 : 1, 1200)).catch(() => {});
        return;
      }
      if (el && el.src && !el.paused) { fade(fadingOut ? 0 : 1, 600); return; }
      if (order.length === 0) shuffle();
      next();
    } catch { /* silent */ }
  }

  function stopMusic(immediate: boolean): void {
    if (!el || el.paused) return;
    if (immediate) {
      if (fadeTimer !== null) clearInterval(fadeTimer);
      fadeTimer = null;
      level = 0; setVol();
      el.pause();
      return;
    }
    fade(0, 700, () => { el?.pause(); });
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      try {
        if (document.hidden) {
          stopMusic(true);
          if (ctx && ctx.state === 'running') void ctx.suspend().catch(() => {});
        } else {
          if (ctx && ctx.state === 'suspended' && unlocked) void ctx.resume().catch(() => {});
          void startMusic();
        }
      } catch { /* ignore */ }
    });
  }

  /* ------------------------------ API ------------------------------ */
  return {
    unlock() {
      try {
        if (!unlocked) {
          unlocked = true;
          const c = getCtx();
          if (c) {
            // iOS: play a silent buffer inside the gesture to unlock output.
            const b = c.createBuffer(1, 1, 22050);
            const s = c.createBufferSource();
            s.buffer = b; s.connect(c.destination); s.start(0);
          }
        }
        if (ctx && ctx.state === 'suspended') void ctx.resume().catch(() => {});
        void startMusic();
      } catch { /* ignore */ }
    },
    playSfx,
    applySettings(s: Settings) {
      try {
        settings = { ...DEFAULTS, ...s };
        if (master && ctx) master.gain.setTargetAtTime(sfxGain(), ctx.currentTime, 0.02);
        if (wantMusic()) { setVol(); void startMusic(); } else stopMusic(false);
      } catch { /* ignore */ }
    },
  };
}

function clamp01(v: number): number {
  return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
}
