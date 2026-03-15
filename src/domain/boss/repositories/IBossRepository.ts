import type { Repository } from '../../_shared/Repository.js'
import type { Boss } from '../entities/Boss.js'

export interface BossItem {
  id: string
  name: string
  itemType: string
  ilvl: number
}

export interface BossWithItems {
  id: string
  name: string
  orderIndex: number
  items: BossItem[]
}

export interface IBossRepository extends Repository<Boss> {
  findByRaidIdAndOrderIndex(raidId: string, orderIndex: number): Promise<Boss | null>
  findByRaidId(raidId: string): Promise<Boss[]>
  findByRaidIdWithItems(raidId: string): Promise<BossWithItems[]>
}
