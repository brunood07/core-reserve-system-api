import type { UseCase } from '../../_shared/UseCase.js'
import type { IItemRepository } from '../../../domain/item/repositories/IItemRepository.js'
import type { IBossRepository } from '../../../domain/boss/repositories/IBossRepository.js'
import { Item, type ItemTypeValue } from '../../../domain/item/entities/Item.js'
import { UniqueEntityId } from '../../../domain/_shared/UniqueEntityId.js'

export interface CreateItemInput {
  bossId: string
  name: string
  itemType: ItemTypeValue
  ilvl: number
}

export interface CreateItemOutput {
  itemId: string
  bossId: string
  name: string
  itemType: ItemTypeValue
  ilvl: number
  createdAt: Date
}

export class BossNotFoundError extends Error {
  constructor(id: string) {
    super(`Boss not found: ${id}`)
    this.name = 'BossNotFoundError'
  }
}

export class CreateItemUseCase implements UseCase<CreateItemInput, CreateItemOutput> {
  constructor(
    private readonly itemRepository: IItemRepository,
    private readonly bossRepository: IBossRepository
  ) {}

  async execute(input: CreateItemInput): Promise<CreateItemOutput> {
    const boss = await this.bossRepository.findById(new UniqueEntityId(input.bossId))
    if (!boss) {
      throw new BossNotFoundError(input.bossId)
    }

    const item = Item.create(input)
    await this.itemRepository.save(item)

    return {
      itemId: item.id.value,
      bossId: item.bossId,
      name: item.name,
      itemType: item.itemType,
      ilvl: item.ilvl,
      createdAt: item.createdAt,
    }
  }
}
