import { InteractiveMap } from '../components/InteractiveMap'

export function MapMirrorScreen() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-transparent">
      <InteractiveMap mirrorMode />
    </div>
  )
}
