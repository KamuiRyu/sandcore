import { app, BrowserWindow, ipcMain, screen, globalShortcut, shell } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import https from 'node:https'
import { execSync, spawn } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion')
app.commandLine.appendSwitch('disable-background-timer-throttling')

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let splashWin: BrowserWindow | null = null
let loginWin: BrowserWindow | null = null
let sidebarWin: BrowserWindow | null = null
let oauthInProgress = false
let currentLayoutSide: 'left' | 'right' = 'right'
let currentAlignSide: 'top' | 'bottom' = 'top'
let lastVisibleMain = 6
let lastVisibleAdmin = 2

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
          togglePanel('map')
        } else if (sidebarWin.isFocused() && currentTabId === 'map') {
          togglePanel(null)
        } else {
          sidebarWin.focus()
          togglePanel('map')
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
          togglePanel('settings')
        } else if (sidebarWin.isFocused() && currentTabId === 'settings') {
          togglePanel(null)
        } else {
          sidebarWin.focus()
          togglePanel('settings')
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
  const defaults = {
    alwaysOnTop: true,
    inGameNotifs: true,
    volume: 80,
    completedMarkers: [],
    favoritesList: [],
    layoutSide: 'right',
    sidebarOpacity: 95,
    uiScale: 100,
    shortcutMap: 'CommandOrControl+Alt+M',
    shortcutSettings: 'CommandOrControl+Alt+S',
    loginPosition: null,
    sidebarPosition: null
  }
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

const authPath = path.join(app.getPath('userData'), 'auth.json')

function loadAuth() {
  try {
    if (fs.existsSync(authPath)) {
      return JSON.parse(fs.readFileSync(authPath, 'utf-8'))
    }
  } catch (e) {
    console.error('Failed to load auth', e)
  }
  return null
}

function saveAuth(authData: any) {
  try {
    fs.writeFileSync(authPath, JSON.stringify(authData, null, 2))
  } catch (e) {
    console.error('Failed to save auth', e)
  }
}

let appAuth = loadAuth()

function isPositionOnSomeScreen(x: number, y: number, width: number, height: number): boolean {
  const displays = screen.getAllDisplays()
  return displays.some(display => {
    const b = display.bounds
    return (
      x + width > b.x &&
      x < b.x + b.width &&
      y + height > b.y &&
      y < b.y + b.height
    )
  })
}

function createSplashWindow() {
  if (splashWin && !splashWin.isDestroyed()) {
    splashWin.focus()
    return
  }

  const preloadPath = path.join(process.env.DIST!, '../dist-electron/preload.js')

  splashWin = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC!, 'favicon.ico'),
    width: 400,
    height: 400,
    resizable: false,
    frame: false,
    transparent: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    center: true,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    splashWin.loadURL(`${process.env.VITE_DEV_SERVER_URL}?windowType=splash`)
  } else {
    splashWin.loadFile(path.join(process.env.DIST!, 'index.html'), { query: { windowType: 'splash' } })
  }

  splashWin.on('closed', () => {
    splashWin = null
  })
}

function createLoginWindow() {
  if (loginWin && !loginWin.isDestroyed()) {
    loginWin.focus()
    return
  }
  const preloadPath = path.join(process.env.DIST!, '../dist-electron/preload.js')
  const zoom = (appConfig.uiScale || 100) / 100

  const width = Math.round(800 * zoom)
  const height = Math.round(600 * zoom)

  let x: number | undefined
  let y: number | undefined
  if (appConfig.loginPosition && isPositionOnSomeScreen(appConfig.loginPosition.x, appConfig.loginPosition.y, width, height)) {
    x = appConfig.loginPosition.x
    y = appConfig.loginPosition.y
  }

  loginWin = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC!, 'favicon.ico'),
    width,
    height,
    x,
    y,
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
  //loginWin.webContents.openDevTools({ mode: 'detach' })

  if (process.env.VITE_DEV_SERVER_URL) {
    loginWin.loadURL(`${process.env.VITE_DEV_SERVER_URL}?windowType=login`)
  } else {
    loginWin.loadFile(path.join(process.env.DIST!, 'index.html'), { query: { windowType: 'login' } })
  }

  loginWin.on('minimize', () => {
    if (oauthInProgress && loginWin && !loginWin.isDestroyed()) {
      loginWin.restore()
      loginWin.focus()
    }
  })

  loginWin.on('closed', () => {
    loginWin = null
    if (!sidebarWin || sidebarWin.isDestroyed()) {
      app.quit()
    }
  })

  setupMoveListeners(loginWin)
}

