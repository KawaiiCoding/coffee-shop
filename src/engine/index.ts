/* ENGINE ENTRY. */
import type { GameApi } from '../types';
import { createGame as createGameImpl, type GameOptions } from './game';

export type { GameOptions } from './game';
export { createRenderer, type SceneRenderer } from './render';
export { WAITER_LOOK, BARISTA_LOOK } from './looks';
export { SAVE_KEY } from './save';

export function createGame(
  storage: Storage | null = typeof localStorage !== 'undefined' ? localStorage : null,
  opts: GameOptions = {},
): GameApi {
  return createGameImpl(storage, opts);
}
