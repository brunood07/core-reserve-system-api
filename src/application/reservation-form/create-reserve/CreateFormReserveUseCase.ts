import type { UseCase } from '../../_shared/UseCase.js'
import type { IReservationFormRepository } from '../../../domain/reservation-form/repositories/IReservationFormRepository.js'
import type { IRaidRepository } from '../../../domain/raid/repositories/IRaidRepository.js'
import type { IRaidAttendanceRepository } from '../../../domain/attendance/repositories/IRaidAttendanceRepository.js'
import type { ICharacterRepository } from '../../../domain/character/repositories/ICharacterRepository.js'
import type { IReserveRepository } from '../../../domain/reserve/repositories/IReserveRepository.js'
import type { IBossRepository } from '../../../domain/boss/repositories/IBossRepository.js'
import type { IItemRepository } from '../../../domain/item/repositories/IItemRepository.js'
import { Reserve } from '../../../domain/reserve/entities/Reserve.js'
import { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'

export class FormNotFoundError extends Error {
  constructor(id: string) {
    super(`Formulário não encontrado: ${id}`)
    this.name = 'FormNotFoundError'
  }
}

export class FormClosedError extends Error {
  constructor() {
    super('Formulário de reservas está fechado')
    this.name = 'FormClosedError'
  }
}

export class NotAttendedError extends Error {
  constructor() {
    super('Você não esteve presente na raid e não pode fazer reservas')
    this.name = 'NotAttendedError'
  }
}

export class ItemNotFoundError extends Error {
  constructor(id: string) {
    super(`Item não encontrado no formulário: ${id}`)
    this.name = 'ItemNotFoundError'
  }
}

export class ReservationAlreadyExistsError extends Error {
  constructor() {
    super('Você já realizou uma reserva para esta semana')
    this.name = 'ReservationAlreadyExistsError'
  }
}

export class NoActiveCharacterError extends Error {
  constructor() {
    super('Nenhum personagem ativo encontrado. Ative um personagem antes de fazer uma reserva.')
    this.name = 'NoActiveCharacterError'
  }
}

export interface CreateFormReserveInput {
  formId: string
  bossId: string
  itemId: string
  userId: string
}

export interface CreateFormReserveOutput {
  id: string
  raidId: string
  characterId: string
  itemName: string
  status: string
  createdAt: Date
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

export class CreateFormReserveUseCase
  implements UseCase<CreateFormReserveInput, CreateFormReserveOutput>
{
  constructor(
    private readonly reservationFormRepository: IReservationFormRepository,
    private readonly raidRepository: IRaidRepository,
    private readonly attendanceRepository: IRaidAttendanceRepository,
    private readonly characterRepository: ICharacterRepository,
    private readonly reserveRepository: IReserveRepository,
    private readonly bossRepository: IBossRepository,
    private readonly itemRepository: IItemRepository
  ) {}

  async execute(input: CreateFormReserveInput): Promise<CreateFormReserveOutput> {
    // 1. Load and validate form
    const form = await this.reservationFormRepository.findById(new UniqueEntityId(input.formId))
    if (!form) {
      throw new FormNotFoundError(input.formId)
    }
    if (form.status !== 'OPEN' || form.closesAt <= new Date()) {
      throw new FormClosedError()
    }

    // 2. Verify attendance on the source raid (weekOf - 7 days)
    const sourceDate = new Date(form.weekOf)
    sourceDate.setUTCDate(sourceDate.getUTCDate() - 7)

    const sourceRaid = await this.raidRepository.findByDate(sourceDate)
    if (!sourceRaid) {
      throw new NotAttendedError()
    }
    const attendance = await this.attendanceRepository.findByRaidAndUser(
      sourceRaid.id.value,
      input.userId
    )
    if (!attendance?.attended) {
      throw new NotAttendedError()
    }

    // 3. Load target raid (the raid on weekOf)
    const targetRaid = await this.raidRepository.findByDate(form.weekOf)
    if (!targetRaid) {
      throw new ItemNotFoundError(input.itemId)
    }

    // 4. Validate boss exists and belongs to the target raid
    const boss = await this.bossRepository.findById(new UniqueEntityId(input.bossId))
    if (!boss || boss.raidId !== targetRaid.id.value) {
      throw new ItemNotFoundError(input.itemId)
    }

    // 5. Validate item exists and belongs to the given boss
    const item = await this.itemRepository.findById(new UniqueEntityId(input.itemId))
    if (!item || item.bossId !== input.bossId) {
      throw new ItemNotFoundError(input.itemId)
    }

    // 6. Load user's characters and check for existing reserve this week
    const characters = await this.characterRepository.findByUserId(
      new UniqueEntityId(input.userId)
    )
    const characterIds = characters.map((c) => c.id.value)

    const existingReserve = await this.reserveRepository.findActiveByCharactersAndRaid(
      characterIds,
      targetRaid.id.value
    )
    if (existingReserve) {
      throw new ReservationAlreadyExistsError()
    }

    // 7. Get the user's active character
    const activeCharacter = characters.find((c) => c.isActive)
    if (!activeCharacter) {
      throw new NoActiveCharacterError()
    }

    // 8. Create and persist the reserve
    const reserve = Reserve.create({
      raidId: targetRaid.id.value,
      characterId: activeCharacter.id.value,
      itemName: item.name,
    })
    await this.reserveRepository.save(reserve)

    return {
      id: reserve.id.value,
      raidId: reserve.raidId,
      characterId: reserve.characterId,
      itemName: reserve.itemName,
      status: reserve.status,
      createdAt: reserve.createdAt,
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
