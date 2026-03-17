import { z } from 'zod'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { CreateRaidUseCase } from '../../../application/raid/create-raid/CreateRaidUseCase.js'
import {
  RaidNotOnWednesdayError,
  RaidDateAlreadyTakenError,
  ActiveRaidAlreadyExistsError,
} from '../../../application/raid/create-raid/CreateRaidUseCase.js'
import type { ListRaidsUseCase } from '../../../application/raid/list-raids/ListRaidsUseCase.js'
import type { UpdateRaidStatusUseCase } from '../../../application/raid/update-raid-status/UpdateRaidStatusUseCase.js'
import { RaidNotFoundError } from '../../../application/raid/update-raid-status/UpdateRaidStatusUseCase.js'
import type { DuplicateRaidUseCase } from '../../../application/raid/duplicate-raid/DuplicateRaidUseCase.js'
import {
  RaidNotFoundError as DuplicateRaidNotFoundError,
  RaidNotOnWednesdayError as DuplicateRaidNotOnWednesdayError,
  RaidDateAlreadyTakenError as DuplicateRaidDateAlreadyTakenError,
} from '../../../application/raid/duplicate-raid/DuplicateRaidUseCase.js'
import type { CompleteRaidUseCase } from '../../../application/raid/complete-raid/CompleteRaidUseCase.js'
import {
  RaidNotFoundError as CompleteRaidNotFoundError,
  RaidAlreadyCompletedError,
} from '../../../application/raid/complete-raid/CompleteRaidUseCase.js'

const createRaidSchema = z.object({
  date: z.string().datetime({ message: 'date must be a valid ISO 8601 datetime string' }),
  description: z.string().max(500).optional(),
})

const duplicateRaidSchema = z.object({
  date: z.string().datetime({ message: 'date must be a valid ISO 8601 datetime string' }),
})

export class RaidController {
  constructor(
    private readonly createRaid: CreateRaidUseCase,
    private readonly listRaids: ListRaidsUseCase,
    private readonly updateRaidStatus: UpdateRaidStatusUseCase,
    private readonly duplicateRaid: DuplicateRaidUseCase,
    private readonly completeRaid: CompleteRaidUseCase
  ) {}

  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const result = createRaidSchema.safeParse(request.body)
    if (!result.success) {
      reply.status(400).send({
        error: 'Validation failed',
        details: result.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      })
      return
    }

    try {
      const output = await this.createRaid.execute({
        date: new Date(result.data.date),
        description: result.data.description,
        createdById: request.user.userId,
      })
      reply.status(201).send(output)
    } catch (err) {
      if (err instanceof RaidNotOnWednesdayError) {
        reply.status(400).send({ error: err.message })
        return
      }
      if (err instanceof ActiveRaidAlreadyExistsError) {
        reply.status(409).send({ error: err.message })
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

  async complete(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { raidId } = request.params as { raidId: string }
    try {
      const output = await this.completeRaid.execute({ raidId })
      reply.send(output)
    } catch (err) {
      if (err instanceof CompleteRaidNotFoundError) {
        reply.status(404).send({ error: err.message })
        return
      }
      if (err instanceof RaidAlreadyCompletedError) {
        reply.status(409).send({ error: err.message })
        return
      }
      throw err
    }
  }

  async duplicate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { raidId } = request.params as { raidId: string }
    const result = duplicateRaidSchema.safeParse(request.body)
    if (!result.success) {
      reply.status(400).send({
        error: 'Validation failed',
        details: result.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      })
      return
    }

    try {
      const output = await this.duplicateRaid.execute({
        sourceRaidId: raidId,
        newDate: new Date(result.data.date),
        createdById: request.user.userId,
      })
      reply.status(201).send(output)
    } catch (err) {
      if (err instanceof DuplicateRaidNotFoundError) {
        reply.status(404).send({ error: err.message })
        return
      }
      if (err instanceof DuplicateRaidNotOnWednesdayError) {
        reply.status(400).send({ error: err.message })
        return
      }
      if (err instanceof DuplicateRaidDateAlreadyTakenError) {
        reply.status(409).send({ error: err.message })
        return
      }
      throw err
    }
  }

  async updateStatus(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { raidId } = request.params as { raidId: string }
    const { status } = request.body as { status: string }
    try {
      const output = await this.updateRaidStatus.execute({ raidId, status })
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
