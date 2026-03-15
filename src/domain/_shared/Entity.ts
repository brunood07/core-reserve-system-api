import { UniqueEntityId } from './UniqueEntityId.js'

export abstract class Entity<Props extends object> {
  protected readonly _id: UniqueEntityId
  protected props: Props

  protected constructor(props: Props, id?: UniqueEntityId) {
    this._id = id ?? new UniqueEntityId()
    this.props = props
  }

  get id(): UniqueEntityId {
    return this._id
  }

  equals(other: Entity<Props>): boolean {
    if (other === this) return true
    if (!(other instanceof Entity)) return false
    return this._id.equals(other._id)
  }
}
