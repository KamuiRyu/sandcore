import { app, BrowserWindow, ipcMain, screen, globalShortcut } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion')
app.commandLine.appendSwitch('disable-background-timer-throttling')

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let loginWin: BrowserWindow | null = null
let sidebarWin: BrowserWindow | null = null
let currentLayoutSide: 'left' | 'right' = 'right'

// Config management
const configPath = path.join(app.getPath('userData'), 'config.json')

let registeredShortcutMap: string | null = null
let registeredShortcutSettings: string | null = null

function updateShortcutMap(newShortcut: string): boolean {
  if (registeredShortcutMap === newShortcut) return true

  if (registeredShortcutMap) {
    globalShortcut.unregister(registeredShortcutMap)
    registeredShortcutMap = null
  }

  if (!newShortcut) return true

  try {
    const success = globalShortcut.register(newShortcut, () => {
      if (sidebarWin && !sidebarWin.isDestroyed()) {
        if (sidebarWin.isMinimized()) {
          sidebarWin.restore()
          sidebarWin.focus()
          resizeSingleWindow('map')
        } else if (sidebarWin.isFocused() && currentTabId === 'map') {
          resizeSingleWindow(null)
        } else {
          sidebarWin.focus()
          resizeSingleWindow('map')
        }
      }
    })
    
    if (success) {
      registeredShortcutMap = newShortcut
    }
    return success
  } catch (err) {
    console.error('Failed to register map shortcut:', err)
    return false
  }
}

function updateShortcutSettings(newShortcut: string): boolean {
  if (registeredShortcutSettings === newShortcut) return true

  if (registeredShortcutSettings) {
    globalShortcut.unregister(registeredShortcutSettings)
    registeredShortcutSettings = null
  }

  if (!newShortcut) return true

  try {
    const success = globalShortcut.register(newShortcut, () => {
      if (sidebarWin && !sidebarWin.isDestroyed()) {
        if (sidebarWin.isMinimized()) {
          sidebarWin.restore()
          sidebarWin.focus()
          resizeSingleWindow('settings')
        } else if (sidebarWin.isFocused() && currentTabId === 'settings') {
          resizeSingleWindow(null)
        } else {
          sidebarWin.focus()
          resizeSingleWindow('settings')
        }
      }
    })
    
    if (success) {
      registeredShortcutSettings = newShortcut
    }
    return success
  } catch (err) {
    console.error('Failed to register settings shortcut:', err)
    return false
  }
}

function loadConfig() {
  const defaults = { alwaysOnTop: true, inGameNotifs: true, volume: 80, completedMarkers: [], favoritesList: [], layoutSide: 'right', sidebarOpacity: 95, uiScale: 100, shortcutMap: 'CommandOrControl+Alt+M', shortcutSettings: 'CommandOrControl+Alt+S' }
  try {
    if (fs.existsSync(configPath)) {
      return { ...defaults, ...JSON.parse(fs.readFileSync(configPath, 'utf-8')) }
    }
  } catch (e) {
    console.error('Failed to load config', e)
  }
  return defaults
}

function saveConfig(config: any) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
  } catch (e) {
    console.error('Failed to save config', e)
  }
}

let appConfig = loadConfig()

function createLoginWindow() {
  if (loginWin && !loginWin.isDestroyed()) {
    loginWin.focus()
    return
  }
  const preloadPath = path.join(process.env.DIST!, '../dist-electron/preload.js')
  const zoom = (appConfig.uiScale || 100) / 100

  loginWin = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC!, 'favicon.ico'),
    width: Math.round(800 * zoom),
    height: Math.round(600 * zoom),
    resizable: false,
    frame: false,
    transparent: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    alwaysOnTop: false,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  loginWin.webContents.on('dom-ready', () => {
    loginWin?.webContents.setZoomFactor(zoom)
  })

  // Open DevTools automatically to see errors - can be commented out later
  //loginWin.webContents.openDevTools()

  if (process.env.VITE_DEV_SERVER_URL) {
    loginWin.loadURL(`${process.env.VITE_DEV_SERVER_URL}?windowType=login`)
  } else {
    loginWin.loadFile(path.join(process.env.DIST!, 'index.html'), { query: { windowType: 'login' } })
  }

  setupMoveListeners(loginWin)
}

let currentTabId: string | null = null
let moveTimeout: NodeJS.Timeout | null = null
let isProgrammaticMove = false

function safeSetBounds(win: BrowserWindow, bounds: { x: number; y: number; width: number; height: number }) {
  if (!win || win.isDestroyed()) return
  isProgrammaticMove = true
  const wasResizable = win.isResizable()
  win.setResizable(true)
  win.setBounds(bounds)
  win.setResizable(wasResizable)
  setTimeout(() => {
    isProgrammaticMove = false
  }, 100)
}

function setupMoveListeners(win: BrowserWindow) {
  win.on('moved', () => {
    if (isProgrammaticMove) return
    if (moveTimeout) clearTimeout(moveTimeout)
    handleWindowMoved(win)
  })

  win.on('move', () => {
    if (isProgrammaticMove) return
    if (moveTimeout) clearTimeout(moveTimeout)
    moveTimeout = setTimeout(() => {
      handleWindowMoved(win)
    }, 300)
  })
}

