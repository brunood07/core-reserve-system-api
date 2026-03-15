import { Entity } from './Entity.js'
import { UniqueEntityId } from './UniqueEntityId.js'
import type { DomainEvent } from './DomainEvent.js'

export abstract class AggregateRoot<Props extends object> extends Entity<Props> {
  private _domainEvents: DomainEvent[] = []

  protected constructor(props: Props, id?: UniqueEntityId) {
    super(props, id)
  }

  get domainEvents(): DomainEvent[] {
    return this._domainEvents
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event)
  }

  clearDomainEvents(): void {
    this._domainEvents = []
  }
}
