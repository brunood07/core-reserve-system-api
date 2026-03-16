import type { Repository } from '../../_shared/Repository.js'
import type { RaidAttendance } from '../entities/RaidAttendance.js'

export interface AttendanceRecord {
  raidId: string
  userId: string
  characterId: string
  attended: boolean
}

// ── GET /raids/:raidId/attendance ─────────────────────────────────────────────

export interface AttendeeRecord {
  attendanceId: string
  userId: string
  playerName: string
  characterId: string
  characterName: string
  characterClass: string
}

export interface RaidAttendanceSummary {
  raidId: string
  present: AttendeeRecord[]
  absent: AttendeeRecord[]
  total: number
}

// ── GET /players/:id/attendance ───────────────────────────────────────────────

export interface PlayerAttendanceParams {
  page: number
  limit: number
}

export interface PlayerAttendanceRecord {
  raidDate: Date
  raidDescription: string | null
  characterName: string
  attended: boolean
}

export interface PlayerAttendanceHistory {
  records: PlayerAttendanceRecord[]
  total: number
  attendanceRate: number
}

// ── Interface ─────────────────────────────────────────────────────────────────

export interface IRaidAttendanceRepository extends Repository<RaidAttendance> {
  saveMany(records: AttendanceRecord[]): Promise<RaidAttendance[]>
  findByRaidId(raidId: string): Promise<RaidAttendance[]>
  findByRaidAndUser(raidId: string, userId: string): Promise<RaidAttendance | null>
  findRaidAttendanceSummary(raidId: string): Promise<RaidAttendanceSummary>
  findPlayerAttendanceHistory(
    userId: string,
    params: PlayerAttendanceParams
  ): Promise<PlayerAttendanceHistory>
  findAverageAttendanceRate(lastN: number): Promise<number>
}
