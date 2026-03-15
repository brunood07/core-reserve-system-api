import { ValueObject } from '../../_shared/ValueObject.js'

export type CharacterClassValue =
  | 'WARRIOR'
  | 'PALADIN'
  | 'HUNTER'
  | 'ROGUE'
  | 'PRIEST'
  | 'DEATH_KNIGHT'
  | 'SHAMAN'
  | 'MAGE'
  | 'WARLOCK'
  | 'MONK'
  | 'DRUID'
  | 'DEMON_HUNTER'
  | 'EVOKER'

const VALID_CLASSES: CharacterClassValue[] = [
  'WARRIOR', 'PALADIN', 'HUNTER', 'ROGUE', 'PRIEST',
  'DEATH_KNIGHT', 'SHAMAN', 'MAGE', 'WARLOCK', 'MONK',
  'DRUID', 'DEMON_HUNTER', 'EVOKER',
]

interface CharacterClassProps {
  value: CharacterClassValue
}

export class CharacterClass extends ValueObject<CharacterClassProps> {
  private constructor(props: CharacterClassProps) {
    super(props)
  }

  static create(value: string): CharacterClass {
    if (!VALID_CLASSES.includes(value as CharacterClassValue)) {
      throw new Error(
        `Invalid CharacterClass: "${value}". Must be one of: ${VALID_CLASSES.join(', ')}`
      )
    }
    return new CharacterClass({ value: value as CharacterClassValue })
  }

  get value(): CharacterClassValue {
    return this.props.value
  }
}
