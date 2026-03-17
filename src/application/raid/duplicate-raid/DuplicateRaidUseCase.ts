import type { UseCase } from '../../_shared/UseCase.js'
import type { IRaidRepository } from '../../../domain/raid/repositories/IRaidRepository.js'
import type { IBossRepository } from '../../../domain/boss/repositories/IBossRepository.js'
import type { IItemRepository } from '../../../domain/item/repositories/IItemRepository.js'
import { Raid } from '../../../domain/raid/entities/Raid.js'
import { Boss } from '../../../domain/boss/entities/Boss.js'
import { Item } from '../../../domain/item/entities/Item.js'
import type { ItemTypeValue } from '../../../domain/item/entities/Item.js'
import { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'

export interface DuplicateRaidInput {
  sourceRaidId: string
  newDate: Date
  createdById: string
}

export interface DuplicateRaidOutput {
  raidId: string
  date: Date
  description: string | null
  status: string
  bossCount: number
  itemCount: number
}

export class RaidNotFoundError extends Error {
  constructor(id: string) {
    super(`Raid not found: ${id}`)
    this.name = 'RaidNotFoundError'
  }
}

export class RaidNotOnWednesdayError extends Error {
  constructor() {
    super('A data da raid deve ser uma quarta-feira')
    this.name = 'RaidNotOnWednesdayError'
  }
}

export class RaidDateAlreadyTakenError extends Error {
  constructor(date: Date) {
    super(`Already exists a raid scheduled for ${date.toISOString().slice(0, 10)}`)
    this.name = 'RaidDateAlreadyTakenError'
  }
}

export class DuplicateRaidUseCase implements UseCase<DuplicateRaidInput, DuplicateRaidOutput> {
  constructor(
    private readonly raidRepository: IRaidRepository,
    private readonly bossRepository: IBossRepository,
    private readonly itemRepository: IItemRepository
  ) {}

  async execute(input: DuplicateRaidInput): Promise<DuplicateRaidOutput> {
    if (input.newDate.getUTCDay() !== 3) {
      throw new RaidNotOnWednesdayError()
    }

    const existing = await this.raidRepository.findByDate(input.newDate)
    if (existing) {
      throw new RaidDateAlreadyTakenError(input.newDate)
    }

    const source = await this.raidRepository.findById(new UniqueEntityId(input.sourceRaidId))
    if (!source) {
      throw new RaidNotFoundError(input.sourceRaidId)
    }

    const newRaid = Raid.create({
      date: input.newDate,
      description: source.description ?? undefined,
      status: 'DRAFT',
      createdById: input.createdById,
    })
    await this.raidRepository.save(newRaid)

    const sourceBosses = await this.bossRepository.findByRaidIdWithItems(input.sourceRaidId)

    let itemCount = 0
    for (const sourceBoss of sourceBosses) {
      const newBoss = Boss.create({
        raidId: newRaid.id.value,
        name: sourceBoss.name,
        orderIndex: sourceBoss.orderIndex,
      })
      await this.bossRepository.save(newBoss)

      for (const sourceItem of sourceBoss.items) {
        const newItem = Item.create({
          bossId: newBoss.id.value,
          name: sourceItem.name,
          itemType: sourceItem.itemType as ItemTypeValue,
          ilvl: sourceItem.ilvl,
        })
        await this.itemRepository.save(newItem)
        itemCount++
      }
    }

    return {
      raidId: newRaid.id.value,
      date: newRaid.date,
      description: newRaid.description,
      status: newRaid.status,
      bossCount: sourceBosses.length,
      itemCount,
    }
  }
}
