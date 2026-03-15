import type { IReserveRepository } from '../repositories/IReserveRepository.js'
import { UniqueEntityId } from '../../_shared/UniqueEntityId.js'

const MAX_RESERVES_PER_CHARACTER = 2

export class ReserveDomainService {
  constructor(private readonly reserveRepository: IReserveRepository) {}

  async canCharacterReserve(raidId: string, characterId: string): Promise<boolean> {
    const existing = await this.reserveRepository.findByCharacterAndRaid(
      new UniqueEntityId(characterId),
      new UniqueEntityId(raidId)
    )
    const activeReserves = existing.filter((r) => r.status === 'ACTIVE')
    return activeReserves.length < MAX_RESERVES_PER_CHARACTER
  }

  async isItemAlreadyReserved(
    raidId: string,
    characterId: string,
    itemName: string
  ): Promise<boolean> {
    const existing = await this.reserveRepository.findByRaidCharacterAndItem(
      new UniqueEntityId(raidId),
      new UniqueEntityId(characterId),
      itemName
    )
    return existing !== null && existing.status === 'ACTIVE'
  }
}
