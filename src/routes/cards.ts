import { FastifyInstance } from "fastify"
import { z } from 'zod'
import { PrismaClient } from "@prisma/client"
import { existsSync, mkdirSync, writeFileSync } from "fs"
import { join } from "path"
import { connect } from "http2"

const prisma = new PrismaClient()

export async function cardRoutes(app: FastifyInstance) {
    // #region companyCard
    app.post('/create/card', async (req, res) => {
        var filePath: string | undefined = undefined
        const { companyId, name, maxPoints, image } = z.object({
            companyId: z.string(),
            name: z.string(),
            maxPoints: z.number().positive(),
            image: z.any().optional().refine((file) => !!file && file.mimetype.startsWith("image"), {
                message: "Only images are allowed to be sent.",
            })
        }).parse(req.body)

        if (image) {
            filePath = join(__dirname, '../../uploads', companyId, Date.now().toString() + image.filename)
            if (!existsSync(join(__dirname, '../../uploads', companyId))) {
                mkdirSync(join(__dirname, '../../uploads', companyId), { recursive: true })
            }
            image.data.then((buffer: string) => { writeFileSync(filePath!, buffer) })
        }

        try {
             await prisma.companyCard.create({
                data: {
                    name,
                    maxPoints,
                    image: filePath,
                    company: { connect: { id: companyId } }
                }
            })
        } catch (err) {
            console.log(err)
        }
    })

    app.put('/edit/card', async (req, res) => {
        var filePath: string | undefined = undefined
        const { cardId, companyId, name, maxPoints, image } = z.object({
            cardId: z.string(),
            companyId: z.string(),
            name: z.string(),
            maxPoints: z.number().positive(),
            image: z.any().optional().refine((file) => !!file && file.mimetype.startsWith("image"), {
                message: "Only images are allowed to be sent.",
            })
        }).parse(req.body)

        if (image) {
            filePath = join(__dirname, '../../uploads', companyId, Date.now().toString() + image.filename)
            if (!existsSync(join(__dirname, '../../uploads', companyId))) {
                mkdirSync(join(__dirname, '../../uploads', companyId), { recursive: true })
            }
            image.data.then((buffer: string) => { writeFileSync(filePath!, buffer) })
        }

        try {
            if (image) {
                await prisma.companyCard.update({
                    where: { id: cardId },
                    data: {
                        name,
                        maxPoints,
                        image: filePath
                    }
                })
            } else {
                await prisma.companyCard.update({
                    where: { id: cardId },
                    data: {
                        name,
                        maxPoints
                    }
                })
            }
        } catch (err) {
            console.log(err)
        }
    })

    app.get('/cards/:companyId?', async (req, res) => {
        const { companyId } = z.object({
            companyId: z.string().optional()
        }).parse(req.params)

        if (companyId) {
            var card = await prisma.companyCard.findFirst({
                where: { companyId }
            })
            return card
        } else {
            var cards = await prisma.companyCard.findMany({
                orderBy: {
                    createdAt: 'desc'
                }
            })
            return cards
        }
    })

    app.delete('/delete/:cardId', async (req, res) => {
        const { cardId } = z.object({
            cardId: z.string()
        }).parse(req.params)

        await prisma.ad.delete({
            where: { id: cardId }
        })
    })
    // #endregion

    app.post('/create/loyalty', async (req, res) => {
        const { customerId, companyCardId } = z.object({
            customerId: z.string(),
            companyCardId: z.string()
        }).parse(req.body)

        try {
            await prisma.userCard.create({
                data:{
                    customer: { connect: { id: customerId } },
                    companyCard: { connect: { id: companyCardId } }
                }
            })
        } catch (err) {
            console.log(err)
        }
    })

    app.put('/edit/loyalty', async (req, res) => {
        const { cardId, companyCardId, currentPoints, xCompleted } = z.object({
            cardId: z.string(),
            companyCardId: z.string(),
            currentPoints: z.number().positive(),
            xCompleted: z.number().positive()
        }).parse(req.body)
        const companyCard = await prisma.companyCard.findUnique({ where: { id: companyCardId } })

        if (currentPoints == companyCard!.maxPoints) {
            await prisma.userCard.update({
                where: { id: cardId },
                data: {
                    currentPoints: 0,
                    xCompleted: xCompleted + 1
                }
            })
        } else {
            await prisma.userCard.update({
                where: { id: cardId },
                data: {
                    currentPoints: currentPoints + 1
                }
            })
        }
    })

    app.get('/loyalty/:customerId', async (req, res) => {
        const { customerId } = z.object({
            customerId: z.string()
        }).parse(req.params)

        const cards = await prisma.userCard.findMany({
            where: { customerId }
        })

        return cards
    })
}