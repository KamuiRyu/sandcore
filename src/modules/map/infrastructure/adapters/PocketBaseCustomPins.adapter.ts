import type { RecordModel } from 'pocketbase'
import type { CustomPin, SavedCustomPin } from '../../core/entities/MapRoute.entity'
import type { CustomPinsRepository } from '../../core/ports/CustomPinsRepository.port'
import { pb } from '../../../../lib/pocketbase'

const customPinsCollection = 'map_custom_pins'

function getString(record: RecordModel, field: string): string | undefined {
  return typeof record[field] === 'string' && record[field] ? record[field] : undefined
}

function getNumber(record: RecordModel, field: string): number | undefined {
  const val = record[field]
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    const parsed = parseFloat(val)
    return isNaN(parsed) ? undefined : parsed
  }
  return undefined
}

function getCustomPinsErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number'
  ) {
    if (error.status === 0) {
      return 'Nao foi possivel conectar ao PocketBase. Confira CORS, internet e a URL da API.'
    }

    if (error.status === 400) {
      return 'O PocketBase recusou os dados do pin. Confira os campos da collection map_custom_pins.'
    }

    if (error.status === 401 || error.status === 403) {
      return 'Sua sessao nao tem permissao para acessar esses pins.'
    }

    if (error.status === 404) {
      return 'A collection map_custom_pins nao foi encontrada no PocketBase.'
    }
  }

  return 'Nao foi possivel sincronizar seus pins agora.'
}

function dataURLtoBlob(dataurl: string): Blob | null {
  try {
    const arr = dataurl.split(',')
    const mimeMatch = arr[0].match(/:(.*?);/)
    if (!mimeMatch) return null
    const mime = mimeMatch[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new Blob([u8arr], { type: mime })
  } catch {
    return null
  }
}

function createPinFormData(pin: CustomPin, ownerId?: string) {
  const formData = new FormData()

  if (ownerId) {
    formData.append('owner', ownerId)
  }

  formData.append('name', pin.name.trim() || 'Pin sem nome')
  formData.append('description', pin.description?.trim() || '')
  formData.append('color', pin.color)
  formData.append('icon_id', pin.iconId)
  formData.append('x', String(pin.x))
  formData.append('y', String(pin.y))
  formData.append('is_placed', String(pin.isPlaced !== false))
  formData.append('checked', String(!!pin.checked))
  formData.append('tags', JSON.stringify(pin.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean)))
  
  if (pin.imageUrl) {
    if (pin.imageUrl.startsWith('data:')) {
      const blob = dataURLtoBlob(pin.imageUrl)
      if (blob) {
        const ext = blob.type.split('/')[1] || 'png'
        formData.append('image', blob, `image.${ext}`)
      }
    } else if (pin.imageUrl.startsWith('http')) {
      // It's an existing remote URL, don't append anything so PocketBase keeps the current file
    }
  } else {
    // Only clear the image if it's explicitly empty/null
    formData.append('image', '')
  }

  return formData
}

function toSavedCustomPin(record: RecordModel): SavedCustomPin {
  let tags: string[] = []
  if (record.tags) {
    try {
      tags = Array.isArray(record.tags)
        ? record.tags
        : typeof record.tags === 'string'
        ? JSON.parse(record.tags)
        : []
    } catch {
      tags = []
    }
  }

  const expandedOwner = record.expand?.owner
  const ownerName = expandedOwner
    ? (expandedOwner.name || expandedOwner.username)
    : undefined

  return {
    color: getString(record, 'color') || '#00d6a3',
    createdAt: typeof record.created === 'string' ? record.created : new Date().toISOString(),
    description: getString(record, 'description'),
    iconId: getString(record, 'icon_id') || 'arena',
    id: record.id,
    imageUrl: record.image ? pb.files.getUrl(record, record.image) : undefined,
    isPlaced: typeof record.is_placed === 'boolean' ? record.is_placed : true,
    checked: typeof record.checked === 'boolean' ? record.checked : false,
    name: getString(record, 'name') || 'Pin sem nome',
    owner: typeof record.owner === 'string' ? record.owner : undefined,
    ownerName,
    tags,
    x: getNumber(record, 'x') ?? 50,
    y: getNumber(record, 'y') ?? 50,
    source: 'remote',
    updatedAt: typeof record.updated === 'string' ? record.updated : new Date().toISOString(),
  }
}

export const pocketBaseCustomPinsRepository: CustomPinsRepository = {
  async create(pin: CustomPin, ownerId: string) {
    try {
      const formData = createPinFormData(pin, ownerId)
      const record = await pb.collection(customPinsCollection).create(formData, {
        expand: 'owner',
      })
      return toSavedCustomPin(record)
    } catch (error) {
      throw new Error(getCustomPinsErrorMessage(error), { cause: error })
    }
  },

  async delete(pinId: string) {
    try {
      await pb.collection(customPinsCollection).delete(pinId)
    } catch (error) {
      throw new Error(getCustomPinsErrorMessage(error), { cause: error })
    }
  },

  async listMine(page = 1, perPage = 15) {
    try {
      const records = await pb.collection(customPinsCollection).getList(page, perPage, {
        sort: '-updated',
        expand: 'owner',
        requestKey: null,
      })

      return {
        items: records.items.map(toSavedCustomPin),
        totalItems: records.totalItems,
        totalPages: records.totalPages,
      }
    } catch (error) {
      throw new Error(getCustomPinsErrorMessage(error), { cause: error })
    }
  },

  async update(pinId: string, pin: CustomPin, ownerId: string) {
    try {
      const formData = createPinFormData(pin, ownerId)
      const record = await pb.collection(customPinsCollection).update(pinId, formData, {
        expand: 'owner',
      })
      return toSavedCustomPin(record)
    } catch (error) {
      throw new Error(getCustomPinsErrorMessage(error), { cause: error })
    }
  },
}
