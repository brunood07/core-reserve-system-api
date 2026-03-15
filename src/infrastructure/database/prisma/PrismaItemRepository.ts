import type { IItemRepository } from '../../../domain/item/repositories/IItemRepository.js'
import { Item } from '../../../domain/item/entities/Item.js'
import type { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'
import { prisma } from './PrismaService.js'

function toEntity(raw: {
  id: string
  bossId: string
  name: string
  itemType: string
  ilvl: number
  createdAt: Date
  updatedAt: Date
}): Item {
  return Item.reconstitue({
    id: raw.id,
    bossId: raw.bossId,
    name: raw.name,
    itemType: raw.itemType,
    ilvl: raw.ilvl,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  })
}

export class PrismaItemRepository implements IItemRepository {
  async findById(id: UniqueEntityId): Promise<Item | null> {
    const raw = await prisma.item.findUnique({ where: { id: id.value } })
    if (!raw) return null
    return toEntity(raw)
  }

  async findAll(): Promise<Item[]> {
    const raws = await prisma.item.findMany({ orderBy: { createdAt: 'asc' } })
    return raws.map(toEntity)
  }

  async findByBossId(bossId: string): Promise<Item[]> {
    const raws = await prisma.item.findMany({
      where: { bossId },
      orderBy: { createdAt: 'asc' },
    })
    return raws.map(toEntity)
  }

  async save(item: Item): Promise<void> {
    await prisma.item.upsert({
      where: { id: item.id.value },
      create: {
        id: item.id.value,
        bossId: item.bossId,
        name: item.name,
        itemType: item.itemType,
        ilvl: item.ilvl,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      },
      update: {
        name: item.name,
        itemType: item.itemType,
        ilvl: item.ilvl,
        updatedAt: item.updatedAt,
      },
    })
  }

  async delete(id: UniqueEntityId): Promise<void> {
    await prisma.item.delete({ where: { id: id.value } })
  }
}
