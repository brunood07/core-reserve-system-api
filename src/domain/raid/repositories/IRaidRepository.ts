import type { Repository } from '../../_shared/Repository.js'
import type { Raid } from '../entities/Raid.js'

export interface IRaidRepository extends Repository<Raid> {
  findByName(name: string): Promise<Raid | null>
}
