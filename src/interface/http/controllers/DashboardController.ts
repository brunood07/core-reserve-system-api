import type { FastifyRequest, FastifyReply } from 'fastify'
import type { GetDashboardSummaryUseCase } from '../../../application/dashboard/get-summary/GetDashboardSummaryUseCase.js'

export class DashboardController {
  constructor(private readonly getDashboardSummary: GetDashboardSummaryUseCase) {}

  async getSummary(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const output = await this.getDashboardSummary.execute()
    reply.send(output)
  }
}
