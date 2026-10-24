import {
  __name
} from "./chunk-SHUYVCID.js";

// src/js/ajax.js
var HttpError = class extends Error {
  static {
    __name(this, "HttpError");
  }
  constructor(response) {
    super(`HTTP ${response.status}`);
    this.name = "HttpError";
    this.status = response.status;
    this.response = response;
  }
};
async function request(url, { type = "text", ...options } = {}) {
  if (!["text", "json"].includes(type)) throw new TypeError(`Nezn\xE1m\xFD typ: ${type}`);
  const response = await fetch(url, options);
  if (!response.ok) throw new HttpError(response);
  return type === "json" ? response.json() : response.text();
}
__name(request, "request");
function createLoader(target) {
  let controller;
  let sequence = 0;
  let destroyed = false;
  const initialBusy = target.getAttribute("aria-busy");
  const restoreBusy = /* @__PURE__ */ __name(() => {
    if (initialBusy === null) target.removeAttribute("aria-busy");
    else target.setAttribute("aria-busy", initialBusy);
  }, "restoreBusy");
  const cancel = /* @__PURE__ */ __name(() => {
    sequence++;
    controller?.abort();
    restoreBusy();
  }, "cancel");
  return {
    async load(url, { format = "text", ...options } = {}) {
      if (destroyed) throw new Error("Loader byl odpojen.");
      if (!["text", "html"].includes(format)) throw new TypeError(`Nezn\xE1m\xFD form\xE1t: ${format}`);
      cancel();
      controller = new AbortController();
      const current = sequence;
      const externalSignal = options.signal;
      const abort = /* @__PURE__ */ __name(() => controllerForRequest.abort(), "abort");
      const controllerForRequest = controller;
      if (externalSignal?.aborted) abort();
      else externalSignal?.addEventListener("abort", abort, { once: true });
      target.setAttribute("aria-busy", "true");
      try {
        const result = await request(url, { ...options, type: "text", signal: controllerForRequest.signal });
        if (current !== sequence || controllerForRequest.signal.aborted) return null;
        if (format === "html") {
          const { htmlFragment } = await import("./html-TON3XT2W.js");
          if (current !== sequence || controllerForRequest.signal.aborted) return null;
          target.replaceChildren(htmlFragment(result, target.ownerDocument));
        } else target.textContent = result;
        return result;
      } catch (error) {
        if (controllerForRequest.signal.aborted || current !== sequence) return null;
        throw error;
      } finally {
        externalSignal?.removeEventListener("abort", abort);
        if (current === sequence) restoreBusy();
      }
    },
    cancel,
    destroy() {
      cancel();
      destroyed = true;
    }
  };
}
__name(createLoader, "createLoader");

export {
  HttpError,
  request,
  createLoader
};
