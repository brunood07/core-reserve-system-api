import type { IRaidRepository, RecentRaidSummary, RaidWithDetails } from '../../../domain/raid/repositories/IRaidRepository.js'
import { Raid } from '../../../domain/raid/entities/Raid.js'
import type { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'
import { prisma } from './PrismaService.js'

function toEntity(raw: {
  id: string
  date: Date
  description: string | null
  status: string
  createdById: string
  createdAt: Date
  updatedAt: Date
}): Raid {
  return Raid.reconstitue({
    id: raw.id,
    date: raw.date,
    description: raw.description,
    status: raw.status as Parameters<typeof Raid.reconstitue>[0]['status'],
    createdById: raw.createdById,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  })
}

export class PrismaRaidRepository implements IRaidRepository {
  async findById(id: UniqueEntityId): Promise<Raid | null> {
    const raw = await prisma.raid.findUnique({ where: { id: id.value } })
    if (!raw) return null
    return toEntity(raw)
  }

  async findAll(): Promise<Raid[]> {
    const raws = await prisma.raid.findMany({ orderBy: { date: 'asc' } })
    return raws.map(toEntity)
  }

  async findByDate(date: Date): Promise<Raid | null> {
    const raw = await prisma.raid.findUnique({ where: { date } })
    if (!raw) return null
    return toEntity(raw)
  }

  async save(raid: Raid): Promise<void> {
    await prisma.raid.upsert({
      where: { id: raid.id.value },
      create: {
        id: raid.id.value,
        date: raid.date,
        description: raid.description,
        status: raid.status,
        createdById: raid.createdById,
        createdAt: raid.createdAt,
        updatedAt: raid.updatedAt,
      },
      update: {
        date: raid.date,
        description: raid.description,
        status: raid.status,
        updatedAt: raid.updatedAt,
      },
    })
  }

  async delete(id: UniqueEntityId): Promise<void> {
    await prisma.raid.delete({ where: { id: id.value } })
  }

  async findUpcoming(): Promise<Raid | null> {
    const raw = await prisma.raid.findFirst({
      where: { status: { in: ['DRAFT', 'OPEN'] }, date: { gte: new Date() } },
      orderBy: { date: 'asc' },
    })
    if (!raw) return null
    return toEntity(raw)
  }

  async findAllWithDetails(): Promise<RaidWithDetails[]> {
    const raids = await prisma.raid.findMany({
      orderBy: { date: 'desc' },
      include: {
        bosses: {
          orderBy: { orderIndex: 'asc' },
          include: {
            items: {
              select: { id: true, name: true, itemType: true, ilvl: true },
            },
          },
        },
      },
    })
    return raids.map((r) => ({
      id: r.id,
      date: r.date,
      description: r.description,
      status: r.status,
      bosses: r.bosses.map((b) => ({
        id: b.id,
        name: b.name,
        orderIndex: b.orderIndex,
        items: b.items.map((i) => ({
          id: i.id,
          name: i.name,
          itemType: i.itemType,
          ilvl: i.ilvl,
        })),
      })),
    }))
  }

  async findRecentWithPresentCount(limit: number): Promise<RecentRaidSummary[]> {
    const raids = await prisma.raid.findMany({
      orderBy: { date: 'desc' },
      take: limit,
      include: {
        attendances: { where: { attended: true }, select: { id: true } },
      },
    })
    return raids.map((r) => ({
      id: r.id,
      date: r.date,
      status: r.status,
      description: r.description,
      presentCount: r.attendances.length,
    }))
  }
}
