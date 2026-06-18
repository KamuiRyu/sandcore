import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuthViewModel } from './modules/authentication/ui/viewModels/useAuth.viewModel'
import { LoginScreen } from './modules/authentication/ui/screens/LoginScreen'
import { SidebarScreen } from './modules/dashboard/ui/screens/SidebarScreen'
import { ContentPanelScreen } from './modules/dashboard/ui/screens/ContentPanelScreen'

function App() {
  const viewModel = useAuthViewModel()
  const [loading, setLoading] = useState(true)
  const [windowType, setWindowType] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [layoutSide, setLayoutSide] = useState<'left' | 'right'>('right')
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

      const handleLayoutUpdated = (_event: any, data: { tabId: string | null; layoutSide: 'left' | 'right' }) => {
        setActiveTab(data.tabId)
        setLayoutSide(data.layoutSide)
      }
      window.ipcRenderer.on('layout-updated', handleLayoutUpdated)

      const handleConfigUpdated = (_event: any, config: any) => {
        if (config && 'sidebarOpacity' in config) {
          setSidebarOpacity(config.sidebarOpacity)
        }
      }
      window.ipcRenderer.on('config-updated', handleConfigUpdated)

      return () => {
        window.ipcRenderer?.off('layout-updated', handleLayoutUpdated)
        window.ipcRenderer?.off('config-updated', handleConfigUpdated)
      }
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (window.ipcRenderer && activeTab !== null) {
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
  }, [activeTab, layoutSide])

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#080A0C] text-slate-200 flex flex-col items-center justify-center font-sans">
        <Loader2 className="animate-spin text-teal-500 w-8 h-8 mb-3" />
        <span className="text-sm tracking-wider font-semibold">Carregando...</span>
      </div>
    )
  }

  // If windowType is explicitly set to login
  if (windowType === 'login') {
    return <LoginScreen />
  }

  // If windowType is sidebar or fallback, and user is not logged in, render login
  if (!viewModel.isLoggedIn) {
    return <LoginScreen />
  }

  // Unified side-by-side layout using flex-row-reverse mirror to prevent unmounting and flashing
  return (
    <div className={`h-screen w-screen bg-transparent flex items-start select-none font-sans overflow-hidden p-0 ${layoutSide === 'left' ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className="w-[60px] flex-none h-[360px]">
        <SidebarScreen activeTab={activeTab} sidebarOpacity={sidebarOpacity} onLogout={() => viewModel.logout()} />
      </div>
      {lastActiveTab && (
        <div 
          className="h-full overflow-hidden flex-1"
          style={{ 
            visibility: activeTab ? 'visible' : 'hidden', 
            pointerEvents: activeTab ? 'auto' : 'none' 
          }}
        >
          <div className="flex h-full">
            <div className="w-3 flex-none bg-transparent" />
            <div className="flex-1 h-full overflow-hidden">
              <ContentPanelScreen activeTab={activeTab} lastActiveTab={lastActiveTab} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
