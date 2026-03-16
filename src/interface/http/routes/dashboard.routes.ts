import type { FastifyInstance } from 'fastify'
import { DashboardController } from '../controllers/DashboardController.js'
import { GetDashboardSummaryUseCase } from '../../../application/dashboard/get-summary/GetDashboardSummaryUseCase.js'
import { PrismaUserRepository } from '../../../infrastructure/database/prisma/PrismaUserRepository.js'
import { PrismaRaidRepository } from '../../../infrastructure/database/prisma/PrismaRaidRepository.js'
import { PrismaReservationFormRepository } from '../../../infrastructure/database/prisma/PrismaReservationFormRepository.js'
import { PrismaRaidAttendanceRepository } from '../../../infrastructure/database/prisma/PrismaRaidAttendanceRepository.js'
import { PrismaBossRepository } from '../../../infrastructure/database/prisma/PrismaBossRepository.js'
import { PrismaReserveRepository } from '../../../infrastructure/database/prisma/PrismaReserveRepository.js'
import { authenticate } from '../middlewares/authenticate.js'
import { requireRoles } from '../middlewares/requireRoles.js'

export async function dashboardRoutes(app: FastifyInstance): Promise<void> {
  const controller = new DashboardController(
    new GetDashboardSummaryUseCase(
      new PrismaUserRepository(),
      new PrismaRaidRepository(),
      new PrismaReservationFormRepository(),
      new PrismaRaidAttendanceRepository(),
      new PrismaBossRepository(),
      new PrismaReserveRepository()
    )
  )

  const leaderGuard = {
    preHandler: [authenticate, requireRoles('RAID_LEADER', 'OFFICER', 'ADMIN')],
  }

  app.get('/summary', leaderGuard, controller.getSummary.bind(controller))
}
