import { z } from 'zod'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { SaveAttendanceUseCase } from '../../../application/attendance/save-attendance/SaveAttendanceUseCase.js'
import { RaidNotFoundError as SaveRaidNotFoundError } from '../../../application/attendance/save-attendance/SaveAttendanceUseCase.js'
import type { GetRaidAttendanceUseCase } from '../../../application/attendance/get-raid-attendance/GetRaidAttendanceUseCase.js'
import { RaidNotFoundError as GetRaidNotFoundError } from '../../../application/attendance/get-raid-attendance/GetRaidAttendanceUseCase.js'

const saveAttendanceSchema = z.object({
  attendances: z.array(
    z.object({
      userId: z.string().min(1, 'userId is required'),
      characterId: z.string().min(1, 'characterId is required'),
      attended: z.boolean({ required_error: 'attended is required' }),
    })
  ),
})

export class AttendanceController {
  constructor(
    private readonly saveAttendance: SaveAttendanceUseCase,
    private readonly getRaidAttendance: GetRaidAttendanceUseCase
  ) {}

  async save(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { raidId } = request.params as { raidId: string }

    const result = saveAttendanceSchema.safeParse(request.body)
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
      const output = await this.saveAttendance.execute({
        raidId,
        attendances: result.data.attendances,
      })
      reply.status(200).send(output)
    } catch (err) {
      if (err instanceof SaveRaidNotFoundError) {
        reply.status(404).send({ error: err.message })
        return
      }
      throw err
    }
  }

  async getRaid(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { raidId } = request.params as { raidId: string }

    try {
      const output = await this.getRaidAttendance.execute({ raidId })
      reply.send(output)
    } catch (err) {
      if (err instanceof GetRaidNotFoundError) {
        reply.status(404).send({ error: err.message })
        return
      }
      throw err
    }
  }
}
