import type { UseCase } from '../../_shared/UseCase.js'
import type { IReserveRepository } from '../../../domain/reserve/repositories/IReserveRepository.js'
import { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'

export interface CancelReserveInput {
  reserveId: string
}

export interface CancelReserveOutput {
  reserveId: string
  status: string
  updatedAt: Date
}

export class CancelReserveUseCase implements UseCase<CancelReserveInput, CancelReserveOutput> {
  constructor(private readonly reserveRepository: IReserveRepository) {}

  async execute(input: CancelReserveInput): Promise<CancelReserveOutput> {
    const reserve = await this.reserveRepository.findById(
      new UniqueEntityId(input.reserveId)
    )
    if (!reserve) throw new Error(`Reserve not found: ${input.reserveId}`)

    reserve.cancel()
    await this.reserveRepository.save(reserve)

    return {
      reserveId: reserve.id.value,
      status: reserve.status,
      updatedAt: reserve.updatedAt,
    }
  }
}
