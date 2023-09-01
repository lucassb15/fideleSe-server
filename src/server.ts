import fastify from 'fastify'
import jwt from '@fastify/jwt'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import 'dotenv/config'

import { authRoutes } from './routes/auth'
import { adRoutes } from './routes/ads'

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

server.register(authRoutes)
server.register(adRoutes)

const port = Number(process.env.PORT)
server
  .listen({
    port,
    host: '0.0.0.0',
  })
  .then(() => {
    console.log(`Server running on http://localhost:${port}`)
  })