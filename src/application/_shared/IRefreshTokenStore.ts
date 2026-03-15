export interface IRefreshTokenStore {
  save(userId: string, token: string, ttlSeconds: number): Promise<void>
  get(userId: string): Promise<string | null>
  delete(userId: string): Promise<void>
}
