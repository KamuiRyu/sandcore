import { useState, useEffect } from 'react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Loader2 } from 'lucide-react'
import { useAuthViewModel } from './modules/authentication/ui/viewModels/useAuth.viewModel'
import { LoginScreen } from './modules/authentication/ui/screens/LoginScreen'
import { SidebarScreen } from './modules/dashboard/ui/screens/SidebarScreen'
import { ContentPanelScreen } from './modules/dashboard/ui/screens/ContentPanelScreen'

import { SplashScreen } from './modules/app/ui/screens/SplashScreen'

function App() {
  const viewModel = useAuthViewModel()
  const [loading, setLoading] = useState(true)
  const [windowType, setWindowType] = useState<string | null>(() => {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('windowType')
  })
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [layoutSide, setLayoutSide] = useState<'left' | 'right'>('right')
  const [alignSide, setAlignSide] = useState<'top' | 'bottom'>('top')
  const [sidebarOpacity, setSidebarOpacity] = useState(95)
  const [lastActiveTab, setLastActiveTab] = useState<string | null>(null)

  useEffect(() => {
    if (activeTab) {
      setLastActiveTab(activeTab)
    }
  }, [activeTab])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const type = urlParams.get('windowType')
    setWindowType(type)

    if (window.ipcRenderer) {
      window.ipcRenderer.getConfig().then((config) => {
        setLoading(false)
        if (config && 'sidebarOpacity' in config) {
          setSidebarOpacity(config.sidebarOpacity)
        }
        if (viewModel.isLoggedIn && type === 'login') {
          window.ipcRenderer.send('window-control', 'login-success')
        }
      })

      const handleLayoutUpdated = (_event: any, data: { tabId: string | null; layoutSide: 'left' | 'right'; alignSide?: 'top' | 'bottom' }) => {
        setActiveTab(data.tabId)
        setLayoutSide(data.layoutSide)
        if (data.alignSide) {
          setAlignSide(data.alignSide)
        }
      }
      window.ipcRenderer.on('layout-updated', handleLayoutUpdated)

      const handleConfigUpdated = (_event: any, config: any) => {
        if (config && 'sidebarOpacity' in config) {
          setSidebarOpacity(config.sidebarOpacity)
        }
      }
      window.ipcRenderer.on('config-updated', handleConfigUpdated)

      window.ipcRenderer.send('panel-ready')

      return () => {
        window.ipcRenderer?.off('layout-updated', handleLayoutUpdated)
        window.ipcRenderer?.off('config-updated', handleConfigUpdated)
      }
    } else {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (window.ipcRenderer) {
      let frame2Id: number | null = null
      const frame1Id = requestAnimationFrame(() => {
        frame2Id = requestAnimationFrame(() => {
          window.ipcRenderer?.send('layout-ready')
        })
      })
      return () => {
        cancelAnimationFrame(frame1Id)
        if (frame2Id !== null) {
          cancelAnimationFrame(frame2Id)
        }
      }
    }
  }, [activeTab, layoutSide, alignSide])

  if (loading && windowType !== 'splash' && windowType !== 'login') {
    return null
  }

  // If windowType is explicitly set to splash
  if (windowType === 'splash') {
    return <SplashScreen />
  }

  // If windowType is explicitly set to login
  if (windowType === 'login') {
    return <LoginScreen viewModel={viewModel} />
  }

  // If windowType is sidebar or fallback, and user is not logged in, render login
  if (!viewModel.isLoggedIn) {
    return <LoginScreen viewModel={viewModel} />
  }

  // Render only the Sidebar window
  if (windowType === 'sidebar' || !windowType) {
    return (
      <div
        className="h-screen w-screen bg-transparent p-0 overflow-visible"
      >
        <SidebarScreen activeTab={activeTab} onLogout={() => viewModel.logout()} />
      </div>
    )
  }

  // Render only the Panel window
  if (windowType === 'panel') {
    return (
      <div
        className="h-screen w-screen bg-transparent flex p-0 overflow-hidden"
        style={{ opacity: sidebarOpacity / 100 }}
      >
        {lastActiveTab && (
          <div
            className="h-full w-full overflow-hidden"
            style={{
              visibility: activeTab ? 'visible' : 'hidden',
              pointerEvents: activeTab ? 'auto' : 'none',
              transition: 'visibility 300ms'
            }}
          >
            <ContentPanelScreen activeTab={activeTab} lastActiveTab={lastActiveTab} />
          </div>
        )}
      </div>
    )
  }

  return null
}

export default App
