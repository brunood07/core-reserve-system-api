import type { Repository } from '../../_shared/Repository.js'
import type { User } from '../entities/User.js'
import type { UserRoleValue } from '../value-objects/UserRole.js'

export interface FindPlayersParams {
  page: number
  limit: number
  search?: string
}

export interface PlayerListItem {
  id: string
  name: string
  email: string
  role: UserRoleValue
  activeCharacter: {
    id: string
    name: string
    class: string
    spec: string
    realm: string
  } | null
}

export interface FindPlayersResult {
  players: PlayerListItem[]
  total: number
}

export interface CharacterSummary {
  id: string
  name: string
  class: string
  spec: string
  realm: string
  isActive: boolean
}

export interface AttendanceSummary {
  raidId: string
  raidName: string
  scheduledAt: Date | null
}

export interface PlayerDetails {
  id: string
  name: string
  email: string
  role: UserRoleValue
  createdAt: Date
  characters: CharacterSummary[]
  recentAttendances: AttendanceSummary[]
}

export interface IUserRepository extends Repository<User> {
  findByEmail(email: string): Promise<User | null>
  findPlayers(params: FindPlayersParams): Promise<FindPlayersResult>
  findPlayerDetails(id: string): Promise<PlayerDetails | null>
}
