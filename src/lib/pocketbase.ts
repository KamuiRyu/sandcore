import PocketBase, { BaseAuthStore } from 'pocketbase'

export const pocketbaseUrl =
  import.meta.env.VITE_POCKETBASE_URL?.trim() || 'http://127.0.0.1:8090'

class IPCAuthStore extends BaseAuthStore {
  constructor() {
    super()
    const stored = window.ipcRenderer?.getAuthSync?.()
    if (stored) {
      this.save(stored.token, stored.model)
    }
  }

  save(token: string, model: any) {
    super.save(token, model)
    window.ipcRenderer?.setAuth?.({ token, model })
  }

  clear() {
    super.clear()
    window.ipcRenderer?.setAuth?.(null)
  }
}

export const pb = new PocketBase(
  pocketbaseUrl,
  typeof window.ipcRenderer?.getAuthSync === 'function' ? new IPCAuthStore() : undefined
)
pb.autoCancellation(false)
