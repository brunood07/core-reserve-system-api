import type { IBossRepository, BossWithItems } from '../../src/domain/boss/repositories/IBossRepository.js'
import type { Boss } from '../../src/domain/boss/entities/Boss.js'
import type { UniqueEntityId } from '../../src/domain/_shared/UniqueEntityId.js'

export class InMemoryBossRepository implements IBossRepository {
  public items: Boss[] = []
  /** Seed boss items for findByRaidIdWithItems: bossId → items */
  public bossItems: Map<string, BossItem[]> = new Map()

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

  async findByRaidIdWithItems(raidId: string): Promise<BossWithItems[]> {
    return this.items
      .filter((b) => b.raidId === raidId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((b) => ({
        id: b.id.value,
        name: b.name,
        orderIndex: b.orderIndex,
        items: this.bossItems.get(b.id.value) ?? [],
      }))
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
