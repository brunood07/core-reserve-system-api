import type { ICharacterRepository } from '../../../domain/character/repositories/ICharacterRepository.js'
import { Character } from '../../../domain/character/entities/Character.js'
import type { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'
import { prisma } from './PrismaService.js'

function toEntity(raw: {
  id: string
  userId: string
  name: string
  class: Parameters<typeof Character.reconstitue>[0]['class']
  spec: string
  realm: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}): Character {
  return Character.reconstitue({
    id: raw.id,
    userId: raw.userId,
    name: raw.name,
    class: raw.class,
    spec: raw.spec,
    realm: raw.realm,
    isActive: raw.isActive,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  })
}

export class PrismaCharacterRepository implements ICharacterRepository {
  async findById(id: UniqueEntityId): Promise<Character | null> {
    const raw = await prisma.character.findUnique({ where: { id: id.value } })
    return raw ? toEntity(raw) : null
  }

  async findAll(): Promise<Character[]> {
    const raws = await prisma.character.findMany({ orderBy: { name: 'asc' } })
    return raws.map(toEntity)
  }

  async findByNameAndRealm(name: string, realm: string): Promise<Character | null> {
    const raw = await prisma.character.findUnique({
      where: { name_realm: { name, realm } },
    })
    return raw ? toEntity(raw) : null
  }

  async findByUserId(userId: UniqueEntityId): Promise<Character[]> {
    const raws = await prisma.character.findMany({
      where: { userId: userId.value },
      orderBy: { createdAt: 'asc' },
    })
    return raws.map(toEntity)
  }

  async save(character: Character): Promise<void> {
    await prisma.character.upsert({
      where: { id: character.id.value },
      create: {
        id: character.id.value,
        userId: character.userId,
        name: character.name,
        class: character.class,
        spec: character.spec,
        realm: character.realm,
        isActive: character.isActive,
        createdAt: character.createdAt,
        updatedAt: character.updatedAt,
      },
      update: {
        name: character.name,
        class: character.class,
        spec: character.spec,
        realm: character.realm,
        isActive: character.isActive,
        updatedAt: character.updatedAt,
      },
    })
  }

  async delete(id: UniqueEntityId): Promise<void> {
    await prisma.character.delete({ where: { id: id.value } })
  }
}