let currentTabId: string | null = null
const moveTimeout: NodeJS.Timeout | null = null
let isProgrammaticMove = false

function safeSetBounds(win: BrowserWindow, bounds: { x: number; y: number; width: number; height: number }) {
  if (!win || win.isDestroyed()) return
  isProgrammaticMove = true
  // On Windows, programmatic setBounds works regardless of the resizable flag.
  // Avoid setResizable(true/false) toggling which causes extra WM_NCCALCSIZE messages
  // and triggers extra repaints that cause visible flickering.
  win.setBounds(bounds)
  setTimeout(() => {
    isProgrammaticMove = false
  }, 100)
}

function setupMoveListeners(win: BrowserWindow) {
  win.on('move', () => {
    if (isProgrammaticMove) return
    handleWindowMoved(win)
  })
  win.on('moved', () => {
    if (isProgrammaticMove) return
    if (moveTimeout) clearTimeout(moveTimeout)
    handleWindowMoved(win)
  })
}

function forcePanelToFront() {
  if (panelWin && !panelWin.isDestroyed() && currentTabId) {
    if (appConfig.alwaysOnTop) {
      panelWin.setAlwaysOnTop(true, 'screen-saver', 1)
    }
    panelWin.showInactive()
    panelWin.moveTop()
  }
}

