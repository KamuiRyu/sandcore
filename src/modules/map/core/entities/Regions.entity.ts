export const mapRegions = [
  'Pais do Fogo',
  'Pais do Vento',
  'Pais do Ferro',
  'Pais da Agua',
  'Pais do Relampago',
  'Pais da Terra',
  'Pais das Fontes Termais',
  'Pais da Grama',
  'Pais dos Rios',
] as const

export type MapRegionId = (typeof mapRegions)[number]

export const defaultMapRegion = mapRegions[0]

export const mapSubRegions: Record<MapRegionId, string[]> = {
  'Pais do Fogo': [
    'Konohagakure',
    'Vale do Fim',
    'Floresta da Morte',
    'Floresta das Árvores Mortas',
    'Floresta Nara',
    'Campo de Treino',
    'Velho Tronco',
    'Arena NextGen',
    'Recife de Corais',
  ],
  'Pais do Vento': [
    'Sunagakure',
    'Deserto Demoníaco',
    'Oásis',
    'Campo de Treino',
    'Cidadela da Areia',
    'Estátua de Buddha',
    'Recife de Corais',
  ],
  'Pais da Agua': [
    'Kirigakure',
    'Vilarejo Arpão',
    'Vilarejos',
    'A Grande Ponte',
    'Floresta dos Cogumelos',
    'Campo de Treino',
    'Ilha Dotou',
    'Recife de Corais',
  ],
  'Pais do Relampago': [
    'Kumogakure',
    'Praia dos Espinhos',
    'Vilarejo Lâmina das Ondas',
    'Posto Relâmpago',
    'Ponte de Kumo',
    'Campo de Treino',
    'Floresta Seca',
    'Ondas Quebradiças',
    'Ravina da Tempestade',
    'Recife de Corais',
  ],
  'Pais da Terra': [
    'Iwagakure',
    'Vilarejo Indígena',
    'Vilarejos',
    'Cemitério Ancestral',
    'Recife de Corais',
  ],
  'Pais do Ferro': [
    'Tetsugakure',
    'Ponte Samurai',
    'Vilarejo Sul',
    'Vilarejo Leste',
    'Vilarejo Oeste',
  ],
  'Pais das Fontes Termais': [
    'Monte Katsuragi',
    'Mansão Katsuragi',
    'Vilarejo Yugakure',
  ],
  'Pais da Grama': [
    'Takigakure',
    'Casa de Recompensas',
    'Ponte Kannabi',
    'Ponte Tenchi',
    'Tronco Antigo',
  ],
  'Pais dos Rios': [
    'Pradaria',
    'Fazenda Choba',
    'Vilarejo Kisaragi',
    'Vale dos Troncos',
    'Esconderijo',
  ],
}

export function getSubRegions(region: MapRegionId): string[] {
  return mapSubRegions[region] || []
}
