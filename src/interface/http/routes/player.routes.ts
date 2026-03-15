import type { FastifyInstance } from 'fastify'
import { PlayerController } from '../controllers/PlayerController.js'
import { PrismaUserRepository } from '../../../infrastructure/database/prisma/PrismaUserRepository.js'
import { ListPlayersUseCase } from '../../../application/user/list-players/ListPlayersUseCase.js'
import { GetPlayerUseCase } from '../../../application/user/get-player/GetPlayerUseCase.js'
import { UpdatePlayerUseCase } from '../../../application/user/update-player/UpdatePlayerUseCase.js'
import { DeletePlayerUseCase } from '../../../application/user/delete-player/DeletePlayerUseCase.js'
import { authenticate } from '../middlewares/authenticate.js'
import { requireRoles } from '../middlewares/requireRoles.js'

export async function playerRoutes(app: FastifyInstance): Promise<void> {
  const repository = new PrismaUserRepository()
  const controller = new PlayerController(
    new ListPlayersUseCase(repository),
    new GetPlayerUseCase(repository),
    new UpdatePlayerUseCase(repository),
    new DeletePlayerUseCase(repository)
  )

  const guard = { preHandler: [authenticate, requireRoles('RAID_LEADER', 'OFFICER', 'ADMIN')] }

  app.get('/', guard, controller.list.bind(controller))
  app.get('/:id', guard, controller.getById.bind(controller))
  app.put('/:id', guard, controller.update.bind(controller))
  app.delete('/:id', guard, controller.remove.bind(controller))
}
