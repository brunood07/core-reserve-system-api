import type { UseCase } from '../../_shared/UseCase.js'
import type { IReservationFormRepository } from '../../../domain/reservation-form/repositories/IReservationFormRepository.js'
import { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'

export class FormNotFoundError extends Error {
  constructor(id: string) {
    super(`Formulário não encontrado: ${id}`)
    this.name = 'FormNotFoundError'
  }
}

export interface UpdateReservationFormInput {
  formId: string
  closesAt: Date
}

export interface UpdateReservationFormOutput {
  id: string
  weekOf: Date
  opensAt: Date
  closesAt: Date
  status: string
}

export class UpdateReservationFormUseCase
  implements UseCase<UpdateReservationFormInput, UpdateReservationFormOutput>
{
  constructor(
    private readonly reservationFormRepository: IReservationFormRepository
  ) {}

  async execute(input: UpdateReservationFormInput): Promise<UpdateReservationFormOutput> {
    const form = await this.reservationFormRepository.findById(
      new UniqueEntityId(input.formId)
    )
    if (!form) {
      throw new FormNotFoundError(input.formId)
    }

    form.updateClosesAt(input.closesAt)
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
