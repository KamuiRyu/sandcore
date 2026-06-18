import { InteractiveMap } from '../components/InteractiveMap'

interface MapScreenProps {
  searchQuery: string
}

export const MapScreen = ({ searchQuery }: MapScreenProps) => {
  return <InteractiveMap externalSearchQuery={searchQuery} />
}

export default MapScreen
