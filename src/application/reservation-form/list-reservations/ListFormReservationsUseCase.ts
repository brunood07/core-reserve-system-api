import type { UseCase } from '../../_shared/UseCase.js'
import type { IReservationFormRepository } from '../../../domain/reservation-form/repositories/IReservationFormRepository.js'
import type { IRaidRepository } from '../../../domain/raid/repositories/IRaidRepository.js'
import type { IRaidAttendanceRepository } from '../../../domain/attendance/repositories/IRaidAttendanceRepository.js'
import type { IBossRepository, BossWithItems } from '../../../domain/boss/repositories/IBossRepository.js'
import type { IReserveRepository } from '../../../domain/reserve/repositories/IReserveRepository.js'
import { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'

export class FormNotFoundError extends Error {
  constructor(id: string) {
    super(`Formulário não encontrado: ${id}`)
    this.name = 'FormNotFoundError'
  }
}

export interface ReservationEntryItem {
  itemId: string
  itemName: string
  itemType: string
  ilvl: number
}

export interface ReservationEntry {
  reserveId: string
  playerName: string
  characterName: string
  characterClass: string
  item: ReservationEntryItem
}

export interface BossReservationGroup {
  bossId: string
  bossName: string
  orderIndex: number
  reservations: ReservationEntry[]
  count: number
}

export interface PendingPlayer {
  userId: string
  playerName: string
  characterName: string
  characterClass: string
  hasPendingReservation: true
}

export interface ListFormReservationsInput {
  formId: string
}

export interface ListFormReservationsOutput {
  formId: string
  weekOf: Date
  bosses: BossReservationGroup[]
  playersWithPendingReservation: PendingPlayer[]
  summary: {
    totalReservations: number
    totalPending: number
  }
}

export class ListFormReservationsUseCase
  implements UseCase<ListFormReservationsInput, ListFormReservationsOutput>
{
  constructor(
    private readonly reservationFormRepository: IReservationFormRepository,
    private readonly raidRepository: IRaidRepository,
    private readonly attendanceRepository: IRaidAttendanceRepository,
    private readonly bossRepository: IBossRepository,
    private readonly reserveRepository: IReserveRepository
  ) {}

  async execute(input: ListFormReservationsInput): Promise<ListFormReservationsOutput> {
    // 1. Load the form
    const form = await this.reservationFormRepository.findById(new UniqueEntityId(input.formId))
    if (!form) {
      throw new FormNotFoundError(input.formId)
    }

    // 2. Resolve source (previous week) and target (form week) raids in parallel
    const sourceDate = new Date(form.weekOf)
    sourceDate.setUTCDate(sourceDate.getUTCDate() - 7)

    const [sourceRaid, targetRaid] = await Promise.all([
      this.raidRepository.findByDate(sourceDate),
      this.raidRepository.findByDate(form.weekOf),
    ])

    // 3. Fetch attendance (present only), bosses+items, and enriched reserves in parallel
    const [attendanceSummary, bossesWithItems, reservesWithChars] = await Promise.all([
      sourceRaid
        ? this.attendanceRepository.findRaidAttendanceSummary(sourceRaid.id.value)
        : Promise.resolve(null),
      targetRaid
        ? this.bossRepository.findByRaidIdWithItems(targetRaid.id.value)
        : Promise.resolve<BossWithItems[]>([]),
      targetRaid
        ? this.reserveRepository.findWithCharactersByRaidId(targetRaid.id.value)
        : Promise.resolve([]),
    ])

    const presentAttendees = attendanceSummary?.present ?? []

    // 4. Build itemName → BossWithItems map (safe: item names should be unique within a raid)
    const itemNameToBoss = new Map<string, BossWithItems>()
    const itemByName = new Map<string, BossWithItems['items'][number]>()
    for (const boss of bossesWithItems) {
      for (const item of boss.items) {
        itemNameToBoss.set(item.name, boss)
        itemByName.set(item.name, item)
      }
    }

    // 5. Group reserves by boss
    const bossReservesMap = new Map<string, ReservationEntry[]>()
    for (const boss of bossesWithItems) {
      bossReservesMap.set(boss.id, [])
    }

    for (const reserve of reservesWithChars) {
      const boss = itemNameToBoss.get(reserve.itemName)
      const item = itemByName.get(reserve.itemName)
      if (boss && item) {
        bossReservesMap.get(boss.id)!.push({
          reserveId: reserve.reserveId,
          playerName: reserve.playerName,
          characterName: reserve.characterName,
          characterClass: reserve.characterClass,
          item: {
            itemId: item.id,
            itemName: item.name,
            itemType: item.itemType,
            ilvl: item.ilvl,
          },
        })
      }
    }

    const bosses: BossReservationGroup[] = bossesWithItems.map((boss) => {
      const reservations = bossReservesMap.get(boss.id) ?? []
      return {
        bossId: boss.id,
        bossName: boss.name,
        orderIndex: boss.orderIndex,
        reservations,
        count: reservations.length,
      }
    })

    // 6. Pending players: attended the source raid but haven't reserved on the target raid
    const reservingUserIds = new Set(reservesWithChars.map((r) => r.userId))

    const playersWithPendingReservation: PendingPlayer[] = presentAttendees
      .filter((a) => !reservingUserIds.has(a.userId))
      .map((a) => ({
        userId: a.userId,
        playerName: a.playerName,
        characterName: a.characterName,
        characterClass: a.characterClass,
        hasPendingReservation: true as const,
      }))

    return {
      formId: form.id.value,
      weekOf: form.weekOf,
      bosses,
      playersWithPendingReservation,
      summary: {
        totalReservations: reservesWithChars.length,
        totalPending: playersWithPendingReservation.length,
      },
    }
  }
}
