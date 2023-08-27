import fastify from 'fastify'
import jwt from '@fastify/jwt'

import { authRoutes } from './routes/auth'

const server = fastify()

server.register(jwt, {
  secret: 'fidelese'
})

server.register(authRoutes)

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})