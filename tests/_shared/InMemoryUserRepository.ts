import type {
  IUserRepository,
  FindPlayersParams,
  FindPlayersResult,
  PlayerDetails,
} from '../../src/domain/user/repositories/IUserRepository.js'
import type { User } from '../../src/domain/user/entities/User.js'
import type { UniqueEntityId } from '../../src/domain/_shared/UniqueEntityId.js'

export class InMemoryUserRepository implements IUserRepository {
  public items: User[] = []

  async findById(id: UniqueEntityId): Promise<User | null> {
    return this.items.find((u) => u.id.equals(id)) ?? null
  }

  async findAll(): Promise<User[]> {
    return [...this.items]
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.items.find((u) => u.email === email.toLowerCase()) ?? null
  }

  async save(user: User): Promise<void> {
    const index = this.items.findIndex((u) => u.id.equals(user.id))
    if (index >= 0) {
      this.items[index] = user
    } else {
      this.items.push(user)
    }
  }

  async delete(id: UniqueEntityId): Promise<void> {
    this.items = this.items.filter((u) => !u.id.equals(id))
  }

  async findPlayers(params: FindPlayersParams): Promise<FindPlayersResult> {
    let filtered = this.items.filter((u) => u.role === 'PLAYER' && !u.isDeleted)

    if (params.search) {
      const s = params.search.toLowerCase()
      filtered = filtered.filter(
        (u) => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)
      )
    }

    const total = filtered.length
    const start = (params.page - 1) * params.limit
    const players = filtered.slice(start, start + params.limit).map((u) => ({
      id: u.id.value,
      name: u.name,
      email: u.email,
      role: u.role,
      activeCharacter: null,
    }))

    return { players, total }
  }

  async findPlayerDetails(id: string): Promise<PlayerDetails | null> {
    const user = this.items.find((u) => u.id.value === id && !u.isDeleted)
    if (!user) return null

    return {
      id: user.id.value,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      characters: [],
      recentAttendances: [],
    }
  }
}
