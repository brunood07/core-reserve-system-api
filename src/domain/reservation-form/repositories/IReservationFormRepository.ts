import type { Repository } from '../../_shared/Repository.js'
import type { ReservationForm } from '../entities/ReservationForm.js'

export interface IReservationFormRepository extends Repository<ReservationForm> {
  findByWeekOf(weekOf: Date): Promise<ReservationForm | null>
  findCurrentOpen(): Promise<ReservationForm | null>
}
