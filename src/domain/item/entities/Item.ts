import { AggregateRoot } from '../../_shared/AggregateRoot.js'
import { UniqueEntityId } from '../../_shared/UniqueEntityId.js'

export type ItemTypeValue =
  | 'HELM' | 'SHOULDER' | 'BACK' | 'CHEST' | 'WRIST' | 'HANDS'
  | 'WAIST' | 'LEGS' | 'FEET' | 'NECK' | 'FINGER' | 'TRINKET'
  | 'WEAPON' | 'SHIELD' | 'OFF_HAND'

const VALID_ITEM_TYPES: ItemTypeValue[] = [
  'HELM', 'SHOULDER', 'BACK', 'CHEST', 'WRIST', 'HANDS',
  'WAIST', 'LEGS', 'FEET', 'NECK', 'FINGER', 'TRINKET',
  'WEAPON', 'SHIELD', 'OFF_HAND',
]

export interface ItemProps {
  bossId: string
  name: string
  itemType: ItemTypeValue
  ilvl: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateItemProps {
  bossId: string
  name: string
  itemType: ItemTypeValue
  ilvl: number
}

export interface ReconstitueItemProps {
  id: string
  bossId: string
  name: string
  itemType: string
  ilvl: number
  createdAt: Date
  updatedAt: Date
}

export class Item extends AggregateRoot<ItemProps> {
  private constructor(props: ItemProps, id?: UniqueEntityId) {
    super(props, id)
  }

  static create(props: CreateItemProps): Item {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Item name cannot be empty')
    }
    if (!VALID_ITEM_TYPES.includes(props.itemType)) {
      throw new Error(`Invalid ItemType: ${props.itemType}`)
    }
    if (!Number.isInteger(props.ilvl) || props.ilvl < 1 || props.ilvl > 700) {
      throw new Error('Item ilvl must be an integer between 1 and 700')
    }
    return new Item({
      bossId: props.bossId,
      name: props.name.trim(),
      itemType: props.itemType,
      ilvl: props.ilvl,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  static reconstitue(props: ReconstitueItemProps): Item {
    return new Item(
      {
        bossId: props.bossId,
        name: props.name,
        itemType: props.itemType as ItemTypeValue,
        ilvl: props.ilvl,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
      },
      new UniqueEntityId(props.id)
    )
  }

  get bossId(): string { return this.props.bossId }
  get name(): string { return this.props.name }
  get itemType(): ItemTypeValue { return this.props.itemType }
  get ilvl(): number { return this.props.ilvl }
  get createdAt(): Date { return this.props.createdAt }
  get updatedAt(): Date { return this.props.updatedAt }
}