function getStorageValue(key: string): string | null {
  const filePath = path.join(app.getPath('userData'), `storage_${key}.json`)
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8')
    }
  } catch (e) {
    console.error('Failed to read storage', key, e)
  }
  return null
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

  // Calculate dynamic initial height based on user settings and roles
  const hiddenItemsRaw = getStorageValue('shinobi-map-sidebar-hidden')
  const hiddenItems = new Set<string>()
  if (hiddenItemsRaw) {
    try {
      const parsed = JSON.parse(hiddenItemsRaw)
      if (Array.isArray(parsed)) {
        parsed.forEach(item => hiddenItems.add(String(item)))
      }
    } catch (e) {
      console.error('Failed to parse hidden items', e)
    }
  }

  const role = appAuth?.model?.role || 'ninja'
  const isAdmin = role === 'admin'
  const isManager = role === 'manager' || role === 'admin'

  const mainMenuItemIds = ['map', 'missions', 'ninja-card', 'groups', 'stats', 'crafting']
  const visibleMain = mainMenuItemIds.filter(id => !hiddenItems.has(id)).length

  const visibleAdmin = [
    ...(isManager ? ['manager'] : []),
    ...(isAdmin ? ['admin'] : [])
  ].filter(id => !hiddenItems.has(id)).length

  lastVisibleMain = visibleMain
  lastVisibleAdmin = visibleAdmin

  const ITEM_H = 42
  const BASE_H = 192
  const rawH = BASE_H + visibleMain * ITEM_H + visibleAdmin * ITEM_H
  const height = Math.round(Math.max(rawH, 180) * zoom)
  const width = Math.round(56 * zoom)

  let x: number | undefined
  let y: number | undefined
  if (appConfig.sidebarPosition && isPositionOnSomeScreen(appConfig.sidebarPosition.x, appConfig.sidebarPosition.y, width, height)) {
    x = appConfig.sidebarPosition.x
    y = appConfig.sidebarPosition.y
  }

  sidebarWin = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC!, 'favicon.ico'),
    width,
    height,
    x,
    y,
    resizable: false,
    frame: false,
    transparent: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    minimizable: !appConfig.alwaysOnTop,
    alwaysOnTop: appConfig.alwaysOnTop,
    skipTaskbar: false,
    focusable: true,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false, // Ensure performance remains high
    },
  })

  // Enforce correct initial layout side based on the created bounds
  const bounds = sidebarWin.getBounds()
  const display = screen.getDisplayMatching(bounds)
  const workArea = display.workArea
  const workAreaCenterX = workArea.x + workArea.width / 2
  const sidebarCenterX = bounds.x + bounds.width / 2

  const initialLayoutSide = sidebarCenterX < workAreaCenterX ? 'right' : 'left'
  appConfig.layoutSide = initialLayoutSide
  currentLayoutSide = initialLayoutSide

  const workAreaCenterY = workArea.y + workArea.height / 2
  const sidebarCenterY = bounds.y + bounds.height / 2
  const initialAlignSide = sidebarCenterY < workAreaCenterY ? 'top' : 'bottom'
  currentAlignSide = initialAlignSide

  saveConfig(appConfig)

  sidebarWin.setFullScreenable(false)
  sidebarWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  sidebarWin.setMenu(null)
  sidebarWin.setOpacity(appConfig.sidebarOpacity / 100)

  if (appConfig.alwaysOnTop) {
    sidebarWin.setAlwaysOnTop(true, 'screen-saver', 1)
  }
  //sidebarWin.webContents.openDevTools({ mode: 'detach' })

  // Re-assert alwaysOnTop when the sidebar loses focus to prevent Windows from
  // dropping it behind other windows (e.g. VS Code) after the user clicks it.
  sidebarWin.on('blur', () => {
    if (appConfig.alwaysOnTop && sidebarWin && !sidebarWin.isDestroyed()) {
      sidebarWin.setAlwaysOnTop(true, 'screen-saver', 1)
    }
  })

  sidebarWin.on('focus', () => {
    if (!appConfig.alwaysOnTop) {
      forcePanelToFront()
    }
  })

  sidebarWin.on('minimize' as any, () => {
    if (panelWin && !panelWin.isDestroyed()) {
      panelWin.hide()
    }
  })

  sidebarWin.on('restore', () => {
    // Workaround for Electron Windows transparent window restore bug
    if (process.platform === 'win32') {
      sidebarWin?.hide()
      sidebarWin?.show()
    } else {
      sidebarWin?.show()
    }

    forcePanelToFront()
  })

  sidebarWin.webContents.on('dom-ready', () => {
    sidebarWin?.webContents.setZoomFactor(zoom)
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    sidebarWin.loadURL(`${process.env.VITE_DEV_SERVER_URL}?windowType=sidebar`)
  } else {
    sidebarWin.loadFile(path.join(process.env.DIST!, 'index.html'), { query: { windowType: 'sidebar' } })
  }

  sidebarWin.on('closed', () => {
    sidebarWin = null
    if (panelWin && !panelWin.isDestroyed()) {
      panelWin.destroy()
      panelWin = null
    }
    if (!loginWin || loginWin.isDestroyed()) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      BrowserWindow.getAllWindows().forEach(w => { try { w.destroy() } catch (_) { /* empty */ } })
      app.exit(0)
    }
  })

  setupMoveListeners(sidebarWin)
}

let panelWin: BrowserWindow | null = null

function createPanelWindow() {
  if (panelWin && !panelWin.isDestroyed()) return panelWin

  const preloadPath = path.join(process.env.DIST!, '../dist-electron/preload.js')
  const zoom = (appConfig.uiScale || 100) / 100

  panelWin = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC!, 'favicon.ico'),
    width: 0,
    height: 0,
    show: false,
    resizable: false,
    frame: false,
    transparent: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    alwaysOnTop: appConfig.alwaysOnTop,
    skipTaskbar: true,
    focusable: true,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
  })

  panelWin.setMenu(null)
  panelWin.setFullScreenable(false)
  panelWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  if (appConfig.alwaysOnTop) {
    panelWin.setAlwaysOnTop(true, 'screen-saver', 1)
  }

  panelWin.on('blur', () => {
    if (appConfig.alwaysOnTop && panelWin && !panelWin.isDestroyed()) {
      panelWin.setAlwaysOnTop(true, 'screen-saver', 1)
    }
  })

  panelWin.on('minimize' as any, () => {
    // Let it minimize naturally with its parent
  })

  panelWin.on('restore', () => {
    if (process.platform === 'win32') {
      panelWin?.hide()
      panelWin?.showInactive()
    } else {
      panelWin?.showInactive()
    }
  })

  panelWin.webContents.on('dom-ready', () => {
    panelWin?.webContents.setZoomFactor(zoom)
  })

  //panelWin.webContents.openDevTools({ mode: 'detach' })

  if (process.env.VITE_DEV_SERVER_URL) {
    panelWin.loadURL(`${process.env.VITE_DEV_SERVER_URL}?windowType=panel`)
  } else {
    panelWin.loadFile(path.join(process.env.DIST!, 'index.html'), { query: { windowType: 'panel' } })
  }

  panelWin.on('closed', () => {
    panelWin = null
    currentTabId = null
  })

  return panelWin
}

