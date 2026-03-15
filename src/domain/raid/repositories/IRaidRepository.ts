import type { Repository } from '../../_shared/Repository.js'
import type { Raid } from '../entities/Raid.js'

export interface IRaidRepository extends Repository<Raid> {
  findByDate(date: Date): Promise<Raid | null>
}
