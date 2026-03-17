import type { IRaidRepository, RecentRaidSummary } from '../../src/domain/raid/repositories/IRaidRepository.js'
import type { Raid } from '../../src/domain/raid/entities/Raid.js'
import type { UniqueEntityId } from '../../src/domain/_shared/UniqueEntityId.js'

export class InMemoryRaidRepository implements IRaidRepository {
  public items: Raid[] = []

  async findById(id: UniqueEntityId): Promise<Raid | null> {
    return this.items.find((r) => r.id.equals(id)) ?? null
  }

  async findAll(): Promise<Raid[]> {
    return [...this.items]
  }

  async findByDate(date: Date): Promise<Raid | null> {
    return (
      this.items.find((r) => r.date.getTime() === date.getTime()) ?? null
    )
  }

  async findByDayOf(date: Date): Promise<Raid | null> {
    const start = new Date(date)
    start.setUTCHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setUTCDate(end.getUTCDate() + 1)
    return (
      this.items.find((r) => r.date >= start && r.date < end) ?? null
    )
  }

  async findActive(): Promise<Raid | null> {
    return (
      this.items
        .filter((r) => r.status === 'DRAFT' || r.status === 'OPEN')
        .sort((a, b) => a.date.getTime() - b.date.getTime())[0] ?? null
    )
  }

  async findUpcoming(): Promise<Raid | null> {
    const now = new Date()
    return (
      this.items
        .filter((r) => (r.status === 'DRAFT' || r.status === 'OPEN') && r.date >= now)
        .sort((a, b) => a.date.getTime() - b.date.getTime())[0] ?? null
    )
  }

  async findRecentWithPresentCount(limit: number): Promise<RecentRaidSummary[]> {
    return [...this.items]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit)
      .map((r) => ({
        id: r.id.value,
        date: r.date,
        status: r.status,
        description: r.description ?? null,
        presentCount: 0, // no attendance join in memory
      }))
  }

  async save(raid: Raid): Promise<void> {
    const index = this.items.findIndex((r) => r.id.equals(raid.id))
    if (index >= 0) {
      this.items[index] = raid
    } else {
      this.items.push(raid)
    }
  }

  async delete(id: UniqueEntityId): Promise<void> {
    this.items = this.items.filter((r) => !r.id.equals(id))
  }
}
