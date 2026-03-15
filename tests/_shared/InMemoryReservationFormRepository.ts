import type { IReservationFormRepository } from '../../src/domain/reservation-form/repositories/IReservationFormRepository.js'
import type { ReservationForm } from '../../src/domain/reservation-form/entities/ReservationForm.js'
import type { UniqueEntityId } from '../../src/domain/_shared/UniqueEntityId.js'

export class InMemoryReservationFormRepository implements IReservationFormRepository {
  public items: ReservationForm[] = []

  async findById(id: UniqueEntityId): Promise<ReservationForm | null> {
    return this.items.find((f) => f.id.equals(id)) ?? null
  }

  async findAll(): Promise<ReservationForm[]> {
    return [...this.items]
  }

  async findByWeekOf(weekOf: Date): Promise<ReservationForm | null> {
    return (
      this.items.find((f) => f.weekOf.getTime() === weekOf.getTime()) ?? null
    )
  }

  async findCurrentOpen(): Promise<ReservationForm | null> {
    const now = new Date()
    return (
      this.items.find((f) => f.status === 'OPEN' && f.closesAt > now) ?? null
    )
  }

  async save(form: ReservationForm): Promise<void> {
    const index = this.items.findIndex((f) => f.id.equals(form.id))
    if (index >= 0) {
      this.items[index] = form
    } else {
      this.items.push(form)
    }
  }

  async delete(id: UniqueEntityId): Promise<void> {
    this.items = this.items.filter((f) => !f.id.equals(id))
  }
}
