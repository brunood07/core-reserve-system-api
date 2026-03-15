import type {
  IRaidAttendanceRepository,
  AttendanceRecord,
  RaidAttendanceSummary,
  PlayerAttendanceParams,
  PlayerAttendanceHistory,
} from '../../src/domain/attendance/repositories/IRaidAttendanceRepository.js'
import { RaidAttendance } from '../../src/domain/attendance/entities/RaidAttendance.js'
import type { UniqueEntityId } from '../../src/domain/_shared/UniqueEntityId.js'

export class InMemoryRaidAttendanceRepository implements IRaidAttendanceRepository {
  public items: RaidAttendance[] = []

  async findById(id: UniqueEntityId): Promise<RaidAttendance | null> {
    return this.items.find((a) => a.id.equals(id)) ?? null
  }

  async findAll(): Promise<RaidAttendance[]> {
    return [...this.items]
  }

  async findByRaidId(raidId: string): Promise<RaidAttendance[]> {
    return this.items.filter((a) => a.raidId === raidId)
  }

  async findByRaidAndUser(raidId: string, userId: string): Promise<RaidAttendance | null> {
    return this.items.find((a) => a.raidId === raidId && a.userId === userId) ?? null
  }

  async saveMany(records: AttendanceRecord[]): Promise<RaidAttendance[]> {
    for (const record of records) {
      const existingIndex = this.items.findIndex(
        (a) => a.raidId === record.raidId && a.userId === record.userId
      )
      if (existingIndex >= 0) {
        const existing = this.items[existingIndex]!
        this.items[existingIndex] = RaidAttendance.reconstitue({
          id: existing.id.value,
          raidId: record.raidId,
          userId: record.userId,
          characterId: record.characterId,
          attended: record.attended,
          createdAt: existing.createdAt,
          updatedAt: new Date(),
        })
      } else {
        this.items.push(RaidAttendance.create(record))
      }
    }
    return this.items.filter((a) => a.raidId === records[0]?.raidId)
  }

  async save(attendance: RaidAttendance): Promise<void> {
    const index = this.items.findIndex((a) => a.id.equals(attendance.id))
    if (index >= 0) {
      this.items[index] = attendance
    } else {
      this.items.push(attendance)
    }
  }

  async delete(id: UniqueEntityId): Promise<void> {
    this.items = this.items.filter((a) => !a.id.equals(id))
  }

  async findRaidAttendanceSummary(raidId: string): Promise<RaidAttendanceSummary> {
    const records = this.items.filter((a) => a.raidId === raidId)

    const toAttendee = (a: RaidAttendance) => ({
      attendanceId: a.id.value,
      userId: a.userId,
      playerName: '',        // no join in memory
      characterId: a.characterId,
      characterName: '',     // no join in memory
      characterClass: '',    // no join in memory
    })

    const present = records.filter((a) => a.attended).map(toAttendee)
    const absent = records.filter((a) => !a.attended).map(toAttendee)

    return { raidId, present, absent, total: records.length }
  }

  async findPlayerAttendanceHistory(
    userId: string,
    params: PlayerAttendanceParams
  ): Promise<PlayerAttendanceHistory> {
    const all = this.items.filter((a) => a.userId === userId)
    const total = all.length
    const presentCount = all.filter((a) => a.attended).length
    const attendanceRate = total > 0 ? Math.round((presentCount / total) * 100) : 0

    const start = (params.page - 1) * params.limit
    const paginated = all.slice(start, start + params.limit)

    return {
      records: paginated.map((a) => ({
        raidDate: new Date(0),   // no join in memory
        raidDescription: null,   // no join in memory
        characterName: '',       // no join in memory
        attended: a.attended,
      })),
      total,
      attendanceRate,
    }
  }
}
