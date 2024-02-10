import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import z from 'zod'
import { prisma } from '../../lib/prisma'
import { redis } from '../../lib/redis'

export async function getPool(app: FastifyInstance) {
  app.get(
    '/pools/:poolId',
    async (req: FastifyRequest, reply: FastifyReply) => {
      const poolParamsSchema = z.object({
        poolId: z.string().uuid(),
      })
      const { poolId } = poolParamsSchema.parse(req.params)
      const pool = await prisma.pool.findUnique({
        where: {
          id: poolId,
        },
        include: {
          options: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      })

      if (!pool) {
        return reply.status(400).send({ message: 'Pool not found.' })
      }

      const result = await redis.zrange(poolId, 0, -1, 'WITHSCORES')

      const votes = result.reduce(
        (obj, line, index) => {
          if (index % 2 === 0) {
            const score = result[index + 1]

            Object.assign(obj, { [line]: Number(score) })
          }

          return obj
        },
        {} as Record<string, number>,
      )
      return reply.send({
        pool: {
          id: pool.id,
          title: pool.title,
          options: pool.options.map((option) => {
            return {
              id: option.id,
              title: option.title,
              score: option.id in votes ? votes[option.id] : 0,
            }
          }),
        },
      })
    },
  )
}
