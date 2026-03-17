import type { UseCase } from '../../_shared/UseCase.js'
import type { IReservationFormRepository } from '../../../domain/reservation-form/repositories/IReservationFormRepository.js'
import type { IRaidRepository } from '../../../domain/raid/repositories/IRaidRepository.js'
import type { IRaidAttendanceRepository } from '../../../domain/attendance/repositories/IRaidAttendanceRepository.js'
import type { IBossRepository, BossWithItems } from '../../../domain/boss/repositories/IBossRepository.js'
import type { IReserveRepository } from '../../../domain/reserve/repositories/IReserveRepository.js'

export interface WeekReservePlayer {
  userId: string
  playerName: string
  characterName: string
  reserved: boolean
  item?: {
    reserveId: string
    itemName: string
    ilvl: number
  }
}

export interface WeekReserveBoss {
  bossId: string
  bossName: string
  orderIndex: number
  eligibleCount: number
  reservedCount: number
  players: WeekReservePlayer[]
}

export interface WeekSummaryOutput {
  reservationForm: {
    id: string
    status: string
    closesAt: Date
  } | null
  bosses: WeekReserveBoss[]
}

export class GetWeekSummaryUseCase implements UseCase<void, WeekSummaryOutput> {
  constructor(
    private readonly formRepo: IReservationFormRepository,
    private readonly raidRepo: IRaidRepository,
    private readonly attendanceRepo: IRaidAttendanceRepository,
    private readonly bossRepo: IBossRepository,
    private readonly reserveRepo: IReserveRepository
  ) {}

  async execute(): Promise<WeekSummaryOutput> {
    const form = await this.formRepo.findCurrentOpen()

    if (!form) {
      return { reservationForm: null, bosses: [] }
    }

    // Source raid: the one 7 days before weekOf (eligibility basis)
    const sourceRaidDate = new Date(form.weekOf)
    sourceRaidDate.setUTCDate(sourceRaidDate.getUTCDate() - 7)

    // Target raid: the next upcoming scheduled raid
    const [sourceRaid, targetRaid] = await Promise.all([
      this.raidRepo.findByDayOf(sourceRaidDate),
      this.raidRepo.findUpcoming(),
    ])

    // Eligible players:
    // - If source raid exists: only those who attended it
    // - If no source raid (first cycle): all registered players with active characters
    let eligiblePlayers: Awaited<ReturnType<typeof this.attendanceRepo.findRaidAttendanceSummary>>['present']
    if (sourceRaid) {
      const summary = await this.attendanceRepo.findRaidAttendanceSummary(sourceRaid.id.value)
      eligiblePlayers = summary.present
    } else if (targetRaid) {
      const summary = await this.attendanceRepo.findRaidAttendanceSummary(targetRaid.id.value)
      eligiblePlayers = [...summary.present, ...summary.absent]
    } else {
      eligiblePlayers = []
    }

    // Bosses and reserves for the target raid
    const [bossesWithItems, reservesWithChars]: [BossWithItems[], Awaited<ReturnType<IReserveRepository['findWithCharactersByRaidId']>>] =
      targetRaid
        ? await Promise.all([
            this.bossRepo.findByRaidIdWithItems(targetRaid.id.value),
            this.reserveRepo.findWithCharactersByRaidId(targetRaid.id.value),
          ])
        : [[], []]

    // Build lookup: itemName → bossId, itemName → item metadata
    const itemNameToBossId = new Map<string, string>()
    const itemByName = new Map<string, BossWithItems['items'][number]>()
    for (const boss of bossesWithItems) {
      for (const item of boss.items) {
        itemNameToBossId.set(item.name, boss.id)
        itemByName.set(item.name, item)
      }
    }

    // Build lookup: bossId → Map<userId, reserve>
    const reservesByBoss = new Map<string, Map<string, (typeof reservesWithChars)[number]>>()
    for (const boss of bossesWithItems) {
      reservesByBoss.set(boss.id, new Map())
    }
    for (const reserve of reservesWithChars) {
      const bossId = itemNameToBossId.get(reserve.itemName)
      if (bossId) {
        reservesByBoss.get(bossId)?.set(reserve.userId, reserve)
      }
    }

    const bosses: WeekReserveBoss[] = bossesWithItems.map((boss) => {
      const bossReserves = reservesByBoss.get(boss.id) ?? new Map()

      const players: WeekReservePlayer[] = eligiblePlayers.map((player) => {
        const reserve = bossReserves.get(player.userId)
        if (reserve) {
          const item = itemByName.get(reserve.itemName)
          return {
            userId: player.userId,
            playerName: player.playerName,
            characterName: player.characterName,
            reserved: true,
            item: {
              reserveId: reserve.reserveId,
              itemName: reserve.itemName,
              ilvl: item?.ilvl ?? 0,
            },
          }
        }
        return {
          userId: player.userId,
          playerName: player.playerName,
          characterName: player.characterName,
          reserved: false,
        }
      })

      return {
        bossId: boss.id,
        bossName: boss.name,
        orderIndex: boss.orderIndex,
        eligibleCount: eligiblePlayers.length,
        reservedCount: bossReserves.size,
        players,
      }
    })

    return {
      reservationForm: {
        id: form.id.value,
        status: form.status,
        closesAt: form.closesAt,
      },
      bosses,
    }
  }
}
