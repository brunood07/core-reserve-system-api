import type { Repository } from '../../_shared/Repository.js'
import type { Reserve } from '../entities/Reserve.js'
import type { UniqueEntityId } from '../../_shared/UniqueEntityId.js'

export interface ReserveWithCharacter {
  reserveId: string
  characterId: string
  userId: string
  playerName: string
  characterName: string
  characterClass: string
  itemName: string
}

export interface IReserveRepository extends Repository<Reserve> {
  findByRaidId(raidId: UniqueEntityId): Promise<Reserve[]>
  findByCharacterAndRaid(
    characterId: UniqueEntityId,
    raidId: UniqueEntityId
  ): Promise<Reserve[]>
  findByRaidCharacterAndItem(
    raidId: UniqueEntityId,
    characterId: UniqueEntityId,
    itemName: string
  ): Promise<Reserve | null>
  findActiveByCharactersAndRaid(characterIds: string[], raidId: string): Promise<Reserve | null>
  findWithCharactersByRaidId(raidId: string): Promise<ReserveWithCharacter[]>
}
