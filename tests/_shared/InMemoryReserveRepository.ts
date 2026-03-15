import type { IReserveRepository } from '../../src/domain/reserve/repositories/IReserveRepository.js'
import type { Reserve } from '../../src/domain/reserve/entities/Reserve.js'
import type { UniqueEntityId } from '../../src/domain/_shared/UniqueEntityId.js'

export class InMemoryReserveRepository implements IReserveRepository {
  public items: Reserve[] = []

  async findById(id: UniqueEntityId): Promise<Reserve | null> {
    return this.items.find((r) => r.id.equals(id)) ?? null
  }

  async findAll(): Promise<Reserve[]> {
    return [...this.items]
  }

  async findByRaidId(raidId: UniqueEntityId): Promise<Reserve[]> {
    return this.items.filter((r) => r.raidId === raidId.value)
  }

  async findByCharacterAndRaid(
    characterId: UniqueEntityId,
    raidId: UniqueEntityId
  ): Promise<Reserve[]> {
    return this.items.filter(
      (r) => r.characterId === characterId.value && r.raidId === raidId.value
    )
  }

  async findByRaidCharacterAndItem(
    raidId: UniqueEntityId,
    characterId: UniqueEntityId,
    itemName: string
  ): Promise<Reserve | null> {
    return (
      this.items.find(
        (r) =>
          r.raidId === raidId.value &&
          r.characterId === characterId.value &&
          r.itemName === itemName
      ) ?? null
    )
  }

  async save(reserve: Reserve): Promise<void> {
    const index = this.items.findIndex((r) => r.id.equals(reserve.id))
    if (index >= 0) {
      this.items[index] = reserve
    } else {
      this.items.push(reserve)
    }
  }

  async delete(id: UniqueEntityId): Promise<void> {
    this.items = this.items.filter((r) => !r.id.equals(id))
  }
}