let closePanelTimeout: NodeJS.Timeout | null = null

function closePanel(immediate = false) {
  if (closePanelTimeout) {
    clearTimeout(closePanelTimeout)
    closePanelTimeout = null
  }

  currentTabId = null

  const payload = { tabId: null, layoutSide: currentLayoutSide, alignSide: currentAlignSide }
  if (sidebarWin && !sidebarWin.isDestroyed()) {
    sidebarWin.webContents.send('layout-updated', payload)
  }
  if (panelWin && !panelWin.isDestroyed()) {
    panelWin.webContents.send('layout-updated', payload)
  }

  if (!panelWin || panelWin.isDestroyed()) return

  if (immediate) {
    panelWin.hide()
  } else {
    // Wait for the React CSS transition (300ms) to finish fading out before hiding OS window
    closePanelTimeout = setTimeout(() => {
      closePanelTimeout = null
      if (panelWin && !panelWin.isDestroyed() && currentTabId === null) {
        panelWin.hide()
      }
    }, 300)
  }
}

function openPanel(tabId: string, immediate = false) {
  if (!sidebarWin || sidebarWin.isDestroyed()) return

  if (!immediate && currentTabId !== null && currentTabId !== tabId) {
    if (closePanelTimeout) {
      clearTimeout(closePanelTimeout)
    }
    const payload = { tabId: null, layoutSide: currentLayoutSide, alignSide: currentAlignSide }
    sidebarWin.webContents.send('layout-updated', payload)
    if (panelWin && !panelWin.isDestroyed()) {
      panelWin.webContents.send('layout-updated', payload)
    }

    closePanelTimeout = setTimeout(() => {
      closePanelTimeout = null
      openPanel(tabId, true)
    }, 300)
    return
  }

  if (closePanelTimeout) {
    clearTimeout(closePanelTimeout)
    closePanelTimeout = null
  }

  currentTabId = tabId
  const panel = panelWin || createPanelWindow()

  const zoom = (appConfig.uiScale || 100) / 100
  const [curX, curY] = sidebarWin.getPosition()

  const physicalSidebarW = Math.round(60 * zoom)
  const physicalSidebarH = Math.round(580 * zoom)

  const largeTabs = ['map', 'admin', 'manager']
  const isLargeTab = largeTabs.includes(tabId)
  let panelLogicalW = isLargeTab ? 1200 : 450
  let panelLogicalH = isLargeTab ? 800 : 550

  const physicalPanelW = Math.round(panelLogicalW * zoom)
  const physicalPanelH = Math.round(panelLogicalH * zoom)
  const physicalGap = Math.round(12 * zoom)

  const display = screen.getDisplayMatching(sidebarWin.getBounds())
  const workArea = display.workArea

  const sidebarCenterX = curX + physicalSidebarW / 2
  const workAreaCenterX = workArea.x + workArea.width / 2
  const nextLayoutSide: 'left' | 'right' = sidebarCenterX < workAreaCenterX ? 'right' : 'left'

  if (nextLayoutSide !== appConfig.layoutSide) {
    appConfig.layoutSide = nextLayoutSide
    saveConfig(appConfig)
    sidebarWin.webContents.send('config-updated', appConfig)
    if (panelWin && !panelWin.isDestroyed()) {
      panelWin.webContents.send('config-updated', appConfig)
    }
  }

  const sidebarCenterY = curY + physicalSidebarH / 2
  const workAreaCenterY = workArea.y + workArea.height / 2
  const nextAlignSide: 'top' | 'bottom' = sidebarCenterY < workAreaCenterY ? 'top' : 'bottom'

  currentLayoutSide = nextLayoutSide
  currentAlignSide = nextAlignSide

  // Calculate panel position relative to sidebar
  let panelX = nextLayoutSide === 'left' ? curX - physicalGap - physicalPanelW : curX + physicalSidebarW + physicalGap
  let panelY = nextAlignSide === 'bottom' ? (curY + physicalSidebarH) - physicalPanelH : curY

  // Screen clamping for the panel
  if (panelX + physicalPanelW > workArea.x + workArea.width) {
    panelX = workArea.x + workArea.width - physicalPanelW
  }
  if (panelX < workArea.x) {
    panelX = workArea.x
  }

  if (panelY + physicalPanelH > workArea.y + workArea.height) {
    panelY = workArea.y + workArea.height - physicalPanelH
  }
  if (panelY < workArea.y) {
    panelY = workArea.y
  }

  panel.setBounds({ x: panelX, y: panelY, width: physicalPanelW, height: physicalPanelH })

  if (panel.isMinimized()) {
    panel.restore()
  }

  // Force Z-order elevation before showing
  if (appConfig.alwaysOnTop) {
    panel.setAlwaysOnTop(true, 'screen-saver', 1)
  } else {
    panel.setAlwaysOnTop(false)
  }

  // Force show unconditionally
  panel.showInactive()
  panel.moveTop()

  const payload = { tabId, layoutSide: nextLayoutSide, alignSide: nextAlignSide }
  sidebarWin.webContents.send('layout-updated', payload)
  panel.webContents.send('layout-updated', payload)
}

