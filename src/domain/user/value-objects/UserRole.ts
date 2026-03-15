import { ValueObject } from '../../_shared/ValueObject.js'

export type UserRoleValue = 'PLAYER' | 'RAID_LEADER' | 'OFFICER' | 'ADMIN'

const VALID_ROLES: UserRoleValue[] = ['PLAYER', 'RAID_LEADER', 'OFFICER', 'ADMIN']

interface UserRoleProps {
  value: UserRoleValue
}

export class UserRole extends ValueObject<UserRoleProps> {
  private constructor(props: UserRoleProps) {
    super(props)
  }

  static create(value: string): UserRole {
    if (!VALID_ROLES.includes(value as UserRoleValue)) {
      throw new Error(`Invalid UserRole: "${value}". Must be one of: ${VALID_ROLES.join(', ')}`)
    }
    return new UserRole({ value: value as UserRoleValue })
  }

  get value(): UserRoleValue {
    return this.props.value
  }
}
