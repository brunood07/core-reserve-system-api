import { z } from 'zod'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { CreateItemUseCase } from '../../../application/item/create-item/CreateItemUseCase.js'
import { BossNotFoundError as CreateBossNotFoundError } from '../../../application/item/create-item/CreateItemUseCase.js'
import type { ListItemsUseCase } from '../../../application/item/list-items/ListItemsUseCase.js'
import { BossNotFoundError as ListBossNotFoundError } from '../../../application/item/list-items/ListItemsUseCase.js'

const ITEM_TYPES = [
  'HELM', 'SHOULDER', 'BACK', 'CHEST', 'WRIST', 'HANDS',
  'WAIST', 'LEGS', 'FEET', 'NECK', 'FINGER', 'TRINKET',
  'WEAPON', 'SHIELD', 'OFF_HAND',
] as const

const createItemSchema = z.object({
  name: z.string().min(1, 'name is required').max(100, 'name cannot exceed 100 characters'),
  item_type: z.enum(ITEM_TYPES, {
    errorMap: () => ({ message: `item_type must be one of: ${ITEM_TYPES.join(', ')}` }),
  }),
  ilvl: z
    .number({ invalid_type_error: 'ilvl must be a number' })
    .int('ilvl must be an integer')
    .min(1, 'ilvl must be at least 1')
    .max(700, 'ilvl cannot exceed 700'),
})

export class ItemController {
  constructor(
    private readonly createItem: CreateItemUseCase,
    private readonly listItems: ListItemsUseCase
  ) {}

  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { bossId } = request.params as { bossId: string }

    const result = createItemSchema.safeParse(request.body)
    if (!result.success) {
      reply.status(400).send({
        error: 'Validation failed',
        details: result.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
      return
    }

    try {
      const output = await this.createItem.execute({
        bossId,
        name: result.data.name,
        itemType: result.data.item_type,
        ilvl: result.data.ilvl,
      })
      reply.status(201).send(output)
    } catch (err) {
      if (err instanceof CreateBossNotFoundError) {
        reply.status(404).send({ error: err.message })
        return
      }
      throw err
    }
  }

  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { bossId } = request.params as { bossId: string }

    try {
      const output = await this.listItems.execute({ bossId })
      reply.send(output)
    } catch (err) {
      if (err instanceof ListBossNotFoundError) {
        reply.status(404).send({ error: err.message })
        return
      }
      throw err
    }
  }
}