function createSidebarWindow() {
  if (sidebarWin && !sidebarWin.isDestroyed()) {
    sidebarWin.focus()
    return
  }
  const preloadPath = path.join(process.env.DIST!, '../dist-electron/preload.js')
  currentLayoutSide = 'right'
  currentTabId = null
  const zoom = (appConfig.uiScale || 100) / 100

  sidebarWin = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC!, 'favicon.ico'),
    width: Math.round(60 * zoom),
    height: Math.round(360 * zoom),
    resizable: false,
    frame: false,
    transparent: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    alwaysOnTop: appConfig.alwaysOnTop,
    skipTaskbar: false, // User might want it in taskbar, but we'll see
    focusable: true,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false, // Ensure performance remains high
    },
  })

  sidebarWin.setFullScreenable(false)
  sidebarWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  sidebarWin.setMenu(null)

  if (appConfig.alwaysOnTop) {
    sidebarWin.setAlwaysOnTop(true, 'screen-saver', 1)
  }

  // Prevent the window from being minimized by the system when losing focus to a fullscreen app
  sidebarWin.on('blur', () => {
    if (appConfig.alwaysOnTop && sidebarWin) {
      sidebarWin.setAlwaysOnTop(true, 'screen-saver', 1)
    }
  })

  sidebarWin.on('minimize' as any, (e: { preventDefault: () => void }) => {
    if (appConfig.alwaysOnTop) {
      e.preventDefault()
      sidebarWin?.restore()
    }
  })

  sidebarWin.webContents.on('dom-ready', () => {
    sidebarWin?.webContents.setZoomFactor(zoom)
  })

  // Open DevTools automatically to see errors - can be commented out later
  sidebarWin.webContents.openDevTools()

  if (process.env.VITE_DEV_SERVER_URL) {
    sidebarWin.loadURL(`${process.env.VITE_DEV_SERVER_URL}?windowType=sidebar`)
  } else {
    sidebarWin.loadFile(path.join(process.env.DIST!, 'index.html'), { query: { windowType: 'sidebar' } })
  }

  setupMoveListeners(sidebarWin)
}

let pendingBounds: { x: number; y: number; width: number; height: number } | null = null
let resizeTimeout: NodeJS.Timeout | null = null

function resizeSingleWindow(tabId: string | null, immediate = false) {
  if (!sidebarWin || sidebarWin.isDestroyed()) return

  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
    resizeTimeout = null
  }

  // If not immediate, and we are switching/closing from an open tab, do a transition
  if (!immediate && currentTabId !== null && currentTabId !== tabId) {
    // Start transition: fade out the active panel
    sidebarWin.webContents.send('layout-updated', { tabId: null, layoutSide: appConfig.layoutSide || 'right' })
    
    // Wait for fade out to complete, then perform resize
    resizeTimeout = setTimeout(() => {
      resizeTimeout = null
      resizeSingleWindow(tabId, true)
    }, 300)
    return
  }

  currentTabId = tabId

  const zoom = (appConfig.uiScale || 100) / 100

  const [curX, curY] = sidebarWin.getPosition()
  const [curW, curH] = sidebarWin.getSize()

  const physicalSidebarW = Math.round(60 * zoom)

  // Calculate sidebar's current absolute position
  let sidebarX = curX
  if (currentLayoutSide === 'left' && curW > physicalSidebarW) {
    sidebarX = curX + curW - physicalSidebarW
  }

  // Calculate panel dimensions
  let panelW = 0
  let panelH = 0
  if (tabId === 'map') {
    panelW = 1200
    panelH = 800
  } else if (tabId) {
    panelW = 450
    panelH = 550
  }

  // Calculate total window dimensions (Sidebar 60 + Gap 12 + Panel width)
  const newW = panelW > 0 ? 60 + 12 + panelW : 60
  const newH = panelW > 0 ? Math.max(360, panelH) : 360

  const physicalNewW = Math.round(newW * zoom)
  const physicalNewH = Math.round(newH * zoom)

  // Calculate display work area and gap
  const display = screen.getDisplayMatching(sidebarWin.getBounds())
  const workArea = display.workArea
  const gap = 12

  const nextLayoutSide: 'left' | 'right' = appConfig.layoutSide || 'right'

  let nextX = sidebarX
  if (nextLayoutSide === 'left' && panelW > 0) {
    nextX = sidebarX - Math.round((panelW + gap) * zoom)
  }

  // Enforce screen bounds check for the entire window horizontally
  if (nextX + physicalNewW > workArea.x + workArea.width) {
    nextX = workArea.x + workArea.width - physicalNewW
  }
  if (nextX < workArea.x) {
    nextX = workArea.x
  }

  let nextY = curY
  if (nextY + physicalNewH > workArea.y + workArea.height) {
    nextY = workArea.y + workArea.height - physicalNewH
  }
  if (nextY < workArea.y) {
    nextY = workArea.y
  }

  // Determine if we need to update React before bounds (i.e. if transitioning to layout 'left' and expanding or shifting side)
  const needsReactFirst = (nextLayoutSide === 'left' && (physicalNewW > curW || currentLayoutSide === 'right'))

  currentLayoutSide = nextLayoutSide

  if (needsReactFirst) {
    pendingBounds = { x: nextX, y: nextY, width: physicalNewW, height: physicalNewH }
    sidebarWin.webContents.send('layout-updated', { tabId, layoutSide: nextLayoutSide })
  } else {
    pendingBounds = null
    safeSetBounds(sidebarWin, { x: nextX, y: nextY, width: physicalNewW, height: physicalNewH })
    sidebarWin.webContents.send('layout-updated', { tabId, layoutSide: nextLayoutSide })
  }
}

