import type { UseCase } from '../../_shared/UseCase.js'
import type { IReserveRepository } from '../../../domain/reserve/repositories/IReserveRepository.js'
import type { IRaidRepository } from '../../../domain/raid/repositories/IRaidRepository.js'
import type { ICharacterRepository } from '../../../domain/character/repositories/ICharacterRepository.js'
import { Reserve } from '../../../domain/reserve/entities/Reserve.js'
import { ReserveDomainService } from '../../../domain/reserve/services/ReserveDomainService.js'
import { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'

export interface CreateReserveInput {
  raidId: string
  characterId: string
  itemName: string
}

export interface CreateReserveOutput {
  reserveId: string
  raidId: string
  characterId: string
  itemName: string
  status: string
  createdAt: Date
}

export class CreateReserveUseCase implements UseCase<CreateReserveInput, CreateReserveOutput> {
  private readonly domainService: ReserveDomainService

  constructor(
    private readonly reserveRepository: IReserveRepository,
    private readonly raidRepository: IRaidRepository,
    private readonly characterRepository: ICharacterRepository
  ) {
    this.domainService = new ReserveDomainService(reserveRepository)
  }

  async execute(input: CreateReserveInput): Promise<CreateReserveOutput> {
    const raid = await this.raidRepository.findById(new UniqueEntityId(input.raidId))
    if (!raid) throw new Error(`Raid not found: ${input.raidId}`)

    const character = await this.characterRepository.findById(
      new UniqueEntityId(input.characterId)
    )
    if (!character) throw new Error(`Character not found: ${input.characterId}`)

    const alreadyReserved = await this.domainService.isItemAlreadyReserved(
      input.raidId,
      input.characterId,
      input.itemName
    )
    if (alreadyReserved) {
      throw new Error(
        `Character "${character.name}" already has an active reserve for "${input.itemName}" in this raid`
      )
    }

    const canReserve = await this.domainService.canCharacterReserve(
      input.raidId,
      input.characterId
    )
    if (!canReserve) {
      throw new Error(
        `Character "${character.name}" has reached the maximum number of reserves for this raid`
      )
    }

    const reserve = Reserve.create(input)
    await this.reserveRepository.save(reserve)

    return {
      reserveId: reserve.id.value,
      raidId: reserve.raidId,
      characterId: reserve.characterId,
      itemName: reserve.itemName,
      status: reserve.status,
      createdAt: reserve.createdAt,
    }
  }
}