function togglePanel(tabId: string | null) {
  if (!tabId) {
    closePanel()
  } else {
    openPanel(tabId)
  }
}


function handleWindowMoved(win: BrowserWindow) {
  if (win === panelWin) return
  if (win.isMinimized()) return

  const [curX, curY] = win.getPosition()
  const [curW, curH] = win.getSize()

  const display = screen.getDisplayMatching(win.getBounds())
  const workArea = display.workArea

  // Enforce screen bounds check for the window
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

  if (win === loginWin) {
    appConfig.loginPosition = { x: adjustedX, y: adjustedY }
    saveConfig(appConfig)
    if (adjustedX !== curX || adjustedY !== curY) {
      safeSetBounds(win, { x: adjustedX, y: adjustedY, width: curW, height: curH })
    }
  } else if (win === sidebarWin) {
    appConfig.sidebarPosition = { x: adjustedX, y: adjustedY }
    saveConfig(appConfig)

    if (adjustedX !== curX || adjustedY !== curY) {
      safeSetBounds(win, { x: adjustedX, y: adjustedY, width: curW, height: curH })
    }

    if (currentTabId) {
      openPanel(currentTabId)
    }
  }
}

// IPC Handlers
ipcMain.on('open-external-url', (_event, url: string) => {
  shell.openExternal(url)
})

ipcMain.handle('get-config', () => appConfig)
ipcMain.handle('get-app-version', () => app.getVersion())

ipcMain.on('get-auth-sync', (event) => {
  event.returnValue = appAuth
})

ipcMain.on('set-auth', (event, authData) => {
  appAuth = authData
  saveAuth(appAuth)
})

ipcMain.on('get-storage-sync', (event, key) => {
  const filePath = path.join(app.getPath('userData'), `storage_${key}.json`)
  try {
    if (fs.existsSync(filePath)) {
      event.returnValue = fs.readFileSync(filePath, 'utf-8')
      return
    }
  } catch (e) {
    console.error('Failed to read storage', key, e)
  }
  event.returnValue = null
})

ipcMain.on('set-storage', (event, key, value) => {
  const filePath = path.join(app.getPath('userData'), `storage_${key}.json`)
  try {
    if (value === null) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    } else {
      fs.writeFileSync(filePath, value)
    }
  } catch (e) {
    console.error('Failed to write storage', key, e)
  }
})


// ── Auto Updater (GitHub Releases + GoshiUpdater) ────────────────────────────

const GITHUB_OWNER = 'KamuiRyu'
const GITHUB_REPO = 'sandcore'

