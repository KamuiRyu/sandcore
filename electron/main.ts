import { app, BrowserWindow, ipcMain, screen, globalShortcut } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import { autoUpdater } from 'electron-updater'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion')
app.commandLine.appendSwitch('disable-background-timer-throttling')

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let loginWin: BrowserWindow | null = null
let sidebarWin: BrowserWindow | null = null
let currentLayoutSide: 'left' | 'right' = 'right'
let currentAlignSide: 'top' | 'bottom' = 'top'

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
  //loginWin.webContents.openDevTools()

  if (process.env.VITE_DEV_SERVER_URL) {
    loginWin.loadURL(`${process.env.VITE_DEV_SERVER_URL}?windowType=login`)
  } else {
    loginWin.loadFile(path.join(process.env.DIST!, 'index.html'), { query: { windowType: 'login' } })
  }

  loginWin.on('closed', () => {
    loginWin = null
    if (!sidebarWin || sidebarWin.isDestroyed()) {
      app.quit()
    }
  })

  setupMoveListeners(loginWin)
}

let currentTabId: string | null = null
let moveTimeout: NodeJS.Timeout | null = null
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

function createSidebarWindow() {
  if (sidebarWin && !sidebarWin.isDestroyed()) {
    sidebarWin.focus()
    return
  }
  const preloadPath = path.join(process.env.DIST!, '../dist-electron/preload.js')
  currentLayoutSide = 'right'
  currentTabId = null
  const zoom = (appConfig.uiScale || 100) / 100

  const width = Math.round(60 * zoom)
  const height = Math.round(360 * zoom)

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

  if (appConfig.alwaysOnTop) {
    sidebarWin.setAlwaysOnTop(true, 'screen-saver', 1)
  }

  // Prevent the window from being minimized by the system when losing focus to a fullscreen app
  sidebarWin.on('blur', () => {
    if (appConfig.alwaysOnTop && sidebarWin) {
      sidebarWin.setAlwaysOnTop(true, 'screen-saver', 1)
    }
  })

  // Bring panel to front when sidebar is focused/restored
  sidebarWin.on('focus', () => {
    if (panelWin && !panelWin.isDestroyed() && currentTabId) {
      if (appConfig.alwaysOnTop) {
        panelWin.setAlwaysOnTop(false)
        panelWin.setAlwaysOnTop(true, 'screen-saver', 1)
      }
      panelWin.showInactive()
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

  sidebarWin.on('closed', () => {
    sidebarWin = null
    if (panelWin && !panelWin.isDestroyed()) {
      panelWin.close()
    }
    if (!loginWin || loginWin.isDestroyed()) {
      app.quit()
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
    parent: sidebarWin && !sidebarWin.isDestroyed() ? sidebarWin : undefined,
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
    skipTaskbar: true, // Hide from taskbar, sidebar is the main anchor
    focusable: true,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
  })

  panelWin.setMenu(null)

  if (appConfig.alwaysOnTop) {
    panelWin.setAlwaysOnTop(true, 'screen-saver', 1)
  }

  panelWin.on('blur', () => {
    if (appConfig.alwaysOnTop && panelWin) {
      panelWin.setAlwaysOnTop(true, 'screen-saver', 1)
    }
  })

  panelWin.on('minimize' as any, (e: any) => {
    e.preventDefault()
    panelWin?.restore()
  })

  panelWin.webContents.on('dom-ready', () => {
    panelWin?.webContents.setZoomFactor(zoom)
  })

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
  const physicalSidebarH = Math.round(360 * zoom)
  
  let panelLogicalW = 450
  let panelLogicalH = 550
  if (tabId === 'map') {
    panelLogicalW = 1200
    panelLogicalH = 800
  }
  
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
    panel.setAlwaysOnTop(false)
    panel.setAlwaysOnTop(true, 'screen-saver', 1)
  }

  // Force show unconditionally
  panel.showInactive()

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
ipcMain.handle('get-config', () => appConfig)
ipcMain.handle('get-app-version', () => app.getVersion())

// Auto Updater IPC / Logic
ipcMain.on('check-for-updates', (event) => {
  // If in dev mode, we can simulate an update flow to test the React UI
  if (!app.isPackaged) {
    event.sender.send('update-status', { status: 'checking' })
    setTimeout(() => {
      event.sender.send('update-status', {
        status: 'available',
        version: '1.3.0',
        releaseNotes: 'Esta é uma simulação de nova versão em desenvolvimento.'
      })

      // Simulate download progress
      let percent = 0
      const interval = setInterval(() => {
        percent += 20
        event.sender.send('update-progress', { percent })
        if (percent >= 100) {
          clearInterval(interval)
          event.sender.send('update-status', { status: 'downloaded', version: '1.3.0' })
        }
      }, 1000)
    }, 1500)
    return
  }

  // Real auto updater check
  autoUpdater.checkForUpdatesAndNotify().catch((err) => {
    event.sender.send('update-status', { status: 'error', message: err?.message || 'Erro desconhecido' })
  })
})

ipcMain.on('quit-and-install-update', () => {
  if (app.isPackaged) {
    autoUpdater.quitAndInstall()
  } else {
    console.log('Simulando reinicialização para instalar atualização (modo desenvolvimento).')
    app.relaunch()
    app.exit(0)
  }
})

// Real Auto Updater Events
autoUpdater.on('checking-for-update', () => {
  if (sidebarWin && !sidebarWin.isDestroyed()) {
    sidebarWin.webContents.send('update-status', { status: 'checking' })
  }
})

autoUpdater.on('update-available', (info) => {
  if (sidebarWin && !sidebarWin.isDestroyed()) {
    sidebarWin.webContents.send('update-status', {
      status: 'available',
      version: info.version,
      releaseNotes: info.releaseNotes
    })
  }
})

autoUpdater.on('update-not-available', () => {
  if (sidebarWin && !sidebarWin.isDestroyed()) {
    sidebarWin.webContents.send('update-status', { status: 'not-available' })
  }
})

autoUpdater.on('error', (err) => {
  if (sidebarWin && !sidebarWin.isDestroyed()) {
    sidebarWin.webContents.send('update-status', { status: 'error', message: err?.message || 'Erro de conexão' })
  }
})

autoUpdater.on('download-progress', (progressObj) => {
  if (sidebarWin && !sidebarWin.isDestroyed()) {
    sidebarWin.webContents.send('update-progress', { percent: Math.round(progressObj.percent) })
  }
})

autoUpdater.on('update-downloaded', (info) => {
  if (sidebarWin && !sidebarWin.isDestroyed()) {
    sidebarWin.webContents.send('update-status', { status: 'downloaded', version: info.version })
  }
})

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
  if (panelWin && !panelWin.isDestroyed()) {
    panelWin.webContents.send('config-updated', appConfig)
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
      openPanel(currentTabId)
    }
  }

  if ('uiScale' in newConfig) {
    const zoom = newConfig.uiScale / 100
    if (sidebarWin && !sidebarWin.isDestroyed()) {
      sidebarWin.webContents.setZoomFactor(zoom)
      if (currentTabId) openPanel(currentTabId)
    }
    if (loginWin && !loginWin.isDestroyed()) {
      loginWin.webContents.setZoomFactor(zoom)
    }
  }
})

// Deprecated: No longer used, but kept for safety
ipcMain.on('layout-ready', () => {})

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
  if (sidebarWin && !sidebarWin.isDestroyed()) {
    sidebarWin.minimize()
  }
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
