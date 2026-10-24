export const states = Object.freeze(['error', 'success', 'info']);
export function assertState(state) {
  if (!states.includes(state)) throw new TypeError(`Neznámý stav: ${state}`);
  return state;
}
