import type { IRaidRepository } from '../../src/domain/raid/repositories/IRaidRepository.js'
import type { Raid } from '../../src/domain/raid/entities/Raid.js'
import type { UniqueEntityId } from '../../src/domain/_shared/UniqueEntityId.js'

export class InMemoryRaidRepository implements IRaidRepository {
  public items: Raid[] = []

  async findById(id: UniqueEntityId): Promise<Raid | null> {
    return this.items.find((r) => r.id.equals(id)) ?? null
  }

  async findAll(): Promise<Raid[]> {
    return [...this.items]
  }

  async findByDate(date: Date): Promise<Raid | null> {
    return (
      this.items.find((r) => r.date.getTime() === date.getTime()) ?? null
    )
  }

  async save(raid: Raid): Promise<void> {
    const index = this.items.findIndex((r) => r.id.equals(raid.id))
    if (index >= 0) {
      this.items[index] = raid
    } else {
      this.items.push(raid)
    }
  }

  async delete(id: UniqueEntityId): Promise<void> {
    this.items = this.items.filter((r) => !r.id.equals(id))
  }
}
