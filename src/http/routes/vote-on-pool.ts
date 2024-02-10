import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import z from 'zod'
import { randomUUID } from 'node:crypto'
import { prisma } from '../../lib/prisma'
import { redis } from '../../lib/redis'
import { voting } from '../../utils/voting-pub-sub'
export async function voteOnPool(app: FastifyInstance) {
  app.post(
    '/pools/:poolId/votes',
    async (req: FastifyRequest, reply: FastifyReply) => {
      const voteOnPoolBody = z.object({
        poolOptionId: z.string().uuid(),
      })
      const voteOnPoolParams = z.object({
        poolId: z.string().uuid(),
      })
      const { poolOptionId } = voteOnPoolBody.parse(req.body)
      const { poolId } = voteOnPoolParams.parse(req.params)

      let { sessionId } = req.cookies

      if (sessionId) {
        const userPreviousVoteOnPool = await prisma.vote.findUnique({
          where: {
            sessionId_poolId: {
              sessionId,
              poolId,
            },
          },
        })
        if (
          userPreviousVoteOnPool &&
          userPreviousVoteOnPool.poolOptionId !== poolOptionId
        ) {
          // Apagar o voto e criar um novo
          await prisma.vote.delete({
            where: {
              id: userPreviousVoteOnPool.id,
            },
          })
          const votes = await redis.zincrby(
            poolId,
            -1,
            userPreviousVoteOnPool.poolOptionId,
          )
          voting.publish(poolId, {
            poolOptionId: userPreviousVoteOnPool.poolOptionId,
            votes: Number(votes),
          })
        } else if (userPreviousVoteOnPool) {
          return reply
            .status(400)
            .send({ message: 'You Already Voted on this Pool' })
        }
      }

      if (!sessionId) {
        sessionId = randomUUID()
        reply.setCookie('sessionId', sessionId, {
          path: '/',
          maxAge: 60 * 60 * 24 * 30, // 30days
          signed: true,
        })
      }

      await prisma.vote.create({
        data: {
          sessionId,
          poolId,
          poolOptionId,
        },
      })
      const votes = await redis.zincrby(poolId, 1, poolOptionId)

      voting.publish(poolId, {
        poolOptionId,
        votes: Number(votes),
      })

      return reply.status(201).send()
    },
  )
}
