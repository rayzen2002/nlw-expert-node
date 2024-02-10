import { FastifyInstance } from 'fastify'
import { voting } from '../../utils/voting-pub-sub'
import z from 'zod'

export async function poolResults(app: FastifyInstance) {
  app.get(
    '/pools/:poolId/results',
    {
      websocket: true,
    },
    (connection, request) => {
      const getPoolParams = z.object({
        poolId: z.string().uuid(),
      })
      const { poolId } = getPoolParams.parse(request.params)
      voting.subscribe(poolId, (message) => {
        connection.socket.send(JSON.stringify(message))
      })
    },
  )
}
