import type {
  IRaidAttendanceRepository,
  AttendanceRecord,
  RaidAttendanceSummary,
  PlayerAttendanceParams,
  PlayerAttendanceHistory,
} from '../../../domain/attendance/repositories/IRaidAttendanceRepository.js'
import { RaidAttendance } from '../../../domain/attendance/entities/RaidAttendance.js'
import type { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'
import { UniqueEntityId as Id } from '../../../domain/_shared/UniqueEntityId.js'
import { prisma } from './PrismaService.js'

function toEntity(raw: {
  id: string
  raidId: string
  userId: string
  characterId: string
  attended: boolean
  createdAt: Date
  updatedAt: Date
}): RaidAttendance {
  return RaidAttendance.reconstitue({
    id: raw.id,
    raidId: raw.raidId,
    userId: raw.userId,
    characterId: raw.characterId,
    attended: raw.attended,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  })
}

export class PrismaRaidAttendanceRepository implements IRaidAttendanceRepository {
  async findById(id: UniqueEntityId): Promise<RaidAttendance | null> {
    const raw = await prisma.raidAttendance.findUnique({ where: { id: id.value } })
    if (!raw) return null
    return toEntity(raw)
  }

  async findAll(): Promise<RaidAttendance[]> {
    const raws = await prisma.raidAttendance.findMany()
    return raws.map(toEntity)
  }

  async findByRaidId(raidId: string): Promise<RaidAttendance[]> {
    const raws = await prisma.raidAttendance.findMany({ where: { raidId } })
    return raws.map(toEntity)
  }

  async findByRaidAndUser(raidId: string, userId: string): Promise<RaidAttendance | null> {
    const raw = await prisma.raidAttendance.findUnique({
      where: { raidId_userId: { raidId, userId } },
    })
    if (!raw) return null
    return toEntity(raw)
  }

  async saveMany(records: AttendanceRecord[]): Promise<RaidAttendance[]> {
    if (records.length === 0) return []

    const results = await prisma.$transaction(
      records.map((r) =>
        prisma.raidAttendance.upsert({
          where: { raidId_userId: { raidId: r.raidId, userId: r.userId } },
          create: {
            id: new Id().value,
            raidId: r.raidId,
            userId: r.userId,
            characterId: r.characterId,
            attended: r.attended,
          },
          update: {
            characterId: r.characterId,
            attended: r.attended,
          },
        })
      )
    )

    return results.map(toEntity)
  }

  async save(attendance: RaidAttendance): Promise<void> {
    await prisma.raidAttendance.upsert({
      where: { id: attendance.id.value },
      create: {
        id: attendance.id.value,
        raidId: attendance.raidId,
        userId: attendance.userId,
        characterId: attendance.characterId,
        attended: attendance.attended,
        createdAt: attendance.createdAt,
        updatedAt: attendance.updatedAt,
      },
      update: {
        characterId: attendance.characterId,
        attended: attendance.attended,
        updatedAt: attendance.updatedAt,
      },
    })
  }

  async delete(id: UniqueEntityId): Promise<void> {
    await prisma.raidAttendance.delete({ where: { id: id.value } })
  }

  async findRaidAttendanceSummary(raidId: string): Promise<RaidAttendanceSummary> {
    const records = await prisma.raidAttendance.findMany({
      where: { raidId },
      include: {
        user: { select: { name: true } },
        character: { select: { name: true, class: true } },
      },
      orderBy: { user: { name: 'asc' } },
    })

    const toAttendee = (r: (typeof records)[number]) => ({
      attendanceId: r.id,
      userId: r.userId,
      playerName: r.user.name,
      characterId: r.characterId,
      characterName: r.character.name,
      characterClass: r.character.class as string,
    })

    const present = records.filter((r) => r.attended).map(toAttendee)
    const absent = records.filter((r) => !r.attended).map(toAttendee)

    return { raidId, present, absent, total: records.length }
  }

  async findAverageAttendanceRate(lastN: number): Promise<number> {
    const raids = await prisma.raid.findMany({
      where: { status: 'COMPLETED' },
      orderBy: { date: 'desc' },
      take: lastN,
      include: {
        attendances: { select: { attended: true } },
      },
    })

    if (raids.length === 0) return 0

    const rates = raids.map((r) => {
      const total = r.attendances.length
      if (total === 0) return 0
      const present = r.attendances.filter((a) => a.attended).length
      return (present / total) * 100
    })

    return Math.round(rates.reduce((sum, r) => sum + r, 0) / rates.length)
  }

  async findPlayerAttendanceHistory(
    userId: string,
    params: PlayerAttendanceParams
  ): Promise<PlayerAttendanceHistory> {
    const skip = (params.page - 1) * params.limit

    const [total, presentCount, records] = await prisma.$transaction([
      prisma.raidAttendance.count({ where: { userId } }),
      prisma.raidAttendance.count({ where: { userId, attended: true } }),
      prisma.raidAttendance.findMany({
        where: { userId },
        skip,
        take: params.limit,
        orderBy: { raid: { date: 'desc' } },
        include: {
          raid: { select: { date: true, description: true } },
          character: { select: { name: true } },
        },
      }),
    ])

    return {
      records: records.map((r) => ({
        raidDate: r.raid.date,
        raidDescription: r.raid.description,
        characterName: r.character.name,
        attended: r.attended,
      })),
      total,
      attendanceRate: total > 0 ? Math.round((presentCount / total) * 100) : 0,
    }
  }
}
