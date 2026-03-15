import { AggregateRoot } from '../../_shared/AggregateRoot.js'
import { UniqueEntityId } from '../../_shared/UniqueEntityId.js'
import { RaidName } from '../value-objects/RaidName.js'
import { RaidDifficulty, type RaidDifficultyValue } from '../value-objects/RaidDifficulty.js'
import { RaidCreatedEvent } from '../events/RaidCreatedEvent.js'

export interface RaidProps {
  name: RaidName
  difficulty: RaidDifficulty
  maxSlots: number
  scheduledAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface CreateRaidProps {
  name: string
  difficulty: RaidDifficultyValue
  maxSlots: number
  scheduledAt?: Date
}

export interface ReconstitueRaidProps extends CreateRaidProps {
  id: string
  createdAt: Date
  updatedAt: Date
}

export class Raid extends AggregateRoot<RaidProps> {
  private constructor(props: RaidProps, id?: UniqueEntityId) {
    super(props, id)
  }

  static create(props: CreateRaidProps): Raid {
    const raid = new Raid({
      name: RaidName.create(props.name),
      difficulty: RaidDifficulty.create(props.difficulty),
      maxSlots: props.maxSlots,
      scheduledAt: props.scheduledAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    raid.addDomainEvent(new RaidCreatedEvent(raid.id))
    return raid
  }

  static reconstitue(props: ReconstitueRaidProps): Raid {
    return new Raid(
      {
        name: RaidName.create(props.name),
        difficulty: RaidDifficulty.create(props.difficulty),
        maxSlots: props.maxSlots,
        scheduledAt: props.scheduledAt,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
      },
      new UniqueEntityId(props.id)
    )
  }

  get name(): string { return this.props.name.value }
  get difficulty(): RaidDifficultyValue { return this.props.difficulty.value }
  get maxSlots(): number { return this.props.maxSlots }
  get scheduledAt(): Date | undefined { return this.props.scheduledAt }
  get createdAt(): Date { return this.props.createdAt }
  get updatedAt(): Date { return this.props.updatedAt }
}
