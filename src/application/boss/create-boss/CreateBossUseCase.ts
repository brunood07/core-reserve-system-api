import type { UseCase } from '../../_shared/UseCase.js'
import type { IBossRepository } from '../../../domain/boss/repositories/IBossRepository.js'
import type { IRaidRepository } from '../../../domain/raid/repositories/IRaidRepository.js'
import { Boss } from '../../../domain/boss/entities/Boss.js'
import { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'

export interface CreateBossInput {
  raidId: string
  name: string
  orderIndex: number
}

export interface CreateBossOutput {
  bossId: string
  raidId: string
  name: string
  orderIndex: number
  createdAt: Date
}

export class RaidNotFoundError extends Error {
  constructor(id: string) {
    super(`Raid not found: ${id}`)
    this.name = 'RaidNotFoundError'
  }
}

export class BossOrderIndexAlreadyTakenError extends Error {
  constructor(orderIndex: number) {
    super(`A boss with order_index ${orderIndex} already exists in this raid`)
    this.name = 'BossOrderIndexAlreadyTakenError'
  }
}

export class CreateBossUseCase implements UseCase<CreateBossInput, CreateBossOutput> {
  constructor(
    private readonly bossRepository: IBossRepository,
    private readonly raidRepository: IRaidRepository
  ) {}

  async execute(input: CreateBossInput): Promise<CreateBossOutput> {
    const raid = await this.raidRepository.findById(new UniqueEntityId(input.raidId))
    if (!raid) {
      throw new RaidNotFoundError(input.raidId)
    }

    const existing = await this.bossRepository.findByRaidIdAndOrderIndex(
      input.raidId,
      input.orderIndex
    )
    if (existing) {
      throw new BossOrderIndexAlreadyTakenError(input.orderIndex)
    }

    const boss = Boss.create(input)
    await this.bossRepository.save(boss)

    return {
      bossId: boss.id.value,
      raidId: boss.raidId,
      name: boss.name,
      orderIndex: boss.orderIndex,
      createdAt: boss.createdAt,
    }
  }
}
