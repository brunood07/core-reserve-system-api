import Fastify from 'fastify'
import cors from '@fastify/cors'
import { authRoutes } from './routes/auth.routes.js'
import { raidRoutes } from './routes/raid.routes.js'
import { characterRoutes } from './routes/character.routes.js'
import { reserveRoutes } from './routes/reserve.routes.js'
import { playerRoutes } from './routes/player.routes.js'

export async function buildApp() {
  const app = Fastify({
    logger: process.env['NODE_ENV'] !== 'test',
  })

  await app.register(cors, {
    origin: process.env['CORS_ORIGIN'] ?? '*',
  })

  app.get('/health', async () => ({ status: 'ok' }))

  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(playerRoutes, { prefix: '/api/players' })
  await app.register(raidRoutes, { prefix: '/raids' })
  await app.register(characterRoutes, { prefix: '/characters' })
  await app.register(reserveRoutes, { prefix: '/reserves' })

  return app
}

async function start() {
  const app = await buildApp()
  const port = Number(process.env['PORT'] ?? 3333)
  const host = process.env['HOST'] ?? '0.0.0.0'

  try {
    await app.listen({ port, host })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
