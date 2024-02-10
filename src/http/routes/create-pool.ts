import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { app } from '../server'
import z from 'zod'
import { prisma } from '../../lib/prisma'

export async function createPools(app: FastifyInstance) {
  app.post('/pools', async (req: FastifyRequest, reply: FastifyReply) => {
    const poolBodySchema = z.object({
      title: z.string(),
      options: z.array(z.string()),
    })
    const { title, options } = poolBodySchema.parse(req.body)
    const pool = await prisma.pool.create({
      data: {
        title,
        options: {
          createMany: {
            data: options.map((option) => {
              return { title: option }
            }),
          },
        },
      },
    })

    return reply.status(201).send({ poolId: pool.id })
  })
}
