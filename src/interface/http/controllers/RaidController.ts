import { z } from 'zod'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { CreateRaidUseCase } from '../../../application/raid/create-raid/CreateRaidUseCase.js'
import {
  RaidNotOnWednesdayError,
  RaidDateAlreadyTakenError,
} from '../../../application/raid/create-raid/CreateRaidUseCase.js'
import type { ListRaidsUseCase } from '../../../application/raid/list-raids/ListRaidsUseCase.js'
import type { UpdateRaidStatusUseCase } from '../../../application/raid/update-raid-status/UpdateRaidStatusUseCase.js'
import { RaidNotFoundError } from '../../../application/raid/update-raid-status/UpdateRaidStatusUseCase.js'

const createRaidSchema = z.object({
  date: z.string().datetime({ message: 'date must be a valid ISO 8601 datetime string' }),
  description: z.string().max(500).optional(),
  status: z.enum(['DRAFT', 'OPEN', 'CLOSED'], {
    errorMap: () => ({ message: 'status must be one of: DRAFT, OPEN, CLOSED' }),
  }),
})

const updateStatusSchema = z.object({
  status: z.enum(['DRAFT', 'OPEN', 'CLOSED', 'COMPLETED'], {
    errorMap: () => ({ message: 'status must be one of: DRAFT, OPEN, CLOSED, COMPLETED' }),
  }),
})

export class RaidController {
  constructor(
    private readonly createRaid: CreateRaidUseCase,
    private readonly listRaids: ListRaidsUseCase,
    private readonly updateRaidStatus: UpdateRaidStatusUseCase
  ) {}

  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const result = createRaidSchema.safeParse(request.body)

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
      const output = await this.createRaid.execute({
        date: new Date(result.data.date),
        description: result.data.description,
        status: result.data.status,
        createdById: request.user.userId,
      })

      reply.status(201).send(output)
    } catch (err) {
      if (err instanceof RaidNotOnWednesdayError) {
        reply.status(400).send({ error: err.message })
        return
      }
      if (err instanceof RaidDateAlreadyTakenError) {
        reply.status(409).send({ error: err.message })
        return
      }
      throw err
    }
  }

  async list(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const output = await this.listRaids.execute({})
    reply.send(output)
  }

  async updateStatus(
    request: FastifyRequest<{ Params: { raidId: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    const result = updateStatusSchema.safeParse(request.body)

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
      const output = await this.updateRaidStatus.execute({
        raidId: request.params.raidId,
        status: result.data.status,
      })
      reply.send(output)
    } catch (err) {
      if (err instanceof RaidNotFoundError) {
        reply.status(404).send({ error: err.message })
        return
      }
      throw err
    }
  }
}
