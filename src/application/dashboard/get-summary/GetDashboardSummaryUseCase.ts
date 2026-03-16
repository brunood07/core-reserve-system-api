import type { UseCase } from '../../_shared/UseCase.js'
import type { IUserRepository } from '../../../domain/user/repositories/IUserRepository.js'
import type { IRaidRepository } from '../../../domain/raid/repositories/IRaidRepository.js'
import type { IReservationFormRepository } from '../../../domain/reservation-form/repositories/IReservationFormRepository.js'
import type { IRaidAttendanceRepository } from '../../../domain/attendance/repositories/IRaidAttendanceRepository.js'
import type { IBossRepository, BossWithItems } from '../../../domain/boss/repositories/IBossRepository.js'
import type { IReserveRepository } from '../../../domain/reserve/repositories/IReserveRepository.js'

export interface DashboardReservationEntry {
  reserveId: string
  playerName: string
  characterName: string
  characterClass: string
  item: {
    itemName: string
    itemType: string
    ilvl: number
  }
}

export interface DashboardBossGroup {
  bossId: string
  bossName: string
  orderIndex: number
  count: number
  reservations: DashboardReservationEntry[]
}

export interface DashboardRecentRaid {
  id: string
  date: Date
  status: string
  description: string | null
  presentCount: number
}

export interface DashboardNextRaid {
  id: string
  date: Date
  status: string
  description: string | null
}

export interface DashboardReservationForm {
  id: string
  status: string
  closesAt: Date
}

export interface GetDashboardSummaryOutput {
  totalActivePlayers: number
  nextRaid: DashboardNextRaid | null
  reservationForm: DashboardReservationForm | null
  averageAttendanceRate: number
  recentRaids: DashboardRecentRaid[]
  currentWeekReservations: DashboardBossGroup[]
}

export class GetDashboardSummaryUseCase
  implements UseCase<void, GetDashboardSummaryOutput>
{
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly raidRepository: IRaidRepository,
    private readonly reservationFormRepository: IReservationFormRepository,
    private readonly attendanceRepository: IRaidAttendanceRepository,
    private readonly bossRepository: IBossRepository,
    private readonly reserveRepository: IReserveRepository
  ) {}

  async execute(): Promise<GetDashboardSummaryOutput> {
    const [totalActivePlayers, nextRaid, openForm, recentRaids, averageAttendanceRate] =
      await Promise.all([
        this.userRepository.countActivePlayers(),
        this.raidRepository.findUpcoming(),
        this.reservationFormRepository.findCurrentOpen(),
        this.raidRepository.findRecentWithPresentCount(5),
        this.attendanceRepository.findAverageAttendanceRate(4),
      ])

    let currentWeekReservations: DashboardBossGroup[] = []

    if (openForm && nextRaid) {
      const [bossesWithItems, reservesWithChars] = await Promise.all([
        this.bossRepository.findByRaidIdWithItems(nextRaid.id.value),
        this.reserveRepository.findWithCharactersByRaidId(nextRaid.id.value),
      ])

      const itemNameToBoss = new Map<string, BossWithItems>()
      const itemByName = new Map<string, BossWithItems['items'][number]>()
      for (const boss of bossesWithItems) {
        for (const item of boss.items) {
          itemNameToBoss.set(item.name, boss)
          itemByName.set(item.name, item)
        }
      }

      const bossReservesMap = new Map<string, DashboardReservationEntry[]>()
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
              itemName: item.name,
              itemType: item.itemType,
              ilvl: item.ilvl,
            },
          })
        }
      }

      currentWeekReservations = bossesWithItems.map((boss) => {
        const reservations = bossReservesMap.get(boss.id) ?? []
        return {
          bossId: boss.id,
          bossName: boss.name,
          orderIndex: boss.orderIndex,
          count: reservations.length,
          reservations,
        }
      })
    }

    return {
      totalActivePlayers,
      nextRaid: nextRaid
        ? {
            id: nextRaid.id.value,
            date: nextRaid.date,
            status: nextRaid.status,
            description: nextRaid.description ?? null,
          }
        : null,
      reservationForm: openForm
        ? {
            id: openForm.id.value,
            status: openForm.status,
            closesAt: openForm.closesAt,
          }
        : null,
      averageAttendanceRate,
      recentRaids,
      currentWeekReservations,
    }
  }
}
