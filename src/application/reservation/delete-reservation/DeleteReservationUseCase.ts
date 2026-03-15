import type { UseCase } from '../../_shared/UseCase.js'
import type { IReserveRepository } from '../../../domain/reserve/repositories/IReserveRepository.js'
import type { IReservationFormRepository } from '../../../domain/reservation-form/repositories/IReservationFormRepository.js'
import type { IRaidRepository } from '../../../domain/raid/repositories/IRaidRepository.js'
import type { ICharacterRepository } from '../../../domain/character/repositories/ICharacterRepository.js'
import { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'

const ELEVATED_ROLES = ['RAID_LEADER', 'OFFICER', 'ADMIN']

export class ReserveNotFoundError extends Error {
  constructor(id: string) {
    super(`Reserva não encontrada: ${id}`)
    this.name = 'ReserveNotFoundError'
  }
}

export class ReserveNotInOpenFormError extends Error {
  constructor() {
    super('Reserva não pertence ao formulário aberto')
    this.name = 'ReserveNotInOpenFormError'
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super('Você não tem permissão para cancelar esta reserva')
    this.name = 'ForbiddenError'
  }
}

export interface DeleteReservationInput {
  reserveId: string
  requestingUserId: string
  requestingUserRole: string
}

export interface DeleteReservationOutput {
  message: string
}

export class DeleteReservationUseCase
  implements UseCase<DeleteReservationInput, DeleteReservationOutput>
{
  constructor(
    private readonly reserveRepository: IReserveRepository,
    private readonly reservationFormRepository: IReservationFormRepository,
    private readonly raidRepository: IRaidRepository,
    private readonly characterRepository: ICharacterRepository
  ) {}

  async execute(input: DeleteReservationInput): Promise<DeleteReservationOutput> {
    // 1. Load the reserve
    const reserve = await this.reserveRepository.findById(new UniqueEntityId(input.reserveId))
    if (!reserve || reserve.status !== 'ACTIVE') {
      throw new ReserveNotFoundError(input.reserveId)
    }

    // 2. Find the currently open form and its target raid
    const form = await this.reservationFormRepository.findCurrentOpen()
    if (!form) {
      throw new ReserveNotInOpenFormError()
    }

    const targetRaid = await this.raidRepository.findByDate(form.weekOf)
    if (!targetRaid || reserve.raidId !== targetRaid.id.value) {
      throw new ReserveNotInOpenFormError()
    }

    // 3. Authorization: must own the reserve or have an elevated role
    const hasElevatedRole = ELEVATED_ROLES.includes(input.requestingUserRole)
    if (!hasElevatedRole) {
      const characters = await this.characterRepository.findByUserId(
        new UniqueEntityId(input.requestingUserId)
      )
      const ownsReserve = characters.some((c) => c.id.value === reserve.characterId)
      if (!ownsReserve) {
        throw new ForbiddenError()
      }
    }

    // 4. Hard-delete the reserve so the user can re-reserve
    await this.reserveRepository.delete(reserve.id)

    return { message: 'Reserva cancelada com sucesso' }
  }
}
