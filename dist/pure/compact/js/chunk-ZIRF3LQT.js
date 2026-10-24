import {
  __name
} from "./chunk-SHUYVCID.js";

// src/js/states.js
var states = Object.freeze(["error", "success", "info"]);
function assertState(state) {
  if (!states.includes(state)) throw new TypeError(`Nezn\xE1m\xFD stav: ${state}`);
  return state;
}
__name(assertState, "assertState");

export {
  assertState
};
