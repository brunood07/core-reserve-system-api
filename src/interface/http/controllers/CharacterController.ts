import { z } from 'zod'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { CreateCharacterUseCase } from '../../../application/character/create-character/CreateCharacterUseCase.js'
import { CharacterNameAlreadyTakenError } from '../../../application/character/create-character/CreateCharacterUseCase.js'
import type { ListCharactersUseCase } from '../../../application/character/list-characters/ListCharactersUseCase.js'
import type { GetMyCharactersUseCase } from '../../../application/character/get-my-characters/GetMyCharactersUseCase.js'
import type { ActivateCharacterUseCase } from '../../../application/character/activate-character/ActivateCharacterUseCase.js'
import { CharacterNotFoundError, CharacterOwnershipError } from '../../../application/character/activate-character/ActivateCharacterUseCase.js'

const WOW_CLASSES = [
  'WARRIOR', 'PALADIN', 'HUNTER', 'ROGUE', 'PRIEST',
  'DEATH_KNIGHT', 'SHAMAN', 'MAGE', 'WARLOCK', 'MONK',
  'DRUID', 'DEMON_HUNTER', 'EVOKER',
] as const

const createCharacterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(12, 'Name cannot exceed 12 characters'),
  class: z.enum(WOW_CLASSES, { errorMap: () => ({ message: `class must be one of: ${WOW_CLASSES.join(', ')}` }) }),
  spec: z.string().min(1, 'Spec is required').max(50, 'Spec cannot exceed 50 characters'),
  realm: z.string().min(1, 'Realm is required').max(50, 'Realm cannot exceed 50 characters'),
})

export class CharacterController {
  constructor(
    private readonly createCharacter: CreateCharacterUseCase,
    private readonly listCharacters: ListCharactersUseCase,
    private readonly getMyCharacters: GetMyCharactersUseCase,
    private readonly activateCharacter: ActivateCharacterUseCase
  ) {}

  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const result = createCharacterSchema.safeParse(request.body)

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
      const output = await this.createCharacter.execute({
        userId: request.user.userId,
        ...result.data,
      })

      reply.status(201).send(output)
    } catch (err) {
      if (err instanceof CharacterNameAlreadyTakenError) {
        reply.status(409).send({ error: err.message })
        return
      }
      throw err
    }
  }

  async list(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const output = await this.listCharacters.execute({})
    reply.send(output)
  }

  async listMine(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const output = await this.getMyCharacters.execute({ userId: request.user.userId })
    reply.send(output)
  }

  async activate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string }

    try {
      const output = await this.activateCharacter.execute({
        characterId: id,
        userId: request.user.userId,
      })
      reply.status(200).send(output)
    } catch (err) {
      if (err instanceof CharacterNotFoundError) {
        reply.status(404).send({ error: err.message })
        return
      }
      if (err instanceof CharacterOwnershipError) {
        reply.status(403).send({ error: err.message })
        return
      }
      throw err
    }
  }
}
