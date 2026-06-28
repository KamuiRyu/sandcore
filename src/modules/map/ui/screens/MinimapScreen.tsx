import { useEffect, useRef, useState } from 'react'

type MinimapSize   = 'small' | 'medium' | 'large'

interface MinimapSettings {
  size: MinimapSize
  opacity: number
}

interface CameraPayload {
  x: number; y: number; scale: number
  sW: number; sH: number; vW: number; vH: number
}

const SIZE_PX: Record<MinimapSize, number> = { small: 160, medium: 220, large: 300 }

// URL of the mirror iframe (same app, different windowType)
function getMirrorUrl() {
  const url = new URL(window.location.href)
  url.searchParams.set('windowType', 'map-mirror')
  return url.toString()
}

export function MinimapScreen() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [settings, setSettings] = useState<MinimapSettings>({ size: 'medium', opacity: 85 })
  // Viewport size from the main map — we size the iframe to match so camera coords are 1:1
  const [mapViewport, setMapViewport] = useState({ vW: 900, vH: 650 })

  const dragging  = useRef(false)
  const dragStart = useRef<{ mx: number; my: number; wx: number; wy: number } | null>(null)

  useEffect(() => {
    if (!window.ipcRenderer) return
    const handler = (_: unknown, payload: { camera?: CameraPayload; settings?: Partial<MinimapSettings> }) => {
      if (payload.settings) {
        setSettings(s => ({ ...s, ...payload.settings }))
      }
      if (payload.camera) {
        const { x, y, scale, vW, vH } = payload.camera
        // Keep viewport size in sync so iframe is always the right size
        setMapViewport(prev => (prev.vW === vW && prev.vH === vH ? prev : { vW, vH }))
        // Forward camera to iframe — same values work because iframe has same viewport size
        iframeRef.current?.contentWindow?.postMessage({ type: 'set-camera', x, y, scale }, '*')
      }
    }
    window.ipcRenderer.on('minimap-update', handler)
    return () => window.ipcRenderer?.off('minimap-update', handler)
  }, [])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragging.current = true
    window.ipcRenderer?.invoke('get-minimap-position').then((pos: { x: number; y: number }) => {
      dragStart.current = { mx: e.screenX, my: e.screenY, wx: pos.x, wy: pos.y }
    })
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || !dragStart.current) return
    window.ipcRenderer?.send('move-minimap', {
      x: dragStart.current.wx + (e.screenX - dragStart.current.mx),
      y: dragStart.current.wy + (e.screenY - dragStart.current.my),
    })
  }
  const onPointerUp = () => { dragging.current = false; dragStart.current = null }

  const px    = SIZE_PX[settings.size]
  const { vW, vH } = mapViewport
  // Scale the iframe (which renders at vW×vH) down to fit in the px circle
  const cssScale = px / Math.max(vW, vH)

  return (
    <div
      className="flex items-center justify-center w-screen h-screen bg-transparent"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ cursor: 'grab' }}
    >
      {/* Outer circle clip */}
      <div style={{
        width: px,
        height: px,
        borderRadius: '50%',
        overflow: 'hidden',
        opacity: settings.opacity / 100,
        boxShadow: '0 0 0 3px rgba(200,134,10,0.75)',
        flexShrink: 0,
      }}>
        {/* Scale container: renders the iframe at full main-map viewport size, then scales it down */}
        <div style={{
          width: vW,
          height: vH,
          transform: `scale(${cssScale})`,
          transformOrigin: 'top left',
          pointerEvents: 'none',
        }}>
          <iframe
            ref={iframeRef}
            src={getMirrorUrl()}
            style={{ width: vW, height: vH, border: 'none', display: 'block', pointerEvents: 'none' }}
          />
        </div>
      </div>
    </div>
  )
}
