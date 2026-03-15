import { z } from 'zod'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { CreateBossUseCase } from '../../../application/boss/create-boss/CreateBossUseCase.js'
import {
  RaidNotFoundError,
  BossOrderIndexAlreadyTakenError,
} from '../../../application/boss/create-boss/CreateBossUseCase.js'

const createBossSchema = z.object({
  name: z.string().min(1, 'name is required').max(100, 'name cannot exceed 100 characters'),
  order_index: z
    .number({ invalid_type_error: 'order_index must be a number' })
    .int('order_index must be an integer')
    .min(1, 'order_index must be a positive integer'),
})

export class BossController {
  constructor(private readonly createBoss: CreateBossUseCase) {}

  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { raidId } = request.params as { raidId: string }

    const result = createBossSchema.safeParse(request.body)
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
      const output = await this.createBoss.execute({
        raidId,
        name: result.data.name,
        orderIndex: result.data.order_index,
      })

      reply.status(201).send(output)
    } catch (err) {
      if (err instanceof RaidNotFoundError) {
        reply.status(404).send({ error: err.message })
        return
      }
      if (err instanceof BossOrderIndexAlreadyTakenError) {
        reply.status(400).send({ error: err.message })
        return
      }
      throw err
    }
  }
}
