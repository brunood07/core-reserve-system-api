import type { IRefreshTokenStore } from '../../application/_shared/IRefreshTokenStore.js'
import { prisma } from '../database/prisma/PrismaService.js'

export class PrismaRefreshTokenStore implements IRefreshTokenStore {
  async save(userId: string, token: string, ttlSeconds: number): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000)

    await prisma.refreshToken.upsert({
      where: { userId },
      create: { userId, token, expiresAt },
      update: { token, expiresAt },
    })
  }

  async get(userId: string): Promise<string | null> {
    const record = await prisma.refreshToken.findUnique({ where: { userId } })

    if (!record) return null
    if (record.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { userId } })
      return null
    }

    return record.token
  }

  async delete(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { userId } })
  }
}
