import type { UseCase } from '../../_shared/UseCase.js'
import type { IItemRepository } from '../../../domain/item/repositories/IItemRepository.js'
import type { IBossRepository } from '../../../domain/boss/repositories/IBossRepository.js'
import type { ItemTypeValue } from '../../../domain/item/entities/Item.js'
import { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'

export interface ListItemsInput {
  bossId: string
}

export interface ListItemsOutput {
  items: Array<{
    id: string
    name: string
    itemType: ItemTypeValue
    ilvl: number
  }>
}

export class BossNotFoundError extends Error {
  constructor(id: string) {
    super(`Boss not found: ${id}`)
    this.name = 'BossNotFoundError'
  }
}

export class ListItemsUseCase implements UseCase<ListItemsInput, ListItemsOutput> {
  constructor(
    private readonly itemRepository: IItemRepository,
    private readonly bossRepository: IBossRepository
  ) {}

  async execute(input: ListItemsInput): Promise<ListItemsOutput> {
    const boss = await this.bossRepository.findById(new UniqueEntityId(input.bossId))
    if (!boss) {
      throw new BossNotFoundError(input.bossId)
    }

    const items = await this.itemRepository.findByBossId(input.bossId)

    return {
      items: items.map((item) => ({
        id: item.id.value,
        name: item.name,
        itemType: item.itemType,
        ilvl: item.ilvl,
      })),
    }
  }
}
