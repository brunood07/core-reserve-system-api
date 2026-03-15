import type { FastifyRequest, FastifyReply } from 'fastify'
import type { CreateRaidUseCase } from '../../../application/raid/create-raid/CreateRaidUseCase.js'
import type { ListRaidsUseCase } from '../../../application/raid/list-raids/ListRaidsUseCase.js'

export class RaidController {
  constructor(
    private readonly createRaid: CreateRaidUseCase,
    private readonly listRaids: ListRaidsUseCase
  ) {}

  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = request.body as {
      name: string
      difficulty: string
      maxSlots: number
      scheduledAt?: string
    }

    const output = await this.createRaid.execute({
      name: body.name,
      difficulty: body.difficulty as 'NORMAL' | 'HEROIC' | 'MYTHIC',
      maxSlots: body.maxSlots,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
    })

    reply.status(201).send(output)
  }

  async list(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const output = await this.listRaids.execute({})
    reply.send(output)
  }
}
