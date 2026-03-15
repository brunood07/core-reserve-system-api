import type { Repository } from '../../_shared/Repository.js'
import type { Reserve } from '../entities/Reserve.js'
import type { UniqueEntityId } from '../../_shared/UniqueEntityId.js'

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
}
