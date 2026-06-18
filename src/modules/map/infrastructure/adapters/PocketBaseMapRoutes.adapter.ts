import type { RecordModel } from 'pocketbase'
import type { CustomRoute, SavedMapRoute } from '../../core/entities/MapRoute.entity'
import type { MapRoutesRepository } from '../../core/ports/MapRoutesRepository.port'
import { pb } from '../../../../lib/pocketbase'
import { decodeMapRoute } from '../../core/usecases/DecodeMapRouteShare.usecase'
import { encodeMapRoute } from '../../core/usecases/EncodeMapRouteShare.usecase'
import { normalizeMapRoute } from '../../core/usecases/NormalizeMapRoute.usecase'
import { mapRouteSchema } from '../../core/usecases/ValidateMapRoute.usecase'

const mapRoutesCollection = 'map_routes'
const publicMapRoutesCollection = 'public_map_routes'

function getString(record: RecordModel, field: string): string | undefined {
  return typeof record[field] === 'string' && record[field] ? record[field] : undefined
}

function getExpandedOwner(record: RecordModel): RecordModel | null {
  const expand = record.expand

  if (typeof expand !== 'object' || expand === null || !('owner' in expand)) {
    return null
  }

  const owner = expand.owner

  return typeof owner === 'object' && owner !== null && !Array.isArray(owner)
    ? (owner as RecordModel)
    : null
}

function toRouteCreator(record: RecordModel): NonNullable<SavedMapRoute['creator']> {
  const name =
    getString(record, 'name') ??
    getString(record, 'username') ??
    getString(record, 'email') ??
    'Shinobi'
  const avatar = getString(record, 'avatar')

  return {
    avatarUrl: avatar ? pb.files.getURL(record, avatar, { thumb: '96x96' }) : undefined,
    id: record.id,
    name,
    username: getString(record, 'username'),
  }
}

function createPublicSlug(): string {
  const randomSuffix = Math.random().toString(36).substring(2, 10)
  return `map-${randomSuffix}`.slice(0, 60)
}

function escapeFilterValue(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function getMapRoutesErrorMessage(error: unknown): string {
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
      return 'O PocketBase recusou os dados da rota. Confira os campos das collections map_routes e public_map_routes.'
    }

    if (error.status === 401 || error.status === 403) {
      return 'Sua sessao nao tem permissao para acessar essas rotas.'
    }

    if (error.status === 404) {
      return 'As collections map_routes/public_map_routes nao foram encontradas no PocketBase.'
    }
  }

  return 'Nao foi possivel sincronizar suas rotas agora.'
}

function createRouteFormData(route: CustomRoute, ownerId?: string) {
  const normalizedRoute = normalizeMapRoute(route)
  const routeBase64 = encodeMapRoute(normalizedRoute)
  const formData = new FormData()

  if (ownerId) {
    formData.append('owner', ownerId)
  }

  formData.append('name', normalizedRoute.name.trim() || 'Rota sem nome')
  formData.append('description', normalizedRoute.description?.trim() || '')
  formData.append('route_base64', routeBase64)
  formData.append('color', normalizedRoute.color)
  formData.append('checkpoint_count', String(normalizedRoute.checkpoints.length))
  formData.append('custom_pin_count', String(normalizedRoute.customPins.length))
  formData.append(
    'tags',
    JSON.stringify(
      Array.from(
        new Set(
          normalizedRoute.customPins.flatMap((pin) =>
            pin.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean),
          ),
        ),
      ),
    ),
  )
  formData.append(
    'search_text',
    [
      normalizedRoute.name,
      normalizedRoute.description,
      ...normalizedRoute.customPins.map((pin) => pin.name),
      ...normalizedRoute.customPins.flatMap((pin) => pin.tags),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase(),
  )

  return { formData, routeBase64 }
}

function toSavedMapRoute(record: RecordModel, base64Override?: string): SavedMapRoute | null {
  try {
    const routeBase64 =
      base64Override ??
      (typeof record.route_base64 === 'string' ? record.route_base64 : '')
    const route = mapRouteSchema.parse(normalizeMapRoute(decodeMapRoute(routeBase64)))
    const ownerRecord = getExpandedOwner(record)

    return {
      color: getString(record, 'color') ?? route.color,
      createdAt: typeof record.created === 'string' ? record.created : route.createdAt,
      creator: ownerRecord ? toRouteCreator(ownerRecord) : undefined,
      description: getString(record, 'description') ?? route.description,
      id: record.origin_route_id ?? record.id,
      isPublic: typeof record.is_public === 'boolean' ? record.is_public : true,
      name: getString(record, 'name') ?? route.name,
      owner: typeof record.owner === 'string' ? record.owner : '',
      publicSlug: getString(record, 'public_slug'),
      route,
      source: 'remote',
      updatedAt: typeof record.updated === 'string' ? record.updated : route.updatedAt,
    }
  } catch {
    return null
  }
}

