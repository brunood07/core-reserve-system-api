import type { Repository } from '../../_shared/Repository.js'
import type { User } from '../entities/User.js'

export interface IUserRepository extends Repository<User> {
  findByEmail(email: string): Promise<User | null>
}
