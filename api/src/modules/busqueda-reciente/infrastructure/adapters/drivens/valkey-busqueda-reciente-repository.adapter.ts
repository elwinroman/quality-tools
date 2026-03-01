import { createHash } from 'node:crypto'

import { ForBusquedaRecienteRepositoryPort } from '@busqueda-reciente/domain/ports/drivens/for-busqueda-reciente-repository.port'
import {
  BusquedaReciente,
  BusquedaRecienteFilterRepo,
  BusquedaRecienteInput,
  BusquedaRecienteRepoResponse,
  Context,
} from '@busqueda-reciente/domain/schemas/busqueda-reciente'
import { valkeyClient } from '@core/cache/valkey-client'
import type { Meta } from '@shared/domain/schemas/meta'
import { TypeSysObjectEnum } from '@sysobject/domain/schemas/sysobject'

import { BUSQUEDA_RECIENTE_CACHE_TTL } from '@/config/enviroment'

interface CacheEntry {
  id: string
  idUser: number
  database: string
  schema: string
  objectName: string
  type: string
  dateSearch: string
  isActive: boolean
}

const CACHE_PREFIX = 'busqueda-reciente'
const MAX_ENTRIES_PER_KEY = 30

export class ValkeyCacheBusquedaRecienteRepositoryAdapter implements ForBusquedaRecienteRepositoryPort {
  async createOrUpdate(input: BusquedaRecienteInput): Promise<boolean> {
    const key = this.buildKey(input.idUser, input.database)
    const id = this.generateId(input.idUser, input.database, input.schema, input.objectName)
    const entries = await this.readEntries(key)

    const existingIndex = entries.findIndex(e => e.id === id)

    const entry: CacheEntry = {
      id,
      idUser: input.idUser,
      database: input.database,
      schema: input.schema,
      objectName: input.objectName,
      type: input.type,
      dateSearch: new Date(input.dateSearch).toISOString(),
      isActive: input.isActive,
    }

    if (existingIndex >= 0) {
      entries[existingIndex] = entry
    } else {
      entries.push(entry)
    }

    entries.sort((a, b) => new Date(b.dateSearch).getTime() - new Date(a.dateSearch).getTime())
    await this.writeEntries(key, entries.slice(0, MAX_ENTRIES_PER_KEY))

    return true
  }

  async deleteById(id: string): Promise<boolean> {
    const keys = await valkeyClient.keys(`${CACHE_PREFIX}:*`)

    for (const key of keys) {
      const entries = await this.readEntries(key)
      const index = entries.findIndex(e => e.id === id)

      if (index >= 0) {
        entries.splice(index, 1)
        await this.writeEntries(key, entries)
        return true
      }
    }

    return false
  }

  async findMany(filter: BusquedaRecienteFilterRepo, limit: number): Promise<{ data: BusquedaRecienteRepoResponse[]; meta: Meta }> {
    const key = this.buildKey(filter.idUser, filter.database)
    const entries = await this.readEntries(key)

    const typeValues = this.resolveTypes(filter.type)

    const filtered = entries
      .filter(e => e.isActive && typeValues.includes(e.type))
      .sort((a, b) => new Date(b.dateSearch).getTime() - new Date(a.dateSearch).getTime())

    const total = filtered.length
    const limited = filtered.slice(0, limit)

    const data: BusquedaRecienteRepoResponse[] = limited.map(e => ({
      id: e.id,
      schema: e.schema,
      objectName: e.objectName,
      dateSearch: e.dateSearch,
    }))

    return { data, meta: { total, limit } }
  }

  async getById(id: string, context: Context): Promise<BusquedaReciente | null> {
    const key = this.buildKey(context.idUser, context.database)
    const entries = await this.readEntries(key)
    const entry = entries.find(e => e.id === id)

    if (!entry) return null

    return {
      id: entry.id,
      idUser: entry.idUser,
      database: entry.database,
      schema: entry.schema,
      objectName: entry.objectName,
      type: entry.type,
      dateSearch: entry.dateSearch,
      isActive: entry.isActive,
    }
  }

  private buildKey(userId: number, database: string): string {
    return `${CACHE_PREFIX}:${userId}:${database.toLowerCase()}`
  }

  private generateId(userId: number, database: string, schema: string, objectName: string): string {
    const raw = `${userId}:${database.toLowerCase()}:${schema.toLowerCase()}:${objectName.toLowerCase()}`
    return createHash('md5').update(raw).digest('hex')
  }

  private async readEntries(key: string): Promise<CacheEntry[]> {
    const raw = await valkeyClient.get(key)
    if (!raw) return []
    return JSON.parse(raw) as CacheEntry[]
  }

  private async writeEntries(key: string, entries: CacheEntry[]): Promise<void> {
    if (entries.length === 0) {
      await valkeyClient.del(key)
      return
    }
    await valkeyClient.set(key, JSON.stringify(entries), 'EX', BUSQUEDA_RECIENTE_CACHE_TTL)
  }

  private resolveTypes(type: string): string[] {
    switch (type) {
      case TypeSysObjectEnum.ALL:
        return ['P', 'FN', 'TR', 'TF', 'V', 'U']
      case TypeSysObjectEnum.ALL_EXCEPT_USERTABLE:
        return ['P', 'FN', 'TR', 'TF', 'V']
      default:
        return [type]
    }
  }
}