function handleWindowMoved(win: BrowserWindow) {
  if (!win || win.isDestroyed()) return

  const [curX, curY] = win.getPosition()
  const [curW, curH] = win.getSize()

  const display = screen.getDisplayMatching(win.getBounds())
  const workArea = display.workArea

  // Enforce screen bounds check for the entire window horizontally and vertically
  let adjustedX = curX
  if (adjustedX + curW > workArea.x + workArea.width) {
    adjustedX = workArea.x + workArea.width - curW
  }
  if (adjustedX < workArea.x) {
    adjustedX = workArea.x
  }

  let adjustedY = curY
  if (adjustedY + curH > workArea.y + workArea.height) {
    adjustedY = workArea.y + workArea.height - curH
  }
  if (adjustedY < workArea.y) {
    adjustedY = workArea.y
  }

  // If we shifted/adjusted bounds to keep it on-screen, apply programmatically
  if (adjustedX !== curX || adjustedY !== curY) {
    safeSetBounds(win, { x: adjustedX, y: adjustedY, width: curW, height: curH })
  }
}

// IPC Handlers
ipcMain.handle('get-config', () => appConfig)

ipcMain.handle('register-shortcut', (_event, { type, shortcut }) => {
  if (type === 'map') {
    return { success: updateShortcutMap(shortcut) }
  } else if (type === 'settings') {
    return { success: updateShortcutSettings(shortcut) }
  }
  return { success: false }
})

ipcMain.on('set-config', (_event, newConfig) => {
  appConfig = { ...appConfig, ...newConfig }
  saveConfig(appConfig)

  if (sidebarWin && !sidebarWin.isDestroyed()) {
    sidebarWin.webContents.send('config-updated', appConfig)
  }

  if ('shortcutMap' in newConfig) {
    updateShortcutMap(newConfig.shortcutMap)
  }
  if ('shortcutSettings' in newConfig) {
    updateShortcutSettings(newConfig.shortcutSettings)
  }

  if ('alwaysOnTop' in newConfig) {
    if (sidebarWin && !sidebarWin.isDestroyed()) {
      if (newConfig.alwaysOnTop) {
        sidebarWin.setAlwaysOnTop(true, 'screen-saver', 1)
      } else {
        sidebarWin.setAlwaysOnTop(false)
      }
    }
  }

  if ('layoutSide' in newConfig) {
    if (sidebarWin && !sidebarWin.isDestroyed() && currentTabId) {
      resizeSingleWindow(currentTabId)
    }
  }

  if ('uiScale' in newConfig) {
    const zoom = newConfig.uiScale / 100
    if (sidebarWin && !sidebarWin.isDestroyed()) {
      sidebarWin.webContents.setZoomFactor(zoom)
      resizeSingleWindow(currentTabId)
    }
    if (loginWin && !loginWin.isDestroyed()) {
      loginWin.webContents.setZoomFactor(zoom)
    }
  }
})

ipcMain.on('layout-ready', () => {
  if (sidebarWin && !sidebarWin.isDestroyed() && pendingBounds) {
    safeSetBounds(sidebarWin, pendingBounds)
    pendingBounds = null
  }
})

// Toggle panel layout inside the main window
ipcMain.on('toggle-panel-window', (_event, tabId) => {
  resizeSingleWindow(tabId)
})

// Close panel and resize window back to sidebar only
ipcMain.on('close-panel-window', () => {
  resizeSingleWindow(null, true)
})

// Minimize window
ipcMain.on('minimize-panel-window', () => {
  if (sidebarWin && !sidebarWin.isDestroyed()) {
    sidebarWin.minimize()
  }
})

ipcMain.on('window-control', (event, action) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  if (!window) return
  if (action === 'minimize') {
    window.minimize()
  } else if (action === 'close') {
    window.close()
  } else if (action === 'login-success') {
    createSidebarWindow()
    if (loginWin && !loginWin.isDestroyed()) {
      loginWin.close()
      loginWin = null
    }
  } else if (action === 'logout') {
    createLoginWindow()
    if (sidebarWin && !sidebarWin.isDestroyed()) {
      sidebarWin.close()
      sidebarWin = null
    }
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createLoginWindow()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.whenReady().then(() => {
  createLoginWindow()
  if (appConfig.shortcutMap) {
    updateShortcutMap(appConfig.shortcutMap)
  }
  if (appConfig.shortcutSettings) {
    updateShortcutSettings(appConfig.shortcutSettings)
  }
})
