import type { UniqueEntityId } from './UniqueEntityId.js'

export interface Repository<T> {
  findById(id: UniqueEntityId): Promise<T | null>
  findAll(): Promise<T[]>
  save(entity: T): Promise<void>
  delete(id: UniqueEntityId): Promise<void>
}
