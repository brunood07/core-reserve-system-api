import { ValueObject } from '../../_shared/ValueObject.js'

interface RaidNameProps {
  value: string
}

export class RaidName extends ValueObject<RaidNameProps> {
  private constructor(props: RaidNameProps) {
    super(props)
  }

  static create(name: string): RaidName {
    if (!name || name.trim().length === 0) {
      throw new Error('RaidName cannot be empty')
    }
    if (name.trim().length > 100) {
      throw new Error('RaidName cannot exceed 100 characters')
    }
    return new RaidName({ value: name.trim() })
  }

  get value(): string {
    return this.props.value
  }
}
