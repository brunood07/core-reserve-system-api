import type { IRefreshTokenStore } from '../../src/application/_shared/IRefreshTokenStore.js'

export class FakeRefreshTokenStore implements IRefreshTokenStore {
  public store: Map<string, string> = new Map()

  async save(userId: string, token: string, _ttlSeconds: number): Promise<void> {
    this.store.set(userId, token)
  }

  async get(userId: string): Promise<string | null> {
    return this.store.get(userId) ?? null
  }

  async delete(userId: string): Promise<void> {
    this.store.delete(userId)
  }
}
