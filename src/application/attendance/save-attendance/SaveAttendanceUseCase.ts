import type { UseCase } from '../../_shared/UseCase.js'
import type { IRaidRepository } from '../../../domain/raid/repositories/IRaidRepository.js'
import type { IRaidAttendanceRepository } from '../../../domain/attendance/repositories/IRaidAttendanceRepository.js'
import type { IReservationFormRepository } from '../../../domain/reservation-form/repositories/IReservationFormRepository.js'
import { ReservationForm } from '../../../domain/reservation-form/entities/ReservationForm.js'
import { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'

export interface AttendanceInput {
  userId: string
  characterId: string
  attended: boolean
}

export interface SaveAttendanceInput {
  raidId: string
  attendances: AttendanceInput[]
}

export interface AttendanceOutput {
  id: string
  raidId: string
  userId: string
  characterId: string
  attended: boolean
}

export interface SaveAttendanceOutput {
  attendances: AttendanceOutput[]
  reservationFormCreated: boolean
}

export class RaidNotFoundError extends Error {
  constructor(id: string) {
    super(`Raid not found: ${id}`)
    this.name = 'RaidNotFoundError'
  }
}

/** Returns the next Wednesday (UTC midnight) strictly after the given date. */
function nextWednesday(from: Date): Date {
  const d = new Date(from)
  // If it's already Wednesday (3), move to next week's Wednesday
  const daysUntil = (3 - d.getUTCDay() + 7) % 7 || 7
  d.setUTCDate(d.getUTCDate() + daysUntil)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

/**
 * Returns the closes_at datetime: the Tuesday before nextWed at 22:00 BRT.
 * Brasília (BRT) = UTC-3, so 22:00 BRT = 01:00 UTC the following day (Wednesday).
 */
function closesAtForWeek(wednesday: Date): Date {
  const d = new Date(wednesday)
  d.setUTCHours(1, 0, 0, 0) // 01:00 UTC on Wednesday = 22:00 Tuesday BRT
  return d
}

export class SaveAttendanceUseCase implements UseCase<SaveAttendanceInput, SaveAttendanceOutput> {
  constructor(
    private readonly raidRepository: IRaidRepository,
    private readonly attendanceRepository: IRaidAttendanceRepository,
    private readonly reservationFormRepository: IReservationFormRepository
  ) {}

  async execute(input: SaveAttendanceInput): Promise<SaveAttendanceOutput> {
    const raid = await this.raidRepository.findById(new UniqueEntityId(input.raidId))
    if (!raid) {
      throw new RaidNotFoundError(input.raidId)
    }

    // Mark raid as completed when attendance is submitted
    if (raid.status !== 'COMPLETED') {
      raid.complete()
      await this.raidRepository.save(raid)
    }

    const records = input.attendances.map((a) => ({
      raidId: input.raidId,
      userId: a.userId,
      characterId: a.characterId,
      attended: a.attended,
    }))

    const saved = await this.attendanceRepository.saveMany(records)

    const anyAttended = saved.some((a) => a.attended)
    let reservationFormCreated = false

    if (anyAttended) {
      const weekOf = nextWednesday(raid.date)
      const existing = await this.reservationFormRepository.findByWeekOf(weekOf)

      if (!existing) {
        const form = ReservationForm.create({
          weekOf,
          opensAt: new Date(),
          closesAt: closesAtForWeek(weekOf),
        })
        await this.reservationFormRepository.save(form)
        reservationFormCreated = true
      }
    }

    return {
      attendances: saved.map((a) => ({
        id: a.id.value,
        raidId: a.raidId,
        userId: a.userId,
        characterId: a.characterId,
        attended: a.attended,
      })),
      reservationFormCreated,
    }
  }
}
