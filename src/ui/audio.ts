/* =====================================================================
   AUDIO — music playlist (HTMLAudioElement, shuffled loop with fades)
   and synthesized cozy SFX (WebAudio). Never throws.
   ===================================================================== */
import type { AudioApi, Scene, Settings, SfxName } from '../types';

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
    vibRate?: number; dest?: AudioNode;
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
      lfo.frequency.value = o.vibRate ?? 11; lg.gain.value = o.vibrato;
      lfo.connect(lg); lg.connect(osc.frequency);
      lfo.start(now); lfo.stop(now + dur + 0.05);
    }
    osc.connect(g);
    out.connect(o.dest ?? master!);
    osc.start(now);
    osc.stop(now + dur + 0.05);
  }

  /** Soft filtered noise puff (steam / click texture). */
  function getNoise(c: Ctx): AudioBuffer {
    if (!noiseBuf) {
      noiseBuf = c.createBuffer(1, Math.floor(c.sampleRate * 0.6), c.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return noiseBuf;
  }

  function noise(c: Ctx, t: number, dur: number, o: { gain?: number; freq?: number; q?: number; dest?: AudioNode } = {}): void {
    const now = c.currentTime + t;
    const src = c.createBufferSource();
    src.buffer = getNoise(c); src.loop = true;
    const f = c.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = o.freq ?? 1800; f.Q.value = o.q ?? 0.8;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(o.gain ?? 0.12, now + Math.min(0.08, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(f); f.connect(g); g.connect(o.dest ?? master!);
    src.start(now); src.stop(now + dur + 0.05);
  }

  /** Chime-y note: sine + quiet octave partial. */
  function chime(c: Ctx, freq: number, t: number, dur: number, gain = 0.22): void {
    tone(c, freq, t, dur, { gain, attack: 0.004 });
    tone(c, freq * 2, t, dur * 0.6, { gain: gain * 0.25, attack: 0.004 });
  }

  /** Soft electronic bell / marimba: warm sine body, quick bright mallet partials. */
  function mallet(c: Ctx, freq: number, t: number, dur: number, gain = 0.12): void {
    tone(c, freq, t, dur, { gain, attack: 0.003 });
    tone(c, freq * 2, t, dur * 0.45, { gain: gain * 0.3, attack: 0.002 });
    tone(c, freq * 4, t, 0.07, { gain: gain * 0.18, attack: 0.001 }); // mallet "tick"
    tone(c, freq, t, dur * 0.6, { type: 'triangle', gain: gain * 0.25, attack: 0.003, lowpass: freq * 3 });
  }

  /** Cute "voice-like" syllable blips (fallback when no Japanese TTS voice). */
  function voiceBlips(c: Ctx, notes: Array<[number, number, number]>): void {
    // [startFreq, endFreq, duration]; formant-ish lowpass + gentle vibrato
    let t = 0;
    for (const [f, to, d] of notes) {
      tone(c, f, t, d, { type: 'triangle', gain: 0.17, slideTo: to, attack: 0.015, vibrato: f * 0.012, vibRate: 7, lowpass: 2200 });
      tone(c, f * 2, t, d * 0.7, { gain: 0.04, slideTo: to * 2, attack: 0.015 });
      t += d + 0.025;
    }
  }

  const VOICE_FALLBACK: Record<'irasshaimase' | 'arigato', Array<[number, number, number]>> = {
    // i-ra-sha-i-ma-se! bright and rising, squished into 4 bouncy syllables
    irasshaimase: [[620, 700, 0.1], [820, 900, 0.1], [760, 740, 0.11], [940, 1120, 0.2]],
    // a-ri-ga-to(u)! warm, gently falling
    arigato: [[860, 900, 0.1], [980, 960, 0.1], [820, 800, 0.11], [700, 560, 0.24]],
  };

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
    // konbini entrance melody (original): two bright 4-note phrases on a soft
    // electronic bell — "hello, come in!" (G C E D) answered by "welcome!" (A D B C)
    chime: (c) => {
      const mel: Array<[number, number, number]> = [
        [783.99, 0.00, 0.40], [1046.5, 0.16, 0.40], [1318.5, 0.32, 0.40], [1174.7, 0.48, 0.60],
        [880.00, 0.80, 0.40], [1174.7, 0.96, 0.40], [987.77, 1.12, 0.40], [1046.5, 1.28, 0.95],
      ];
      mel.forEach(([f, t, d], i) => mallet(c, f, t, d, i === 7 ? 0.11 : 0.09));
      tone(c, 523.25, 1.28, 0.95, { gain: 0.035, attack: 0.01 }); // soft low C under the last note
    },
    irasshaimase: (c) => { voiceBlips(c, VOICE_FALLBACK.irasshaimase); },
    arigato: (c) => { voiceBlips(c, VOICE_FALLBACK.arigato); },
    // soft ka-ching: drawer clack + bell
    register: (c) => {
      noise(c, 0, 0.07, { gain: 0.08, freq: 1500, q: 1.4 });
      tone(c, 220, 0, 0.09, { type: 'triangle', gain: 0.14, slideTo: 140, lowpass: 900 });
      chime(c, 2093, 0.1, 0.6, 0.12);
      chime(c, 2637, 0.16, 0.7, 0.09);
    },
    // sparkly rising arpeggio
    gift: (c) => {
      [784, 988, 1175, 1568, 1976].forEach((f, i) => tone(c, f, i * 0.07, 0.2, { type: 'triangle', gain: 0.11 }));
      chime(c, 2637, 0.36, 0.5, 0.07);
      chime(c, 3136, 0.44, 0.45, 0.05);
    },
    // twinkly glissando up a pentatonic scale
    wish: (c) => {
      const notes = [1046.5, 1174.7, 1318.5, 1568, 1760, 2093, 2349, 2637, 3136];
      notes.forEach((f, i) => tone(c, f, i * 0.045, 0.32, { gain: 0.06 + (i % 2) * 0.02, attack: 0.004 }));
      chime(c, 2093, notes.length * 0.045 + 0.05, 0.9, 0.08);
    },
    // soft wood-fire crackle: a few tiny noise pops
    crackle: (c) => {
      noise(c, 0, 0.45, { gain: 0.015, freq: 700, q: 0.5 });
      const n = 4 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        noise(c, Math.random() * 0.4, 0.025 + Math.random() * 0.03, { gain: 0.04 + Math.random() * 0.04, freq: 1800 + Math.random() * 3000, q: 1.5 });
      }
    },
    // two soft 'nom' blips
    eat: (c) => {
      for (const t of [0, 0.17]) {
        tone(c, 330, t, 0.11, { type: 'triangle', gain: 0.16, slideTo: 220, lowpass: 1100, attack: 0.012 });
        noise(c, t + 0.02, 0.05, { gain: 0.02, freq: 1200, q: 1 });
      }
    },
    // soft wooden door: a short creak then a gentle thud
    door: (c) => {
      tone(c, 260, 0, 0.32, { type: 'sawtooth', gain: 0.035, slideTo: 340, vibrato: 30, lowpass: 900, attack: 0.04 });
      tone(c, 150, 0.32, 0.18, { type: 'triangle', gain: 0.24, slideTo: 95, lowpass: 700 });
      noise(c, 0.32, 0.07, { gain: 0.05, freq: 700, q: 1.2 });
    },
    // happy fanfare-lite: four notes, last one rings
    unlock: (c) => {
      [523.3, 659.3, 784, 1046.5].forEach((f, i) => {
        tone(c, f, i * 0.1, i === 3 ? 0.6 : 0.14, { type: 'triangle', gain: 0.15 });
        if (i === 3) chime(c, f * 2, i * 0.1, 0.7, 0.07);
      });
    },
  };

  /* --------------------------- CLERK VOICE --------------------------- */
  const LINES: Record<'irasshaimase' | 'arigato', string> = {
    irasshaimase: 'いらっしゃいませ！',
    arigato: 'ありがとうございました！',
  };

  function synth(): SpeechSynthesis | null {
    try {
      const s = (globalThis as unknown as { speechSynthesis?: SpeechSynthesis }).speechSynthesis;
      const U = (globalThis as unknown as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance;
      return s && typeof U === 'function' ? s : null;
    } catch { return null; }
  }

  function jaVoice(): SpeechSynthesisVoice | null {
    try {
      const vs = synth()?.getVoices() ?? [];
      const ja = vs.filter((v) => /^ja([-_]|$)/i.test(v.lang));
      return ja.find((v) => /ja[-_]JP/i.test(v.lang) && v.localService)
        ?? ja.find((v) => /ja[-_]JP/i.test(v.lang)) ?? ja[0] ?? null;
    } catch { return null; }
  }

  // voices often load asynchronously; poke the list early so it's ready later
  function warmVoices(): void {
    try {
      const s = synth();
      if (!s) return;
      s.getVoices();
      s.addEventListener?.('voiceschanged', () => { try { s.getVoices(); } catch { /* ignore */ } });
    } catch { /* ignore */ }
  }

  /** Speak a clerk line with a Japanese voice. Returns false if it can't. */
  function speak(name: 'irasshaimase' | 'arigato'): boolean {
    try {
      const s = synth();
      const voice = jaVoice();
      if (!s || !voice) return false;
      s.cancel(); // drop any previous line still queued/speaking
      const u = new SpeechSynthesisUtterance(LINES[name]);
      u.lang = voice.lang || 'ja-JP';
      u.voice = voice;
      u.rate = 1.05;
      u.pitch = 1.3;
      u.volume = clamp01(settings.sfxVolume);
      u.onerror = () => { /* ignore */ };
      s.speak(u);
      return true;
    } catch { return false; }
  }

  /** Real recorded "irasshaimase" greeting (public/sfx/irasshaimase-1.mp3). Add more files here to vary it. */
  const GREETINGS = ['./sfx/irasshaimase-1.mp3'];
  let greetBag: number[] = [];
  let greetEl: HTMLAudioElement | null = null;
  function playGreeting(): boolean {
    try {
      if (typeof Audio === 'undefined') return false;
      if (!greetBag.length) greetBag = GREETINGS.map((_, i) => i).sort(() => Math.random() - 0.5);
      const i = greetBag.pop()!;
      greetEl?.pause();
      greetEl = new Audio(GREETINGS[i]);
      greetEl.volume = clamp01(settings.sfxVolume);
      const p = greetEl.play();
      if (p) p.catch(() => { speak('irasshaimase'); }); // file blocked/missing → spoken fallback
      return true;
    } catch { return false; }
  }

  function playSfx(name: SfxName): void {
    try {
      if (!settings.sfx || settings.sfxVolume <= 0 || !unlocked) return;
      const now = performance.now();
      if ((lastPlayed[name] ?? -1e9) > now - 45) return; // de-dupe bursts
      lastPlayed[name] = now;
      if (name === 'irasshaimase' && playGreeting()) return;
      if ((name === 'irasshaimase' || name === 'arigato') && speak(name)) return;
      const c = getCtx();
      if (!c || !master) return;
      if (c.state === 'suspended') void c.resume().catch(() => {});
      SFX[name]?.(c);
    } catch { /* never throw from audio */ }
  }

  /* --------------------------- KONBINI AMBIENCE --------------------------- */
  // Quiet fridge hum + a soft, original bossa-ish chord loop. Used in the
  // konbini only when its playlist is empty. Notes are scheduled ~1s ahead
  // on the AudioContext clock by a light timer.
  const BAR = 2.4;                  // seconds per 4-beat bar (~100 bpm)
  const BEAT = BAR / 4;
  const LOOK_AHEAD = 1.2;
  // Fmaj7 – Dm9 – Gm7 – C9 (voicings around middle C), bass root/fifth
  const PROG: Array<{ chord: number[]; root: number; fifth: number }> = [
    { chord: [220.0, 261.6, 329.6, 392.0], root: 87.31, fifth: 130.8 },   // Fmaj7 (A C E G)
    { chord: [174.6, 220.0, 261.6, 329.6], root: 73.42, fifth: 110.0 },   // Dm9 (F A C E)
    { chord: [233.1, 293.7, 349.2, 440.0], root: 98.00, fifth: 146.8 },   // Gm9 (Bb D F A)
    { chord: [233.1, 293.7, 329.6, 392.0], root: 65.41, fifth: 98.00 },   // C9 (Bb D E G)
  ];
  const SPARKLE = [1046.5, 1174.7, 1318.5, 1568, 1760];
  // comping hits: [beat offset, length in beats, level]
  const COMP: Array<[number, number, number]> = [[0, 1.2, 1], [1.5, 0.8, 0.7], [2.5, 1.3, 0.85]];

  let ambBus: GainNode | null = null;
  let ambNodes: AudioScheduledSourceNode[] = [];
  let ambTimer: number | null = null;
  let ambTeardown: number | null = null;
  let ambOn = false;
  let ambNext = 0;
  let ambBar = 0;

  const ambTarget = () => musicTarget() * 0.55;
  const wantAmbience = () => wantMusic() && scene === 'konbini' && !!lists && lists.konbini.length === 0;

  function ambScheduleBar(c: Ctx, at: number): void {
    const bus = ambBus;
    if (!bus) return;
    const p = PROG[ambBar % PROG.length];
    const rel = (abs: number) => Math.max(0, abs - c.currentTime);
    for (const [beat, len, lvl] of COMP) {
      const t = rel(at + beat * BEAT);
      p.chord.forEach((f, i) => {
        // tiny strum: each chord tone a few ms later
        tone(c, f, t + i * 0.012, len * BEAT, { type: 'triangle', gain: 0.032 * lvl, attack: 0.012, lowpass: 1300, dest: bus });
      });
    }
    // soft bass: root on 1, fifth on 3, pickup root on the "and" of 4
    tone(c, p.root, rel(at), BEAT * 1.6, { gain: 0.12, attack: 0.01, lowpass: 400, dest: bus });
    tone(c, p.fifth, rel(at + 2 * BEAT), BEAT * 1.2, { gain: 0.09, attack: 0.01, lowpass: 400, dest: bus });
    if (ambBar % 2 === 1) tone(c, p.root * 2, rel(at + 3.5 * BEAT), BEAT * 0.45, { gain: 0.06, attack: 0.01, lowpass: 500, dest: bus });
    // whisper-quiet shaker on the off-beats
    for (let i = 0; i < 4; i++) noise(c, rel(at + (i + 0.5) * BEAT), 0.06, { gain: 0.006, freq: 7000, q: 0.7, dest: bus });
    // occasional little bell sparkle, like an in-store jingle
    if (Math.random() < 0.3) {
      const f = SPARKLE[Math.floor(Math.random() * SPARKLE.length)];
      tone(c, f, rel(at + (Math.random() < 0.5 ? 1 : 3) * BEAT), 0.7, { gain: 0.018, attack: 0.004, dest: bus });
    }
    ambBar++;
  }

  function ambTick(): void {
    try {
      const c = ctx;
      if (!c || !ambBus || c.state !== 'running') return;
      if (ambNext < c.currentTime) ambNext = c.currentTime + 0.05; // timer was throttled
      while (ambNext < c.currentTime + LOOK_AHEAD) {
        ambScheduleBar(c, ambNext);
        ambNext += BAR;
      }
    } catch { /* ignore */ }
  }

  function ambStartHum(c: Ctx, bus: GainNode): void {
    const now = c.currentTime;
    // compressor hum: low saw through a dark filter + a quiet harmonic that slowly breathes
    const hum = c.createOscillator();
    hum.type = 'sawtooth'; hum.frequency.value = 59;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 170; lp.Q.value = 0.5;
    const hg = c.createGain(); hg.gain.value = 0.05;
    hum.connect(lp); lp.connect(hg); hg.connect(bus);

    const harm = c.createOscillator();
    harm.frequency.value = 118;
    const harmG = c.createGain(); harmG.gain.value = 0.012;
    const lfo = c.createOscillator(); lfo.frequency.value = 0.13;
    const lfoG = c.createGain(); lfoG.gain.value = 0.008;
    lfo.connect(lfoG); lfoG.connect(harmG.gain);
    harm.connect(harmG); harmG.connect(bus);

    // faint airy room noise
    const air = c.createBufferSource();
    air.buffer = getNoise(c); air.loop = true;
    const af = c.createBiquadFilter(); af.type = 'lowpass'; af.frequency.value = 500;
    const ag = c.createGain(); ag.gain.value = 0.012;
    air.connect(af); af.connect(ag); ag.connect(bus);

    ambNodes = [hum, harm, lfo, air];
    for (const n of ambNodes) n.start(now);
  }

  function ambStopNodes(): void {
    for (const n of ambNodes) { try { n.stop(); } catch { /* ignore */ } try { n.disconnect(); } catch { /* ignore */ } }
    ambNodes = [];
  }

  function startAmbience(): void {
    const c = getCtx();
    if (!c) return;
    if (c.state === 'suspended') void c.resume().catch(() => {});
    if (ambTeardown !== null) { clearTimeout(ambTeardown); ambTeardown = null; }
    if (!ambBus) {
      ambBus = c.createGain();
      ambBus.gain.value = 0.0001;
      ambBus.connect(c.destination);
    }
    if (ambNodes.length === 0) ambStartHum(c, ambBus);
    const g = ambBus.gain;
    g.cancelScheduledValues(c.currentTime);
    g.setValueAtTime(Math.max(0.0001, g.value), c.currentTime);
    g.linearRampToValueAtTime(Math.max(0.0001, ambTarget()), c.currentTime + SWITCH_MS / 1000 * 1.5);
    if (ambTimer === null) {
      if (ambNext < c.currentTime) ambNext = c.currentTime + 0.1;
      ambTimer = window.setInterval(ambTick, 250);
      ambTick();
    }
    ambOn = true;
  }

  function stopAmbience(): void {
    ambOn = false;
    if (ambTimer !== null) { clearInterval(ambTimer); ambTimer = null; }
    const c = ctx;
    if (c && ambBus) {
      const g = ambBus.gain;
      g.cancelScheduledValues(c.currentTime);
      g.setValueAtTime(Math.max(0.0001, g.value), c.currentTime);
      g.linearRampToValueAtTime(0.0001, c.currentTime + SWITCH_MS / 1000);
    }
    if (ambTeardown !== null) clearTimeout(ambTeardown);
    ambTeardown = window.setTimeout(() => {
      ambTeardown = null;
      if (!ambOn) ambStopNodes();
    }, SWITCH_MS + 300);
  }

  function updateAmbience(): void {
    try {
      if (wantAmbience()) {
        if (!ambOn) startAmbience();
        else if (ctx && ambBus) ambBus.gain.setTargetAtTime(Math.max(0.0001, ambTarget()), ctx.currentTime, 0.1);
      } else if (ambOn) {
        stopAmbience();
      }
    } catch { /* ignore */ }
  }

  /* ----------------------------- MUSIC ----------------------------- */
  // One player (own <audio> element, shuffle order and position) per playlist,
  // so switching scenes crossfades and returning resumes where it left off.
  type ListKey = Scene;
  interface Player {
    key: ListKey; tracks: string[]; order: string[]; pos: number;
    el: HTMLAudioElement | null; level: number; fadeTimer: number | null;
    fadingOut: boolean; failures: number;
  }
  const SWITCH_MS = 1200;
  let lists: Record<ListKey, string[]> | null = null;
  let loading: Promise<void> | null = null;
  const players: Partial<Record<ListKey, Player>> = {};
  let scene: Scene = 'cafe';
  let activeKey: ListKey | null = null;

  const musicTarget = () => (settings.music ? Math.pow(clamp01(settings.musicVolume), 1.6) * 0.8 : 0);
  const wantMusic = () => unlocked && settings.music && settings.musicVolume > 0
    && !(typeof document !== 'undefined' && document.hidden);

  const strList = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((t): t is string => typeof t === 'string' && !!t) : [];

  /** Playlist for a scene; null = no track music (konbini plays its synth ambience). */
  function resolveKey(sc: Scene): ListKey | null {
    if (!lists) return 'cafe';
    if ((lists[sc]?.length ?? 0) > 0) return sc;
    return sc === 'konbini' ? null : 'cafe';
  }

  function loadPlaylist(): Promise<void> {
    if (loading) return loading;
    loading = (async () => {
      try {
        const res = await fetch('./music/playlist.json', { cache: 'no-cache' });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json() as { tracks?: unknown; home?: unknown; konbini?: unknown };
        lists = { cafe: strList(data?.tracks), home: strList(data?.home), konbini: strList(data?.konbini) };
      } catch {
        lists = { cafe: [], home: [], konbini: [] };
      }
      activeKey = resolveKey(scene);
      updateAmbience();
    })();
    return loading;
  }

  function getPlayer(key: ListKey): Player {
    let p = players[key];
    if (!p) {
      p = { key, tracks: lists?.[key] ?? [], order: [], pos: 0, el: null, level: 0, fadeTimer: null, fadingOut: false, failures: 0 };
      players[key] = p;
    }
    return p;
  }

  function shuffle(p: Player): void {
    const prev = p.order[p.order.length - 1];
    p.order = [...p.tracks];
    for (let i = p.order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [p.order[i], p.order[j]] = [p.order[j], p.order[i]];
    }
    if (p.order.length > 1 && p.order[0] === prev) [p.order[0], p.order[1]] = [p.order[1], p.order[0]];
    p.pos = 0;
  }

  function trackUrl(name: string): string {
    const path = name.split('/').map(encodeURIComponent).join('/');
    try { return new URL('./music/' + path, document.baseURI).href; } catch { return './music/' + path; }
  }

  function setVol(p: Player): void {
    try { if (p.el) p.el.volume = clamp01(musicTarget() * p.level); } catch { /* ignore */ }
  }

  function stopFade(p: Player): void {
    if (p.fadeTimer !== null) clearInterval(p.fadeTimer);
    p.fadeTimer = null;
  }

  /** Fade a player's level toward `to` over ms, then call done. */
  function fade(p: Player, to: number, ms: number, done?: () => void): void {
    stopFade(p);
    const from = p.level;
    const start = performance.now();
    p.fadeTimer = window.setInterval(() => {
      try {
        const k = Math.min(1, (performance.now() - start) / Math.max(1, ms));
        p.level = from + (to - from) * k;
        setVol(p);
        if (k >= 1) { stopFade(p); done?.(); }
      } catch { stopFade(p); }
    }, 50);
  }

  const isActive = (p: Player) => p.key === activeKey;

  function ensureEl(p: Player): HTMLAudioElement {
    if (p.el) return p.el;
    const el = new Audio();
    el.preload = 'auto';
    el.addEventListener('ended', () => next(p, 1800));
    el.addEventListener('error', () => {
      p.failures++;
      if (p.failures < p.tracks.length * 2) setTimeout(() => next(p, 1800), 300);
    });
    el.addEventListener('playing', () => { p.failures = 0; });
    el.addEventListener('timeupdate', () => {
      if (p.fadingOut || !isActive(p) || !isFinite(el.duration)) return;
      if (el.duration - el.currentTime < 2.2 && el.duration > 6) {
        p.fadingOut = true;
        fade(p, 0, 2000);
      }
    });
    p.el = el;
    return el;
  }

  function next(p: Player, fadeMs: number): void {
    try {
      if (p.tracks.length === 0) return;
      if (p.pos >= p.order.length) shuffle(p);
      const name = p.order[p.pos++];
      const a = ensureEl(p);
      p.fadingOut = false;
      a.src = trackUrl(name);
      p.level = 0; setVol(p);
      if (!wantMusic() || !isActive(p)) return;
      void a.play().then(() => { if (isActive(p)) fade(p, 1, fadeMs); }).catch(() => { /* autoplay blocked or bad file */ });
    } catch { /* silent */ }
  }

  async function startMusic(fadeMs = 1200): Promise<void> {
    try {
      await loadPlaylist();
      if (!activeKey || !wantMusic()) return;
      const p = getPlayer(activeKey);
      if (p.tracks.length === 0) return;
      const el = p.el;
      if (el && el.src && el.paused && !el.ended) {
        void el.play().then(() => { if (isActive(p)) fade(p, p.fadingOut ? 0 : 1, fadeMs); }).catch(() => {});
        return;
      }
      if (el && el.src && !el.paused) { fade(p, p.fadingOut ? 0 : 1, Math.min(fadeMs, 600)); return; }
      if (p.order.length === 0) shuffle(p);
      next(p, fadeMs);
    } catch { /* silent */ }
  }

  function stopPlayer(p: Player, immediate: boolean, ms = 700): void {
    const el = p.el;
    if (!el || el.paused) { stopFade(p); p.level = 0; return; }
    if (immediate) {
      stopFade(p);
      p.level = 0; setVol(p);
      try { el.pause(); } catch { /* ignore */ }
      return;
    }
    fade(p, 0, ms, () => {
      // only pause if nobody revived this player meanwhile
      if (!isActive(p) || !wantMusic()) { try { el.pause(); } catch { /* ignore */ } }
    });
  }

  function stopMusic(immediate: boolean): void {
    for (const p of Object.values(players)) if (p) stopPlayer(p, immediate);
  }

  function switchScene(sc: Scene): void {
    scene = sc;
    if (!lists) return; // applied once the playlist loads
    updateAmbience();
    const key = resolveKey(sc);
    if (key === activeKey) return;
    const old = activeKey ? players[activeKey] : undefined;
    activeKey = key;
    if (old) stopPlayer(old, false, SWITCH_MS);
    void startMusic(SWITCH_MS);
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      try {
        if (document.hidden) {
          stopMusic(true);
          updateAmbience();
          try { synth()?.cancel(); } catch { /* ignore */ }
          if (ctx && ctx.state === 'running') void ctx.suspend().catch(() => {});
        } else {
          if (ctx && ctx.state === 'suspended' && unlocked) void ctx.resume().catch(() => {});
          void startMusic();
          updateAmbience();
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
          warmVoices();
        }
        if (ctx && ctx.state === 'suspended') void ctx.resume().catch(() => {});
        void startMusic();
        updateAmbience();
      } catch { /* ignore */ }
    },
    playSfx,
    applySettings(s: Settings) {
      try {
        settings = { ...DEFAULTS, ...s };
        if (master && ctx) master.gain.setTargetAtTime(sfxGain(), ctx.currentTime, 0.02);
        for (const p of Object.values(players)) if (p) setVol(p);
        if (wantMusic()) void startMusic(); else stopMusic(false);
        updateAmbience();
        if (!settings.sfx || settings.sfxVolume <= 0) { try { synth()?.cancel(); } catch { /* ignore */ } }
      } catch { /* ignore */ }
    },
    setScene(sc: Scene) {
      try { switchScene(sc); } catch { /* ignore */ }
    },
  };
}

function clamp01(v: number): number {
  return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
}
