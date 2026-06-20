/// <reference types="vite/client" />

interface Window {
  ipcRenderer: {
    on: (channel: string, listener: (event: any, ...args: any[]) => void) => void
    off: (channel: string, listener: (event: any, ...args: any[]) => void) => void
    send: (channel: string, ...args: any[]) => void
    sendSync: (channel: string, ...args: any[]) => any
    invoke: (channel: string, ...args: any[]) => Promise<any>
    getConfig: () => Promise<any>
    setConfig: (config: any) => void
    getAuthSync: () => any
    setAuth: (authData: any) => void
  }
}
