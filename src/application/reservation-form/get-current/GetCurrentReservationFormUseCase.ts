import type { UseCase } from '../../_shared/UseCase.js'
import type { IReservationFormRepository } from '../../../domain/reservation-form/repositories/IReservationFormRepository.js'
import type { IRaidRepository } from '../../../domain/raid/repositories/IRaidRepository.js'
import type { IRaidAttendanceRepository } from '../../../domain/attendance/repositories/IRaidAttendanceRepository.js'
import type { ICharacterRepository } from '../../../domain/character/repositories/ICharacterRepository.js'
import type { IReserveRepository } from '../../../domain/reserve/repositories/IReserveRepository.js'
import type { IBossRepository, BossWithItems } from '../../../domain/boss/repositories/IBossRepository.js'
import { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'

export class NoOpenFormError extends Error {
  constructor() {
    super('Nenhum formulário de reservas aberto no momento')
    this.name = 'NoOpenFormError'
  }
}

export interface GetCurrentFormInput {
  userId: string
}

export interface CurrentReservation {
  id: string
  characterId: string
  itemName: string
  status: string
}

export interface GetCurrentFormOutput {
  form: {
    id: string
    weekOf: Date
    opensAt: Date
    closesAt: Date
    status: string
  }
  canReserve: boolean
  currentReservation: CurrentReservation | null
  bosses: BossWithItems[]
}

export class GetCurrentReservationFormUseCase
  implements UseCase<GetCurrentFormInput, GetCurrentFormOutput>
{
  constructor(
    private readonly reservationFormRepository: IReservationFormRepository,
    private readonly raidRepository: IRaidRepository,
    private readonly attendanceRepository: IRaidAttendanceRepository,
    private readonly characterRepository: ICharacterRepository,
    private readonly reserveRepository: IReserveRepository,
    private readonly bossRepository: IBossRepository
  ) {}

  async execute(input: GetCurrentFormInput): Promise<GetCurrentFormOutput> {
    const form = await this.reservationFormRepository.findCurrentOpen()
    if (!form) {
      throw new NoOpenFormError()
    }

    // Source raid: the raid 7 days before weekOf (the one that generated this form)
    const sourceRaidDate = new Date(form.weekOf)
    sourceRaidDate.setUTCDate(sourceRaidDate.getUTCDate() - 7)

    let canReserve = false
    const sourceRaid = await this.raidRepository.findByDate(sourceRaidDate)
    if (sourceRaid) {
      const attendance = await this.attendanceRepository.findByRaidAndUser(
        sourceRaid.id.value,
        input.userId
      )
      canReserve = attendance?.attended === true
    }

    // Target raid: the raid on weekOf (the upcoming one players are reserving for)
    const targetRaid = await this.raidRepository.findByDate(form.weekOf)

    let bosses: BossWithItems[] = []
    let currentReservation: CurrentReservation | null = null

    if (targetRaid) {
      bosses = await this.bossRepository.findByRaidIdWithItems(targetRaid.id.value)

      const characters = await this.characterRepository.findByUserId(
        new UniqueEntityId(input.userId)
      )
      const characterIds = characters.map((c) => c.id.value)

      const reserve = await this.reserveRepository.findActiveByCharactersAndRaid(
        characterIds,
        targetRaid.id.value
      )

      if (reserve) {
        currentReservation = {
          id: reserve.id.value,
          characterId: reserve.characterId,
          itemName: reserve.itemName,
          status: reserve.status,
        }
      }
    }

    return {
      form: {
        id: form.id.value,
        weekOf: form.weekOf,
        opensAt: form.opensAt,
        closesAt: form.closesAt,
        status: form.status,
      },
      canReserve,
      currentReservation,
      bosses,
    }
  }
}
