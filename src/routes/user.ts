import { FastifyInstance } from "fastify"
import { z } from 'zod'
import { Password, PrismaClient } from "@prisma/client"
import { hashPassword } from "../lib/hashPassword"

const prisma = new PrismaClient()

export async function userRoutes(app: FastifyInstance) {
    app.put('/edit/user', async (req, res) => {
        let hashedPassword: Password | undefined
        const { userId, name, password } = z.object({
            userId: z.string(),
            name: z.string().optional(),
            password: z.string().optional(),
            confirmPassword: z.string().optional()
        }).refine((data) => data.password === data.confirmPassword, {
            message: 'As senhas não batem',
            path: ['password', 'confirmPassword']
        }).parse(req.body)

        if (password) {
            hashedPassword = hashPassword(password)
        }

        try {
            const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })

            await prisma.user.update({ where: { id: userId },
                data: {
                    name: name || user.name,
                    password: hashedPassword || user.password
                }
            })
        } catch (err) {
            console.log(err)
        }
    })

    app.put('/disable/user', async (req, res) => {
      const { userId } = z.object({
        userId: z.string()
      }).parse(req.body)

      try {
        await prisma.user.update({ where: { id: userId },
          data: {
            isActive: false
          }
        })
      } catch (err) {
        console.log(err)
      }
    })

    app.put('/enable/user', async (req, res) => {
      const { userId } = z.object({
        userId: z.string()
      }).parse(req.body)

      try {
        await prisma.user.update({ where: { id: userId },
          data: {
            isActive: true
          }
        })
      } catch (err) {
        console.log(err)
      }
    })
}