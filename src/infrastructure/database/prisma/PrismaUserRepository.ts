import type { IUserRepository } from '../../../domain/user/repositories/IUserRepository.js'
import { User } from '../../../domain/user/entities/User.js'
import type { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'
import { prisma } from './PrismaService.js'

export class PrismaUserRepository implements IUserRepository {
  async findById(id: UniqueEntityId): Promise<User | null> {
    const raw = await prisma.user.findUnique({ where: { id: id.value } })
    if (!raw) return null
    return User.reconstitue({
      id: raw.id,
      name: raw.name,
      email: raw.email,
      passwordHash: raw.passwordHash,
      role: raw.role,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    })
  }

  async findAll(): Promise<User[]> {
    const raws = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
    return raws.map((raw) =>
      User.reconstitue({
        id: raw.id,
        name: raw.name,
        email: raw.email,
        passwordHash: raw.passwordHash,
        role: raw.role,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      })
    )
  }

  async findByEmail(email: string): Promise<User | null> {
    const raw = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!raw) return null
    return User.reconstitue({
      id: raw.id,
      name: raw.name,
      email: raw.email,
      passwordHash: raw.passwordHash,
      role: raw.role,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    })
  }

  async save(user: User): Promise<void> {
    await prisma.user.upsert({
      where: { id: user.id.value },
      create: {
        id: user.id.value,
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      update: {
        name: user.name,
        passwordHash: user.passwordHash,
        role: user.role,
        updatedAt: user.updatedAt,
      },
    })
  }

  async delete(id: UniqueEntityId): Promise<void> {
    await prisma.user.delete({ where: { id: id.value } })
  }
}
