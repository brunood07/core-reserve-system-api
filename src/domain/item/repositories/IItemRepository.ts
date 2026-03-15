import type { Repository } from '../../_shared/Repository.js'
import type { Item } from '../entities/Item.js'

export interface IItemRepository extends Repository<Item> {
  findByBossId(bossId: string): Promise<Item[]>
}
