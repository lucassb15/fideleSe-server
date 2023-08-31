import { FastifyInstance } from "fastify"
import { z } from 'zod'
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function adRoutes(app: FastifyInstance) {
    app.post('/create/ad', async (req, res) => {
        const { name, price, image, companyId } = z.object({
            name: z.string(),
            price: z.number().positive(),
            image: z.string(),
            companyId: z.string()
        }).parse(req.body)

        try {
            const ad = await prisma.ad.create({
                data: {
                    name,
                    price,
                    image,
                    company: { connect: { id: companyId } }
                }
            })
        } catch (err) {
            console.log(err)
        }
    })

    app.get('/ads/:companyId?', async (req, res) => {
        const { companyId } = z.object({
            companyId: z.string().optional()
        }).parse(req.params)

        if (companyId) {
            const ads = await prisma.ad.findMany({
                where: { companyId }
            })
            return ads
        } else {
            const ads = await prisma.ad.findMany({
                orderBy: {
                    createdAt: 'desc'
                }
            })
            return ads
        }
    })
}