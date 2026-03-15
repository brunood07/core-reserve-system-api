import { ValueObject } from '../../_shared/ValueObject.js'

export type CharacterRoleValue = 'TANK' | 'HEALER' | 'DPS'

const VALID_ROLES: CharacterRoleValue[] = ['TANK', 'HEALER', 'DPS']

interface CharacterRoleProps {
  value: CharacterRoleValue
}

export class CharacterRole extends ValueObject<CharacterRoleProps> {
  private constructor(props: CharacterRoleProps) {
    super(props)
  }

  static create(value: string): CharacterRole {
    if (!VALID_ROLES.includes(value as CharacterRoleValue)) {
      throw new Error(
        `Invalid CharacterRole: "${value}". Must be one of: ${VALID_ROLES.join(', ')}`
      )
    }
    return new CharacterRole({ value: value as CharacterRoleValue })
  }

  get value(): CharacterRoleValue {
    return this.props.value
  }
}
