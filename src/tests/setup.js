// src/tests/setup.js
import "@testing-library/jest-dom";

// Suppress noisy but harmless React act() warnings
const _err = console.error.bind(console);
console.error = (...args) => {
  if (typeof args[0] === "string" && args[0].includes("not wrapped in act")) return;
  _err(...args);
};

// BroadcastChannel — not in jsdom
global.BroadcastChannel = class {
  constructor() {}
  postMessage() {}
  close() {}
  set onmessage(_) {}
};

// window.matchMedia — not in jsdom
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

// scrollIntoView — not in jsdom.
// VendorChatPage, CommunicationPage call messagesEndRef.current?.scrollIntoView()
// inside a useEffect whenever the messages array changes.
// Without this stub every test that triggers a message renders crashes with:
//   TypeError: messagesEndRef.current?.scrollIntoView is not a function
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// localStorage stub
const _store = {};
Object.defineProperty(window, "localStorage", {
  value: {
    getItem:    (k) => _store[k] ?? null,
    setItem:    (k, v) => { _store[k] = String(v); },
    removeItem: (k) => { delete _store[k]; },
    clear:      () => { Object.keys(_store).forEach((k) => delete _store[k]); },
  },
});