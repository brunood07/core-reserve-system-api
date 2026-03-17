import type { UseCase } from '../../_shared/UseCase.js'
import type { IReservationFormRepository } from '../../../domain/reservation-form/repositories/IReservationFormRepository.js'
import { ReservationForm } from '../../../domain/reservation-form/entities/ReservationForm.js'
import { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'

export class FormAlreadyOpenError extends Error {
  constructor() {
    super('Já existe um formulário de reservas aberto')
    this.name = 'FormAlreadyOpenError'
  }
}

export interface CreateReservationFormInput {
  weekOf: Date
  opensAt: Date
  closesAt: Date
}

export interface CreateReservationFormOutput {
  id: string
  weekOf: Date
  opensAt: Date
  closesAt: Date
  status: string
}

export class CreateReservationFormUseCase
  implements UseCase<CreateReservationFormInput, CreateReservationFormOutput>
{
  constructor(
    private readonly reservationFormRepository: IReservationFormRepository
  ) {}

  async execute(input: CreateReservationFormInput): Promise<CreateReservationFormOutput> {
    const existing = await this.reservationFormRepository.findCurrentOpen()
    if (existing) {
      throw new FormAlreadyOpenError()
    }

    const form = ReservationForm.create({
      weekOf: input.weekOf,
      opensAt: input.opensAt,
      closesAt: input.closesAt,
    })

    await this.reservationFormRepository.save(form)

    return {
      id: form.id.value,
      weekOf: form.weekOf,
      opensAt: form.opensAt,
      closesAt: form.closesAt,
      status: form.status,
    }
  }
}
