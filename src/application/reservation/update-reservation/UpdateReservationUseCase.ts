import type { UseCase } from '../../_shared/UseCase.js'
import type { IReserveRepository } from '../../../domain/reserve/repositories/IReserveRepository.js'
import type { IReservationFormRepository } from '../../../domain/reservation-form/repositories/IReservationFormRepository.js'
import type { IRaidRepository } from '../../../domain/raid/repositories/IRaidRepository.js'
import type { ICharacterRepository } from '../../../domain/character/repositories/ICharacterRepository.js'
import type { IBossRepository } from '../../../domain/boss/repositories/IBossRepository.js'
import type { IItemRepository } from '../../../domain/item/repositories/IItemRepository.js'
import { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'

const ELEVATED_ROLES = ['RAID_LEADER', 'OFFICER', 'ADMIN']

export class ReserveNotFoundError extends Error {
  constructor(id: string) {
    super(`Reserva não encontrada: ${id}`)
    this.name = 'ReserveNotFoundError'
  }
}

export class ReserveNotInOpenFormError extends Error {
  constructor() {
    super('Reserva não pertence ao formulário aberto')
    this.name = 'ReserveNotInOpenFormError'
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super('Você não tem permissão para alterar esta reserva')
    this.name = 'ForbiddenError'
  }
}

export class ItemNotFoundError extends Error {
  constructor(id: string) {
    super(`Item não encontrado no formulário: ${id}`)
    this.name = 'ItemNotFoundError'
  }
}

export interface UpdateReservationInput {
  reserveId: string
  bossId: string
  itemId: string
  requestingUserId: string
  requestingUserRole: string
}

export interface UpdateReservationOutput {
  id: string
  raidId: string
  characterId: string
  itemName: string
  status: string
  updatedAt: Date
  boss: {
    id: string
    name: string
    orderIndex: number
  }
  item: {
    id: string
    name: string
    itemType: string
    ilvl: number
  }
}

export class UpdateReservationUseCase
  implements UseCase<UpdateReservationInput, UpdateReservationOutput>
{
  constructor(
    private readonly reserveRepository: IReserveRepository,
    private readonly reservationFormRepository: IReservationFormRepository,
    private readonly raidRepository: IRaidRepository,
    private readonly characterRepository: ICharacterRepository,
    private readonly bossRepository: IBossRepository,
    private readonly itemRepository: IItemRepository
  ) {}

  async execute(input: UpdateReservationInput): Promise<UpdateReservationOutput> {
    // 1. Load the reserve
    const reserve = await this.reserveRepository.findById(new UniqueEntityId(input.reserveId))
    if (!reserve || reserve.status !== 'ACTIVE') {
      throw new ReserveNotFoundError(input.reserveId)
    }

    // 2. Find the currently open form and its target raid
    const form = await this.reservationFormRepository.findCurrentOpen()
    if (!form) {
      throw new ReserveNotInOpenFormError()
    }

    const targetRaid = await this.raidRepository.findByDate(form.weekOf)
    if (!targetRaid || reserve.raidId !== targetRaid.id.value) {
      throw new ReserveNotInOpenFormError()
    }

    // 3. Authorization: must own the reserve or have an elevated role
    const hasElevatedRole = ELEVATED_ROLES.includes(input.requestingUserRole)
    if (!hasElevatedRole) {
      const characters = await this.characterRepository.findByUserId(
        new UniqueEntityId(input.requestingUserId)
      )
      const ownsReserve = characters.some((c) => c.id.value === reserve.characterId)
      if (!ownsReserve) {
        throw new ForbiddenError()
      }
    }

    // 4. Validate boss belongs to the target raid
    const boss = await this.bossRepository.findById(new UniqueEntityId(input.bossId))
    if (!boss || boss.raidId !== targetRaid.id.value) {
      throw new ItemNotFoundError(input.itemId)
    }

    // 5. Validate item belongs to the given boss
    const item = await this.itemRepository.findById(new UniqueEntityId(input.itemId))
    if (!item || item.bossId !== input.bossId) {
      throw new ItemNotFoundError(input.itemId)
    }

    // 6. Apply mutation and persist
    reserve.changeItem(item.name)
    await this.reserveRepository.save(reserve)

    return {
      id: reserve.id.value,
      raidId: reserve.raidId,
      characterId: reserve.characterId,
      itemName: reserve.itemName,
      status: reserve.status,
      updatedAt: reserve.updatedAt,
      boss: {
        id: boss.id.value,
        name: boss.name,
        orderIndex: boss.orderIndex,
      },
      item: {
        id: item.id.value,
        name: item.name,
        itemType: item.itemType as string,
        ilvl: item.ilvl,
      },
    }
  }
}