function fetchLatestRelease(): Promise<{ version: string; releaseNotes: string }> {
  return new Promise((resolve, reject) => {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`
    https.get(url, { headers: { 'User-Agent': 'sandcore-app' } }, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        return reject(new Error(`Redirect inesperado: ${res.headers.location}`))
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`))
      let data = ''
      res.on('data', (chunk: Buffer) => (data += chunk))
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          const version = ((json.tag_name as string) || '').replace(/^v/, '')
          const releaseNotes = (json.body as string) || ''
          resolve({ version, releaseNotes })
        } catch {
          reject(new Error('Resposta inválida da API do GitHub'))
        }
      })
      res.on('error', reject)
    }).on('error', reject)
  })
}

function getInstallDir(): string | null {
  const appId = 'com.hyoou.sandcore'
  const regKeys = [
    `HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${appId}`,
    `HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${appId}`,
    `HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${appId}`,
  ]
  for (const key of regKeys) {
    try {
      const result = execSync(`reg query "${key}" /v InstallLocation`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      const match = result.match(/InstallLocation\s+REG_SZ\s+(.+)/)
      if (match) return match[1].trim()
    } catch { /* chave não existe, tenta a próxima */ }
  }
  return null
}

function broadcastUpdateStatus(payload: object) {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed() && win.webContents) {
      win.webContents.send('update-status', payload)
    }
  })
}

ipcMain.on('check-for-updates', (event) => {
  if (!app.isPackaged) {
    event.sender.send('update-status', { status: 'checking' })
    setTimeout(() => {
      event.sender.send('update-status', {
        status: 'available',
        version: '99.0.0',
        releaseNotes: 'Simulação de update em desenvolvimento.',
      })
    }, 1500)
    return
  }

  broadcastUpdateStatus({ status: 'checking' })

  fetchLatestRelease()
    .then(({ version, releaseNotes }) => {
      const current = app.getVersion()
      if (version && version !== current) {
        broadcastUpdateStatus({ status: 'available', version, releaseNotes })
      } else {
        broadcastUpdateStatus({ status: 'not-available' })
      }
    })
    .catch((err) => {
      broadcastUpdateStatus({ status: 'error', message: err?.message || 'Erro de conexão' })
    })
})

ipcMain.on('quit-and-install-update', () => {
  if (!app.isPackaged) {
    console.log('Simulando lançamento do GoshiUpdater (modo desenvolvimento).')
    app.exit(0)
    return
  }

  const installDir = getInstallDir()
  if (!installDir) {
    broadcastUpdateStatus({ status: 'error', message: 'Não foi possível localizar o diretório de instalação no registro.' })
    return
  }

  const updaterPath = path.join(process.resourcesPath, 'GoshiUpdater.exe')
  if (!fs.existsSync(updaterPath)) {
    broadcastUpdateStatus({ status: 'error', message: 'GoshiUpdater.exe não encontrado nos recursos do app.' })
    return
  }

  const child = spawn(updaterPath, ['--install-dir', installDir], {
    detached: true,
    stdio: 'ignore',
  })
  child.unref()

  app.exit(0)
})

ipcMain.handle('register-shortcut', (_event, { type, shortcut }) => {
  if (type === 'map') {
    return { success: updateShortcutMap(shortcut) }
  } else if (type === 'settings') {
    return { success: updateShortcutSettings(shortcut) }
  }
  return { success: false }
})

function applySidebarResize(visibleMain: number, visibleAdmin: number) {
  if (!sidebarWin || sidebarWin.isDestroyed()) return
  const zoom = (appConfig.uiScale || 100) / 100
  const ITEM_H = 46   // 44px button height + 2px flex gap
  const BASE_H = 252  // logo(56) + top-divider(9) + main-nav-padding(16) + bottom-nav(163) + buffer(8)
  const rawH = BASE_H + visibleMain * ITEM_H + visibleAdmin * ITEM_H
  const newHeight = Math.round(Math.max(rawH, 180) * zoom)
  const newWidth = Math.round(56 * zoom)
  const [curX, curY] = sidebarWin.getPosition()
  sidebarWin.setBounds({ x: curX, y: curY, width: newWidth, height: newHeight })
}

