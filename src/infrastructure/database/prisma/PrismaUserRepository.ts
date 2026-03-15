import type {
  IUserRepository,
  FindPlayersParams,
  FindPlayersResult,
  PlayerDetails,
} from '../../../domain/user/repositories/IUserRepository.js'
import { User } from '../../../domain/user/entities/User.js'
import type { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'
import { prisma } from './PrismaService.js'

function toEntity(raw: {
  id: string
  name: string
  email: string
  passwordHash: string
  role: string
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}): User {
  return User.reconstitue({
    id: raw.id,
    name: raw.name,
    email: raw.email,
    passwordHash: raw.passwordHash,
    role: raw.role as Parameters<typeof User.reconstitue>[0]['role'],
    deletedAt: raw.deletedAt,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  })
}

export class PrismaUserRepository implements IUserRepository {
  async findById(id: UniqueEntityId): Promise<User | null> {
    const raw = await prisma.user.findUnique({ where: { id: id.value } })
    if (!raw) return null
    return toEntity(raw)
  }

  async findAll(): Promise<User[]> {
    const raws = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
    return raws.map(toEntity)
  }

  async findByEmail(email: string): Promise<User | null> {
    const raw = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!raw) return null
    return toEntity(raw)
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
        deletedAt: user.deletedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      update: {
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role,
        deletedAt: user.deletedAt,
        updatedAt: user.updatedAt,
      },
    })
  }

  async delete(id: UniqueEntityId): Promise<void> {
    await prisma.user.delete({ where: { id: id.value } })
  }

  async findPlayers(params: FindPlayersParams): Promise<FindPlayersResult> {
    const { page, limit, search } = params
    const skip = (page - 1) * limit

    const where = {
      role: 'PLAYER' as const,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const [total, rows] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          characters: {
            where: { isActive: true },
            take: 1,
          },
        },
      }),
    ])

    return {
      total,
      players: rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        activeCharacter:
          row.characters[0]
            ? {
                id: row.characters[0].id,
                name: row.characters[0].name,
                class: row.characters[0].class,
                spec: row.characters[0].spec,
                realm: row.characters[0].realm,
              }
            : null,
      })),
    }
  }

  async findPlayerDetails(id: string): Promise<PlayerDetails | null> {
    const raw = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        characters: {
          orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
          include: {
            reserves: {
              include: { raid: true },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    })

    if (!raw) return null

    const raidMap = new Map<string, { raidId: string; raidName: string; scheduledAt: Date | null }>()
    for (const char of raw.characters) {
      for (const reserve of char.reserves) {
        if (!raidMap.has(reserve.raid.id)) {
          raidMap.set(reserve.raid.id, {
            raidId: reserve.raid.id,
            raidName: reserve.raid.name,
            scheduledAt: reserve.raid.scheduledAt,
          })
        }
      }
    }

    const recentAttendances = [...raidMap.values()]
      .sort((a, b) => (b.scheduledAt?.getTime() ?? 0) - (a.scheduledAt?.getTime() ?? 0))
      .slice(0, 10)

    return {
      id: raw.id,
      name: raw.name,
      email: raw.email,
      role: raw.role,
      createdAt: raw.createdAt,
      characters: raw.characters.map((c) => ({
        id: c.id,
        name: c.name,
        class: c.class,
        spec: c.spec,
        realm: c.realm,
        isActive: c.isActive,
      })),
      recentAttendances,
    }
  }
}
