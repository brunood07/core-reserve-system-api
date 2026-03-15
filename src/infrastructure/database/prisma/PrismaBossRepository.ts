import type { IBossRepository, BossWithItems } from '../../../domain/boss/repositories/IBossRepository.js'
import { Boss } from '../../../domain/boss/entities/Boss.js'
import type { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'
import { prisma } from './PrismaService.js'

function toEntity(raw: {
  id: string
  raidId: string
  name: string
  orderIndex: number
  createdAt: Date
  updatedAt: Date
}): Boss {
  return Boss.reconstitue({
    id: raw.id,
    raidId: raw.raidId,
    name: raw.name,
    orderIndex: raw.orderIndex,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  })
}

export class PrismaBossRepository implements IBossRepository {
  async findById(id: UniqueEntityId): Promise<Boss | null> {
    const raw = await prisma.boss.findUnique({ where: { id: id.value } })
    if (!raw) return null
    return toEntity(raw)
  }

  async findAll(): Promise<Boss[]> {
    const raws = await prisma.boss.findMany({ orderBy: { orderIndex: 'asc' } })
    return raws.map(toEntity)
  }

  async findByRaidId(raidId: string): Promise<Boss[]> {
    const raws = await prisma.boss.findMany({
      where: { raidId },
      orderBy: { orderIndex: 'asc' },
    })
    return raws.map(toEntity)
  }

  async findByRaidIdAndOrderIndex(raidId: string, orderIndex: number): Promise<Boss | null> {
    const raw = await prisma.boss.findUnique({
      where: { raidId_orderIndex: { raidId, orderIndex } },
    })
    if (!raw) return null
    return toEntity(raw)
  }

  async save(boss: Boss): Promise<void> {
    await prisma.boss.upsert({
      where: { id: boss.id.value },
      create: {
        id: boss.id.value,
        raidId: boss.raidId,
        name: boss.name,
        orderIndex: boss.orderIndex,
        createdAt: boss.createdAt,
        updatedAt: boss.updatedAt,
      },
      update: {
        name: boss.name,
        orderIndex: boss.orderIndex,
        updatedAt: boss.updatedAt,
      },
    })
  }

  async findByRaidIdWithItems(raidId: string): Promise<BossWithItems[]> {
    const raws = await prisma.boss.findMany({
      where: { raidId },
      include: { items: true },
      orderBy: { orderIndex: 'asc' },
    })
    return raws.map((raw) => ({
      id: raw.id,
      name: raw.name,
      orderIndex: raw.orderIndex,
      items: raw.items.map((item) => ({
        id: item.id,
        name: item.name,
        itemType: item.itemType as string,
        ilvl: item.ilvl,
      })),
    }))
  }

  async delete(id: UniqueEntityId): Promise<void> {
    await prisma.boss.delete({ where: { id: id.value } })
  }
}
