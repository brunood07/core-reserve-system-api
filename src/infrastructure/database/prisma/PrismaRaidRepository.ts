import type { IRaidRepository } from '../../../domain/raid/repositories/IRaidRepository.js'
import { Raid } from '../../../domain/raid/entities/Raid.js'
import type { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'
import { prisma } from './PrismaService.js'

export class PrismaRaidRepository implements IRaidRepository {
  async findById(id: UniqueEntityId): Promise<Raid | null> {
    const raw = await prisma.raid.findUnique({ where: { id: id.value } })
    if (!raw) return null
    return Raid.reconstitue({
      id: raw.id,
      name: raw.name,
      difficulty: raw.difficulty,
      maxSlots: raw.maxSlots,
      scheduledAt: raw.scheduledAt ?? undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    })
  }

  async findAll(): Promise<Raid[]> {
    const raws = await prisma.raid.findMany({ orderBy: { createdAt: 'desc' } })
    return raws.map((raw) =>
      Raid.reconstitue({
        id: raw.id,
        name: raw.name,
        difficulty: raw.difficulty,
        maxSlots: raw.maxSlots,
        scheduledAt: raw.scheduledAt ?? undefined,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      })
    )
  }

  async findByName(name: string): Promise<Raid | null> {
    const raw = await prisma.raid.findFirst({ where: { name } })
    if (!raw) return null
    return Raid.reconstitue({
      id: raw.id,
      name: raw.name,
      difficulty: raw.difficulty,
      maxSlots: raw.maxSlots,
      scheduledAt: raw.scheduledAt ?? undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    })
  }

  async save(raid: Raid): Promise<void> {
    await prisma.raid.upsert({
      where: { id: raid.id.value },
      create: {
        id: raid.id.value,
        name: raid.name,
        difficulty: raid.difficulty,
        maxSlots: raid.maxSlots,
        scheduledAt: raid.scheduledAt,
        createdAt: raid.createdAt,
        updatedAt: raid.updatedAt,
      },
      update: {
        name: raid.name,
        difficulty: raid.difficulty,
        maxSlots: raid.maxSlots,
        scheduledAt: raid.scheduledAt,
        updatedAt: raid.updatedAt,
      },
    })
  }

  async delete(id: UniqueEntityId): Promise<void> {
    await prisma.raid.delete({ where: { id: id.value } })
  }
}
