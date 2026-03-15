import type { IReserveRepository } from '../../../domain/reserve/repositories/IReserveRepository.js'
import { Reserve } from '../../../domain/reserve/entities/Reserve.js'
import type { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'
import { prisma } from './PrismaService.js'

export class PrismaReserveRepository implements IReserveRepository {
  async findById(id: UniqueEntityId): Promise<Reserve | null> {
    const raw = await prisma.reserve.findUnique({ where: { id: id.value } })
    if (!raw) return null
    return Reserve.reconstitue({
      id: raw.id,
      raidId: raw.raidId,
      characterId: raw.characterId,
      itemName: raw.itemName,
      status: raw.status,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    })
  }

  async findAll(): Promise<Reserve[]> {
    const raws = await prisma.reserve.findMany()
    return raws.map((raw) =>
      Reserve.reconstitue({
        id: raw.id,
        raidId: raw.raidId,
        characterId: raw.characterId,
        itemName: raw.itemName,
        status: raw.status,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      })
    )
  }

  async findByRaidId(raidId: UniqueEntityId): Promise<Reserve[]> {
    const raws = await prisma.reserve.findMany({
      where: { raidId: raidId.value },
    })
    return raws.map((raw) =>
      Reserve.reconstitue({
        id: raw.id,
        raidId: raw.raidId,
        characterId: raw.characterId,
        itemName: raw.itemName,
        status: raw.status,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      })
    )
  }

  async findByCharacterAndRaid(
    characterId: UniqueEntityId,
    raidId: UniqueEntityId
  ): Promise<Reserve[]> {
    const raws = await prisma.reserve.findMany({
      where: { characterId: characterId.value, raidId: raidId.value },
    })
    return raws.map((raw) =>
      Reserve.reconstitue({
        id: raw.id,
        raidId: raw.raidId,
        characterId: raw.characterId,
        itemName: raw.itemName,
        status: raw.status,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      })
    )
  }

  async findByRaidCharacterAndItem(
    raidId: UniqueEntityId,
    characterId: UniqueEntityId,
    itemName: string
  ): Promise<Reserve | null> {
    const raw = await prisma.reserve.findFirst({
      where: {
        raidId: raidId.value,
        characterId: characterId.value,
        itemName,
      },
    })
    if (!raw) return null
    return Reserve.reconstitue({
      id: raw.id,
      raidId: raw.raidId,
      characterId: raw.characterId,
      itemName: raw.itemName,
      status: raw.status,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    })
  }

  async save(reserve: Reserve): Promise<void> {
    await prisma.reserve.upsert({
      where: { id: reserve.id.value },
      create: {
        id: reserve.id.value,
        raidId: reserve.raidId,
        characterId: reserve.characterId,
        itemName: reserve.itemName,
        status: reserve.status,
        createdAt: reserve.createdAt,
        updatedAt: reserve.updatedAt,
      },
      update: {
        status: reserve.status,
        updatedAt: reserve.updatedAt,
      },
    })
  }

  async delete(id: UniqueEntityId): Promise<void> {
    await prisma.reserve.delete({ where: { id: id.value } })
  }
}
