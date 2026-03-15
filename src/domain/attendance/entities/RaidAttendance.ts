import { AggregateRoot } from '../../_shared/AggregateRoot.js'
import { UniqueEntityId } from '../../_shared/UniqueEntityId.js'

export interface RaidAttendanceProps {
  raidId: string
  userId: string
  characterId: string
  attended: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateRaidAttendanceProps {
  raidId: string
  userId: string
  characterId: string
  attended: boolean
}

export interface ReconstitueRaidAttendanceProps {
  id: string
  raidId: string
  userId: string
  characterId: string
  attended: boolean
  createdAt: Date
  updatedAt: Date
}

export class RaidAttendance extends AggregateRoot<RaidAttendanceProps> {
  private constructor(props: RaidAttendanceProps, id?: UniqueEntityId) {
    super(props, id)
  }

  static create(props: CreateRaidAttendanceProps): RaidAttendance {
    return new RaidAttendance({
      ...props,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  static reconstitue(props: ReconstitueRaidAttendanceProps): RaidAttendance {
    return new RaidAttendance(
      {
        raidId: props.raidId,
        userId: props.userId,
        characterId: props.characterId,
        attended: props.attended,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
      },
      new UniqueEntityId(props.id)
    )
  }

  get raidId(): string { return this.props.raidId }
  get userId(): string { return this.props.userId }
  get characterId(): string { return this.props.characterId }
  get attended(): boolean { return this.props.attended }
  get createdAt(): Date { return this.props.createdAt }
  get updatedAt(): Date { return this.props.updatedAt }
}
