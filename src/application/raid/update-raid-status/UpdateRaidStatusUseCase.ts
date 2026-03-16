import type { UseCase } from '../../_shared/UseCase.js'
import type { IRaidRepository } from '../../../domain/raid/repositories/IRaidRepository.js'
import type { RaidStatusValue } from '../../../domain/raid/value-objects/RaidStatus.js'

export interface UpdateRaidStatusInput {
  raidId: string
  status: RaidStatusValue
}

export interface UpdateRaidStatusOutput {
  id: string
  status: RaidStatusValue
}

export class RaidNotFoundError extends Error {
  constructor() { super('Raid not found') }
}

export class UpdateRaidStatusUseCase
  implements UseCase<UpdateRaidStatusInput, UpdateRaidStatusOutput>
{
  constructor(private readonly raidRepository: IRaidRepository) {}

  async execute(input: UpdateRaidStatusInput): Promise<UpdateRaidStatusOutput> {
    const { UniqueEntityId } = await import('../../../domain/_shared/UniqueEntityId.js')
    const raid = await this.raidRepository.findById(new UniqueEntityId(input.raidId))
    if (!raid) throw new RaidNotFoundError()

    raid.changeStatus(input.status)
    await this.raidRepository.save(raid)

    return { id: raid.id.value, status: raid.status }
  }
}
