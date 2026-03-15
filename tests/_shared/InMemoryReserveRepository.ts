import type { IReserveRepository, ReserveWithCharacter } from '../../src/domain/reserve/repositories/IReserveRepository.js'
import type { Reserve } from '../../src/domain/reserve/entities/Reserve.js'
import type { UniqueEntityId } from '../../src/domain/_shared/UniqueEntityId.js'

export interface InMemoryCharacterData {
  userId: string
  playerName: string
  characterName: string
  characterClass: string
}

export class InMemoryReserveRepository implements IReserveRepository {
  public items: Reserve[] = []
  /** Seed this map (characterId → data) so findWithCharactersByRaidId returns real userId/names */
  public characterData: Map<string, InMemoryCharacterData> = new Map()

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

  async findActiveByCharactersAndRaid(characterIds: string[], raidId: string): Promise<Reserve | null> {
    return (
      this.items.find(
        (r) => characterIds.includes(r.characterId) && r.raidId === raidId && r.status === 'ACTIVE'
      ) ?? null
    )
  }

  async findWithCharactersByRaidId(raidId: string): Promise<ReserveWithCharacter[]> {
    return this.items
      .filter((r) => r.raidId === raidId && r.status === 'ACTIVE')
      .map((r) => {
        const char = this.characterData.get(r.characterId)
        return {
          reserveId: r.id.value,
          characterId: r.characterId,
          userId: char?.userId ?? '',
          playerName: char?.playerName ?? '',
          characterName: char?.characterName ?? '',
          characterClass: char?.characterClass ?? '',
          itemName: r.itemName,
        }
      })
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