async function deletePublicCopy(routeId: string) {
  try {
    const publicRecords = await pb.collection(publicMapRoutesCollection).getList(1, 1, {
      filter: `origin_route_id = "${routeId}"`,
    })

    if (publicRecords.items.length > 0) {
      await pb.collection(publicMapRoutesCollection).delete(publicRecords.items[0].id)
    }
  } catch {
    // ignore if it does not exist in the public collection
  }
}

export const pocketBaseMapRoutesRepository: MapRoutesRepository = {
  async create(route: CustomRoute, ownerId: string) {
    try {
      const { formData, routeBase64 } = createRouteFormData(route, ownerId)
      formData.append('is_public', 'false')
      const record = await pb.collection(mapRoutesCollection).create(formData)
      const savedRoute = toSavedMapRoute(record, routeBase64)

      if (!savedRoute) {
        throw new Error('Rota remota invalida.')
      }

      return savedRoute
    } catch (error) {
      throw new Error(getMapRoutesErrorMessage(error), { cause: error })
    }
  },

  async delete(routeId: string) {
    try {
      await deletePublicCopy(routeId)
      await pb.collection(mapRoutesCollection).delete(routeId)
    } catch (error) {
      throw new Error(getMapRoutesErrorMessage(error), { cause: error })
    }
  },

  async getPublicBySlug(publicSlug: string) {
    try {
      const record = await pb.collection(publicMapRoutesCollection).getFirstListItem(
        `public_slug = "${escapeFilterValue(publicSlug)}"`,
        { expand: 'owner' },
      )
      const savedRoute = toSavedMapRoute(record)

      if (!savedRoute) {
        throw new Error('Rota publica invalida.')
      }

      return savedRoute
    } catch (error) {
      throw new Error(getMapRoutesErrorMessage(error), { cause: error })
    }
  },

  async listMine(page = 1, perPage = 15) {
    try {
      const records = await pb.collection(mapRoutesCollection).getList(page, perPage, {
        sort: '-updated',
        requestKey: null,
      })

      return {
        items: records.items
          .map((record) => toSavedMapRoute(record))
          .filter((route): route is SavedMapRoute => Boolean(route)),
        totalItems: records.totalItems,
        totalPages: records.totalPages,
      }
    } catch (error) {
      throw new Error(getMapRoutesErrorMessage(error), { cause: error })
    }
  },

  async publish(savedRoute: SavedMapRoute, ownerId: string) {
    try {
      const publicSlug = savedRoute.publicSlug || createPublicSlug()
      const { formData } = createRouteFormData(savedRoute.route, ownerId)

      formData.append('origin_route_id', savedRoute.id)
      formData.append('public_slug', publicSlug)
      formData.append('is_public', 'true')

      await pb.collection(mapRoutesCollection).update(savedRoute.id, {
        is_public: true,
        public_slug: publicSlug,
      })

      const publicRecords = await pb.collection(publicMapRoutesCollection).getList(1, 1, {
        filter: `origin_route_id = "${savedRoute.id}"`,
        requestKey: null,
      })

      if (publicRecords.items.length > 0) {
        await pb.collection(publicMapRoutesCollection).update(publicRecords.items[0].id, formData)
      } else {
        await pb.collection(publicMapRoutesCollection).create(formData)
      }

      return publicSlug
    } catch (error) {
      throw new Error(getMapRoutesErrorMessage(error), { cause: error })
    }
  },

  async searchPublic(query: string, page = 1, perPage = 15) {
    try {
      const filter = query.trim()
        ? `public_slug != "" && search_text ~ "${escapeFilterValue(query.trim().toLowerCase())}"`
        : 'public_slug != ""'
      const records = await pb.collection(publicMapRoutesCollection).getList(page, perPage, {
        expand: 'owner',
        filter,
        sort: '-updated',
        requestKey: null,
      })

      return {
        items: records.items
          .map((record) => toSavedMapRoute(record))
          .filter((route): route is SavedMapRoute => Boolean(route)),
        totalItems: records.totalItems,
        totalPages: records.totalPages,
      }
    } catch (error) {
      throw new Error(getMapRoutesErrorMessage(error), { cause: error })
    }
  },

  async unpublish(routeId: string) {
    try {
      await deletePublicCopy(routeId)
      await pb.collection(mapRoutesCollection).update(routeId, {
        is_public: false,
        public_slug: '',
      })
    } catch (error) {
      throw new Error(getMapRoutesErrorMessage(error), { cause: error })
    }
  },

  async update(routeId: string, route: CustomRoute) {
    try {
      const { formData, routeBase64 } = createRouteFormData(route)
      const record = await pb.collection(mapRoutesCollection).update(routeId, formData)
      const savedRoute = toSavedMapRoute(record, routeBase64)

      if (!savedRoute) {
        throw new Error('Rota remota invalida.')
      }

      return savedRoute
    } catch (error) {
      throw new Error(getMapRoutesErrorMessage(error), { cause: error })
    }
  },
}
