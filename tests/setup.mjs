// Minimal chrome.storage.local mock for Node unit tests.
export function mockChrome() {
  const store = {};
  globalThis.chrome = {
    storage: {
      local: {
        get: async (key) =>
          typeof key === "string" ? { [key]: store[key] } : { ...store },
        set: async (obj) => {
          Object.assign(store, obj);
        },
      },
    },
  };
  return { store };
}
