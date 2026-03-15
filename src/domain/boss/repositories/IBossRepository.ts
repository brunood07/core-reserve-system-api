import type { Repository } from '../../_shared/Repository.js'
import type { Boss } from '../entities/Boss.js'

export interface IBossRepository extends Repository<Boss> {
  findByRaidIdAndOrderIndex(raidId: string, orderIndex: number): Promise<Boss | null>
  findByRaidId(raidId: string): Promise<Boss[]>
}
