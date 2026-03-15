import type { FastifyInstance } from 'fastify'
import { PlayerController } from '../controllers/PlayerController.js'
import { PrismaUserRepository } from '../../../infrastructure/database/prisma/PrismaUserRepository.js'
import { PrismaRaidAttendanceRepository } from '../../../infrastructure/database/prisma/PrismaRaidAttendanceRepository.js'
import { ListPlayersUseCase } from '../../../application/user/list-players/ListPlayersUseCase.js'
import { GetPlayerUseCase } from '../../../application/user/get-player/GetPlayerUseCase.js'
import { UpdatePlayerUseCase } from '../../../application/user/update-player/UpdatePlayerUseCase.js'
import { DeletePlayerUseCase } from '../../../application/user/delete-player/DeletePlayerUseCase.js'
import { GetPlayerAttendanceUseCase } from '../../../application/attendance/get-player-attendance/GetPlayerAttendanceUseCase.js'
import { authenticate } from '../middlewares/authenticate.js'
import { requireRoles } from '../middlewares/requireRoles.js'

export async function playerRoutes(app: FastifyInstance): Promise<void> {
  const userRepo = new PrismaUserRepository()
  const attendanceRepo = new PrismaRaidAttendanceRepository()

  const controller = new PlayerController(
    new ListPlayersUseCase(userRepo),
    new GetPlayerUseCase(userRepo),
    new UpdatePlayerUseCase(userRepo),
    new DeletePlayerUseCase(userRepo),
    new GetPlayerAttendanceUseCase(userRepo, attendanceRepo)
  )

  const leaderGuard = { preHandler: [authenticate, requireRoles('RAID_LEADER', 'OFFICER', 'ADMIN')] }

  app.get('/', leaderGuard, controller.list.bind(controller))
  app.get('/:id', leaderGuard, controller.getById.bind(controller))
  app.put('/:id', leaderGuard, controller.update.bind(controller))
  app.delete('/:id', leaderGuard, controller.remove.bind(controller))
  app.get('/:id/attendance', { preHandler: [authenticate] }, controller.getAttendance.bind(controller))
}
