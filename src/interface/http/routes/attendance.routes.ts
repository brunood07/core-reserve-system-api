import type { FastifyInstance } from 'fastify'
import { AttendanceController } from '../controllers/AttendanceController.js'
import { PrismaRaidRepository } from '../../../infrastructure/database/prisma/PrismaRaidRepository.js'
import { PrismaRaidAttendanceRepository } from '../../../infrastructure/database/prisma/PrismaRaidAttendanceRepository.js'
import { SaveAttendanceUseCase } from '../../../application/attendance/save-attendance/SaveAttendanceUseCase.js'
import { GetRaidAttendanceUseCase } from '../../../application/attendance/get-raid-attendance/GetRaidAttendanceUseCase.js'
import { EnrollPlayerUseCase } from '../../../application/attendance/enroll-player/EnrollPlayerUseCase.js'
import { authenticate } from '../middlewares/authenticate.js'
import { requireRoles } from '../middlewares/requireRoles.js'

export async function attendanceRoutes(app: FastifyInstance): Promise<void> {
  const raidRepo = new PrismaRaidRepository()
  const attendanceRepo = new PrismaRaidAttendanceRepository()

  const controller = new AttendanceController(
    new SaveAttendanceUseCase(raidRepo, attendanceRepo),
    new GetRaidAttendanceUseCase(raidRepo, attendanceRepo),
    new EnrollPlayerUseCase(raidRepo, attendanceRepo)
  )

  const leaderGuard = { preHandler: [authenticate, requireRoles('RAID_LEADER', 'OFFICER', 'ADMIN')] }

  app.post('/:raidId/attendance', leaderGuard, controller.save.bind(controller))
  app.get('/:raidId/attendance', leaderGuard, controller.getRaid.bind(controller))
  app.post('/:raidId/roster', leaderGuard, controller.enroll.bind(controller))
}
