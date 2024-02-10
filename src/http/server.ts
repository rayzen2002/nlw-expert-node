import fastify from 'fastify'
import { createPools } from './routes/create-pool'
import { getPool } from './routes/get-pools'
import { voteOnPool } from './routes/vote-on-pool'
import cookie from '@fastify/cookie'
import webSocket from '@fastify/websocket'
import { poolResults } from './ws/pool-results'

export const app = fastify()

app.get('/hello', () => {
  return 'hello world'
})
app.register(cookie, {
  secret: 'nlw-expert',
  hook: 'onRequest',
  parseOptions: {},
})
app.register(webSocket)
app.register(createPools)
app.register(getPool)
app.register(voteOnPool)

app.register(poolResults)

app.listen({ port: 3333 }).then(() => {
  console.log('HTTP server running on 3333 🚀')
})
