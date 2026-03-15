import { z } from 'zod'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ListPlayersUseCase } from '../../../application/user/list-players/ListPlayersUseCase.js'
import type { GetPlayerUseCase } from '../../../application/user/get-player/GetPlayerUseCase.js'
import { PlayerNotFoundError as GetPlayerNotFoundError } from '../../../application/user/get-player/GetPlayerUseCase.js'
import type { UpdatePlayerUseCase } from '../../../application/user/update-player/UpdatePlayerUseCase.js'
import {
  PlayerNotFoundError as UpdatePlayerNotFoundError,
  PlayerEmailAlreadyTakenError,
} from '../../../application/user/update-player/UpdatePlayerUseCase.js'
import type { DeletePlayerUseCase } from '../../../application/user/delete-player/DeletePlayerUseCase.js'
import { PlayerNotFoundError as DeletePlayerNotFoundError } from '../../../application/user/delete-player/DeletePlayerUseCase.js'

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
})

const updateBodySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  email: z.string().email('Invalid email format').optional(),
  role: z.enum(['PLAYER', 'RAID_LEADER', 'OFFICER', 'ADMIN']).optional(),
})

export class PlayerController {
  constructor(
    private readonly listPlayers: ListPlayersUseCase,
    private readonly getPlayer: GetPlayerUseCase,
    private readonly updatePlayer: UpdatePlayerUseCase,
    private readonly deletePlayer: DeletePlayerUseCase
  ) {}

  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const result = listQuerySchema.safeParse(request.query)

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

    const output = await this.listPlayers.execute(result.data)
    reply.send(output)
  }

  async getById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string }

    try {
      const output = await this.getPlayer.execute({ playerId: id })
      reply.send(output)
    } catch (err) {
      if (err instanceof GetPlayerNotFoundError) {
        reply.status(404).send({ error: err.message })
        return
      }
      throw err
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string }
    const result = updateBodySchema.safeParse(request.body)

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
      const output = await this.updatePlayer.execute({ playerId: id, ...result.data })
      reply.send(output)
    } catch (err) {
      if (err instanceof UpdatePlayerNotFoundError) {
        reply.status(404).send({ error: err.message })
        return
      }
      if (err instanceof PlayerEmailAlreadyTakenError) {
        reply.status(409).send({ error: err.message })
        return
      }
      throw err
    }
  }

  async remove(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string }

    try {
      const output = await this.deletePlayer.execute({ playerId: id })
      reply.send(output)
    } catch (err) {
      if (err instanceof DeletePlayerNotFoundError) {
        reply.status(404).send({ error: err.message })
        return
      }
      throw err
    }
  }
}