ipcMain.on('resize-sidebar', (_event, { visibleMain, visibleAdmin }: { visibleMain: number; visibleAdmin: number }) => {
  lastVisibleMain = visibleMain
  lastVisibleAdmin = visibleAdmin
  applySidebarResize(visibleMain, visibleAdmin)
})

ipcMain.on('update-sidebar-hidden', (_event, { hiddenItems }: { hiddenItems: string[] }) => {
  const role = appAuth?.model?.role || 'ninja'
  const isAdmin = role === 'admin'
  const isManager = role === 'manager' || role === 'admin'
  const hidden = new Set(hiddenItems)
  const mainMenuItemIds = ['map', 'missions', 'ninja-card', 'groups', 'stats', 'crafting']
  const visibleMain = mainMenuItemIds.filter(id => !hidden.has(id)).length
  const visibleAdmin = [
    ...(isManager ? ['manager'] : []),
    ...(isAdmin ? ['admin'] : []),
  ].filter(id => !hidden.has(id)).length
  lastVisibleMain = visibleMain
  lastVisibleAdmin = visibleAdmin
  applySidebarResize(visibleMain, visibleAdmin)
  if (sidebarWin && !sidebarWin.isDestroyed()) {
    sidebarWin.webContents.send('sidebar-hidden-updated', { hiddenItems })
  }
})

ipcMain.on('set-config', (_event, newConfig) => {
  appConfig = { ...appConfig, ...newConfig }
  saveConfig(appConfig)

  if (sidebarWin && !sidebarWin.isDestroyed()) {
    sidebarWin.webContents.send('config-updated', appConfig)
  }
  if (panelWin && !panelWin.isDestroyed()) {
    panelWin.webContents.send('config-updated', appConfig)
  }

  if ('shortcutMap' in newConfig) {
    updateShortcutMap(newConfig.shortcutMap)
  }
  if ('shortcutSettings' in newConfig) {
    updateShortcutSettings(newConfig.shortcutSettings)
  }

  if ('sidebarOpacity' in newConfig && sidebarWin && !sidebarWin.isDestroyed()) {
    sidebarWin.setOpacity(newConfig.sidebarOpacity / 100)
  }

  if ('alwaysOnTop' in newConfig) {
    if (sidebarWin && !sidebarWin.isDestroyed()) {
      sidebarWin.setMinimizable(!newConfig.alwaysOnTop)
      if (newConfig.alwaysOnTop) {
        sidebarWin.setAlwaysOnTop(true, 'screen-saver', 1)
      } else {
        sidebarWin.setAlwaysOnTop(false)
      }
    }
    if (panelWin && !panelWin.isDestroyed()) {
      if (newConfig.alwaysOnTop) {
        panelWin.setAlwaysOnTop(true, 'screen-saver', 1)
      } else {
        panelWin.setAlwaysOnTop(false)
      }
    }
  }

  if ('layoutSide' in newConfig) {
    if (sidebarWin && !sidebarWin.isDestroyed() && currentTabId) {
      openPanel(currentTabId)
    }
  }

  if ('uiScale' in newConfig) {
    const zoom = newConfig.uiScale / 100
    if (sidebarWin && !sidebarWin.isDestroyed()) {
      sidebarWin.webContents.setZoomFactor(zoom)
      const [curX, curY] = sidebarWin.getPosition()
      const newW = Math.round(56 * zoom)
      const ITEM_H = 46
      const BASE_H = 252
      const rawH = BASE_H + lastVisibleMain * ITEM_H + lastVisibleAdmin * ITEM_H
      const newH = Math.round(Math.max(rawH, 180) * zoom)
      sidebarWin.setBounds({ x: curX, y: curY, width: newW, height: newH })
    }
    if (panelWin && !panelWin.isDestroyed()) {
      panelWin.webContents.setZoomFactor(zoom)
    }
    if (sidebarWin && !sidebarWin.isDestroyed() && currentTabId) {
      openPanel(currentTabId)
    }
    if (loginWin && !loginWin.isDestroyed()) {
      loginWin.webContents.setZoomFactor(zoom)
      const [lx, ly] = loginWin.getPosition()
      loginWin.setBounds({ x: lx, y: ly, width: Math.round(800 * zoom), height: Math.round(600 * zoom) })
    }
  }
})

// Deprecated: No longer used, but kept for safety
ipcMain.on('layout-ready', () => { })

