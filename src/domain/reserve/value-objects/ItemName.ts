import { ValueObject } from '../../_shared/ValueObject.js'

interface ItemNameProps {
  value: string
}

export class ItemName extends ValueObject<ItemNameProps> {
  private constructor(props: ItemNameProps) {
    super(props)
  }

  static create(name: string): ItemName {
    if (!name || name.trim().length === 0) {
      throw new Error('ItemName cannot be empty')
    }
    if (name.trim().length > 150) {
      throw new Error('ItemName cannot exceed 150 characters')
    }
    return new ItemName({ value: name.trim() })
  }

  get value(): string {
    return this.props.value
  }
}
