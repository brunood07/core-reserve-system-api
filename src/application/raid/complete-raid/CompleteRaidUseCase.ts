import type { UseCase } from '../../_shared/UseCase.js'
import type { IRaidRepository } from '../../../domain/raid/repositories/IRaidRepository.js'
import type { IReservationFormRepository } from '../../../domain/reservation-form/repositories/IReservationFormRepository.js'
import { ReservationForm } from '../../../domain/reservation-form/entities/ReservationForm.js'
import { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'

export class RaidNotFoundError extends Error {
  constructor(id: string) {
    super(`Raid não encontrada: ${id}`)
    this.name = 'RaidNotFoundError'
  }
}

export class RaidAlreadyCompletedError extends Error {
  constructor() {
    super('Esta raid já foi finalizada')
    this.name = 'RaidAlreadyCompletedError'
  }
}

export interface CompleteRaidInput {
  raidId: string
}

export interface CompleteRaidOutput {
  raidId: string
  status: string
  reservationFormCreated: boolean
  formClosesAt?: Date
}

/** Returns the next Wednesday at UTC midnight strictly after `from`. */
function nextWednesday(from: Date): Date {
  const d = new Date(from)
  const daysUntil = (3 - d.getUTCDay() + 7) % 7 || 7
  d.setUTCDate(d.getUTCDate() + daysUntil)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

/**
 * Reservation form closes on Tuesday at 22:00 BRT (= Wednesday at 01:00 UTC).
 * `wednesday` is the weekOf date (Wednesday midnight UTC).
 */
function closesAtForWeek(wednesday: Date): Date {
  const d = new Date(wednesday)
  d.setUTCHours(1, 0, 0, 0)
  return d
}

export class CompleteRaidUseCase implements UseCase<CompleteRaidInput, CompleteRaidOutput> {
  constructor(
    private readonly raidRepository: IRaidRepository,
    private readonly reservationFormRepository: IReservationFormRepository
  ) {}

  async execute(input: CompleteRaidInput): Promise<CompleteRaidOutput> {
    const raid = await this.raidRepository.findById(new UniqueEntityId(input.raidId))
    if (!raid) {
      throw new RaidNotFoundError(input.raidId)
    }
    if (raid.status === 'COMPLETED') {
      throw new RaidAlreadyCompletedError()
    }

    raid.complete()
    await this.raidRepository.save(raid)

    // Create reservation form for the next Wednesday
    const weekOf = nextWednesday(raid.date)
    const existing = await this.reservationFormRepository.findByWeekOf(weekOf)

    let reservationFormCreated = false
    let formClosesAt: Date | undefined

    if (!existing) {
      const closesAt = closesAtForWeek(weekOf)
      const form = ReservationForm.create({
        weekOf,
        opensAt: new Date(),
        closesAt,
      })
      await this.reservationFormRepository.save(form)
      reservationFormCreated = true
      formClosesAt = closesAt
    }

    return {
      raidId: raid.id.value,
      status: raid.status,
      reservationFormCreated,
      formClosesAt,
    }
  }
}