ipcMain.on('panel-ready', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  if (panelWin && window === panelWin && currentTabId) {
    panelWin.webContents.send('layout-updated', {
      tabId: currentTabId,
      layoutSide: currentLayoutSide,
      alignSide: currentAlignSide
    })
  }
})

ipcMain.on('set-ignore-mouse-events', (_event, ignore: boolean) => {
  if (sidebarWin && !sidebarWin.isDestroyed())
    sidebarWin.setIgnoreMouseEvents(ignore, { forward: true })
})

ipcMain.on('sidebar-set-open', (_event, open: boolean) => {
  if (!sidebarWin || sidebarWin.isDestroyed()) return
  const zoom = (appConfig.uiScale || 100) / 100
  const [, h] = sidebarWin.getSize()
  const [x, y] = sidebarWin.getPosition()
  if (open) {
    const newW = Math.round(76 * zoom)
    sidebarWin.setBounds({ x, y, width: newW, height: h })
  } else {
    const newW = Math.round(20 * zoom)
    sidebarWin.setBounds({ x: x + Math.round(56 * zoom), y, width: newW, height: h })
  }
})

// Toggle panel layout inside the main window
ipcMain.on('toggle-panel-window', (_event, tabId) => {
  togglePanel(tabId)
})

// Close panel
ipcMain.on('close-panel-window', () => {
  closePanel()
})

// Minimize window
ipcMain.on('minimize-panel-window', () => {
  closePanel()
})

// Clear all stats
ipcMain.on('clear-all-stats', () => {
  if (sidebarWin && !sidebarWin.isDestroyed()) {
    sidebarWin.webContents.send('clear-all-stats')
  }
  if (panelWin && !panelWin.isDestroyed()) {
    panelWin.webContents.send('clear-all-stats')
  }
})

ipcMain.on('window-control', (event, action) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  if (!window) return
  if (action === 'minimize') {
    window.minimize()
  } else if (action === 'close') {
    window.close()
    if (window === sidebarWin) {
      if (panelWin && !panelWin.isDestroyed()) {
        panelWin.close()
      }
    }
  } else if (action === 'oauth-start') {
    oauthInProgress = true
  } else if (action === 'oauth-end') {
    oauthInProgress = false
  } else if (action === 'focus') {
    oauthInProgress = false
    if (loginWin && !loginWin.isDestroyed()) {
      if (loginWin.isMinimized()) loginWin.restore()
      loginWin.focus()
    }
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
    if (panelWin && !panelWin.isDestroyed()) {
      panelWin.close()
      panelWin = null
    }
  }
})

ipcMain.on('splash-finished', () => {
  if (splashWin && !splashWin.isDestroyed()) {
    splashWin.close()
    splashWin = null
  }
  createLoginWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createSplashWindow()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, we should focus our window.
    if (sidebarWin) {
      if (sidebarWin.isMinimized()) sidebarWin.restore()
      sidebarWin.focus()
      if (panelWin) panelWin.focus()
    } else if (loginWin) {
      if (loginWin.isMinimized()) loginWin.restore()
      loginWin.focus()
    }
  })

  app.whenReady().then(() => {
    createSplashWindow()
    if (appConfig.shortcutMap) {
      updateShortcutMap(appConfig.shortcutMap)
    }
    if (appConfig.shortcutSettings) {
      updateShortcutSettings(appConfig.shortcutSettings)
    }
  })
}

app.on('browser-window-created', (event, window) => {
  // Identify popup windows (like OAuth login)
  if (window !== loginWin && window !== sidebarWin && window !== panelWin) {
    window.on('closed', () => {
      BrowserWindow.getAllWindows().forEach(w => {
        if (!w.isDestroyed() && w.webContents && !w.webContents.isDestroyed()) {
          try {
            w.webContents.send('oauth-popup-closed')
          } catch (e) {
            console.error('Failed to send oauth-popup-closed:', e)
          }
        }
      })
      // Traz a janela de login para frente após fechar o popup OAuth
      if (loginWin && !loginWin.isDestroyed()) {
        if (loginWin.isMinimized()) loginWin.restore()
        loginWin.focus()
      }
    })
  }
})
