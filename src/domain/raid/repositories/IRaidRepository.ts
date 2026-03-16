import type { Repository } from '../../_shared/Repository.js'
import type { Raid } from '../entities/Raid.js'

export interface RecentRaidSummary {
  id: string
  date: Date
  status: string
  description: string | null
  presentCount: number
}

export interface RaidItemDetail {
  id: string
  name: string
  itemType: string
  ilvl: number
}

export interface RaidBossDetail {
  id: string
  name: string
  orderIndex: number
  items: RaidItemDetail[]
}

export interface RaidWithDetails {
  id: string
  date: Date
  description: string | null
  status: string
  bosses: RaidBossDetail[]
}

export interface IRaidRepository extends Repository<Raid> {
  findByDate(date: Date): Promise<Raid | null>
  findUpcoming(): Promise<Raid | null>
  findRecentWithPresentCount(limit: number): Promise<RecentRaidSummary[]>
  findAllWithDetails(): Promise<RaidWithDetails[]>
}
