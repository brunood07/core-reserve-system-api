import type { IItemRepository } from '../../src/domain/item/repositories/IItemRepository.js'
import type { Item } from '../../src/domain/item/entities/Item.js'
import type { UniqueEntityId } from '../../src/domain/_shared/UniqueEntityId.js'

export class InMemoryItemRepository implements IItemRepository {
  public items: Item[] = []

  async findById(id: UniqueEntityId): Promise<Item | null> {
    return this.items.find((i) => i.id.equals(id)) ?? null
  }

  async findAll(): Promise<Item[]> {
    return [...this.items]
  }

  async findByBossId(bossId: string): Promise<Item[]> {
    return this.items.filter((i) => i.bossId === bossId)
  }

  async save(item: Item): Promise<void> {
    const index = this.items.findIndex((i) => i.id.equals(item.id))
    if (index >= 0) {
      this.items[index] = item
    } else {
      this.items.push(item)
    }
  }

  async delete(id: UniqueEntityId): Promise<void> {
    this.items = this.items.filter((i) => !i.id.equals(id))
  }
}
