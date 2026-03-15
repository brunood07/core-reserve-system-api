import type { FastifyRequest, FastifyReply } from 'fastify'
import type { CreateReserveUseCase } from '../../../application/reserve/create-reserve/CreateReserveUseCase.js'
import type { CancelReserveUseCase } from '../../../application/reserve/cancel-reserve/CancelReserveUseCase.js'
import type { ListReservesByRaidUseCase } from '../../../application/reserve/list-reserves-by-raid/ListReservesByRaidUseCase.js'

export class ReserveController {
  constructor(
    private readonly createReserve: CreateReserveUseCase,
    private readonly cancelReserve: CancelReserveUseCase,
    private readonly listByRaid: ListReservesByRaidUseCase
  ) {}

  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = request.body as {
      raidId: string
      characterId: string
      itemName: string
    }

    const output = await this.createReserve.execute(body)
    reply.status(201).send(output)
  }

  async cancel(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string }
    const output = await this.cancelReserve.execute({ reserveId: id })
    reply.send(output)
  }

  async listByRaidId(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { raidId } = request.params as { raidId: string }
    const output = await this.listByRaid.execute({ raidId })
    reply.send(output)
  }
}
