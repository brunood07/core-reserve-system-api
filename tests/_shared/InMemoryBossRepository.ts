import type { IBossRepository } from '../../src/domain/boss/repositories/IBossRepository.js'
import type { Boss } from '../../src/domain/boss/entities/Boss.js'
import type { UniqueEntityId } from '../../src/domain/_shared/UniqueEntityId.js'

export class InMemoryBossRepository implements IBossRepository {
  public items: Boss[] = []

  async findById(id: UniqueEntityId): Promise<Boss | null> {
    return this.items.find((b) => b.id.equals(id)) ?? null
  }

  async findAll(): Promise<Boss[]> {
    return [...this.items]
  }

  async findByRaidId(raidId: string): Promise<Boss[]> {
    return this.items.filter((b) => b.raidId === raidId)
  }

  async findByRaidIdAndOrderIndex(raidId: string, orderIndex: number): Promise<Boss | null> {
    return (
      this.items.find((b) => b.raidId === raidId && b.orderIndex === orderIndex) ?? null
    )
  }

  async save(boss: Boss): Promise<void> {
    const index = this.items.findIndex((b) => b.id.equals(boss.id))
    if (index >= 0) {
      this.items[index] = boss
    } else {
      this.items.push(boss)
    }
  }

  async delete(id: UniqueEntityId): Promise<void> {
    this.items = this.items.filter((b) => !b.id.equals(id))
  }
}
