import { createGame, createRenderer } from './engine';
import { createAudio, mountUI } from './ui';

const root = document.getElementById('app')!;
const game = createGame();
const audio = createAudio();
const ui = mountUI(root, game, audio);
const renderer = createRenderer(ui.sceneSvg, game);

// Development only (not in the built game): lets the browser console / screenshot scripts drive the game.
if (import.meta.env.DEV) (window as unknown as { game: typeof game }).game = game;

game.subscribe((e) => {
  if (e.type === 'sfx') audio.playSfx(e.name);
  // keeps music in sync when it's toggled from inside the café (tapping the record player)
  if (e.type === 'progress') audio.applySettings(game.state.progress.settings);
  if (e.type === 'scene') audio.setScene(e.scene);
});
audio.applySettings(game.state.progress.settings);

let last = performance.now();
function loop(now: number) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (!document.hidden) {
    game.update(dt);
    renderer.render();
    ui.frame();
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// pause() also writes the save to localStorage, so closing or backgrounding the app keeps progress
document.addEventListener('visibilitychange', () => {
  if (document.hidden) game.pause();
});
window.addEventListener('pagehide', () => game.pause());

// Offline support + "Add to Home Screen" (only in the built app, not the dev server)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* offline mode unavailable */ });
  });
}
