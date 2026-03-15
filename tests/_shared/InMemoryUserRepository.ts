import type { IUserRepository } from '../../src/domain/user/repositories/IUserRepository.js'
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
}
