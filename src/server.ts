import fastify from 'fastify'
import jwt from '@fastify/jwt'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import fastifyStatic from "@fastify/static"
import 'dotenv/config'
import { join } from 'path'

import { authRoutes } from './routes/auth'
import { adRoutes } from './routes/ads'
import { cardRoutes } from './routes/cards.ts'

const server = fastify()

server.register(cors, {
  origin: true,
})

server.register(jwt, {
  secret: 'fidelese'
})

server.register(multipart, {
  attachFieldsToBody: 'keyValues',
  onFile: (part: any) => {
    part.value = {
      filename: part.filename,
      mimetype: part.mimetype,
      data: part.toBuffer()
    }
  }
})

server.register(fastifyStatic, {
  root: join(__dirname, '../uploads'),
  prefix: '/uploads/',
});

server.register(authRoutes)
server.register(adRoutes)
server.register(cardRoutes)

const port = Number(process.env.PORT)
server
  .listen({
    port,
    host: '0.0.0.0',
  })
  .then(() => {
    console.log(`Server running on http://localhost:${port}`)
  })
