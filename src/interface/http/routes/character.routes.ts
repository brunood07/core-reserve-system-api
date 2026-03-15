import type { FastifyInstance } from 'fastify'
import { CharacterController } from '../controllers/CharacterController.js'
import { PrismaCharacterRepository } from '../../../infrastructure/database/prisma/PrismaCharacterRepository.js'
import { CreateCharacterUseCase } from '../../../application/character/create-character/CreateCharacterUseCase.js'
import { ListCharactersUseCase } from '../../../application/character/list-characters/ListCharactersUseCase.js'
import { ActivateCharacterUseCase } from '../../../application/character/activate-character/ActivateCharacterUseCase.js'
import { authenticate } from '../middlewares/authenticate.js'
import { requireRoles } from '../middlewares/requireRoles.js'

export async function characterRoutes(app: FastifyInstance): Promise<void> {
  const repository = new PrismaCharacterRepository()
  const controller = new CharacterController(
    new CreateCharacterUseCase(repository),
    new ListCharactersUseCase(repository),
    new ActivateCharacterUseCase(repository)
  )

  app.post('/', {
    preHandler: [authenticate, requireRoles('PLAYER', 'RAID_LEADER', 'OFFICER', 'ADMIN')],
  }, controller.create.bind(controller))

  app.get('/', controller.list.bind(controller))

  app.patch('/:id/activate', {
    preHandler: [authenticate],
  }, controller.activate.bind(controller))
}
