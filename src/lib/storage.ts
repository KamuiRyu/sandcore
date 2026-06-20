export const appStorage = {
  getItem(key: string): string | null {
    if (typeof window !== 'undefined' && window.ipcRenderer && window.ipcRenderer.sendSync) {
      try {
        const val = window.ipcRenderer.sendSync('get-storage-sync', key);
        if (val !== undefined && val !== null) {
          return val;
        }
      } catch (e) {
        console.error('Failed to get item from IPC storage', key, e);
      }
    }
    // Fallback to localStorage for web/dev testing
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem(key: string, value: string): void {
    if (typeof window !== 'undefined' && window.ipcRenderer && window.ipcRenderer.send) {
      try {
        window.ipcRenderer.send('set-storage', key, value);
        // Also set locally so that web-based events like 'storage' still somewhat work,
        // though we rely on our own custom events usually.
      } catch (e) {
        console.error('Failed to set item in IPC storage', key, e);
      }
    }
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  },

  removeItem(key: string): void {
    if (typeof window !== 'undefined' && window.ipcRenderer && window.ipcRenderer.send) {
      try {
        window.ipcRenderer.send('set-storage', key, null);
      } catch (e) {
        console.error('Failed to remove item in IPC storage', key, e);
      }
    }
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
};
