import { FastifyInstance } from "fastify"
import { z } from 'zod'
import { PrismaClient, StatType } from "@prisma/client"
import { saveImage } from "../lib/imageHandling"

const prisma = new PrismaClient()

export async function cardRoutes(app: FastifyInstance) {
    // #region companyCard
    app.post('/create/card', async (req, res) => {
        var filePath: string | undefined = undefined
        const { companyId, name, maxPoints, image } = z.object({
            companyId: z.string(),
            name: z.string(),
            maxPoints: z.coerce.number().positive(),
            image: z.any().optional().refine((file) => !!file && file.mimetype.startsWith("image"), {
                message: "Somente arquivos de imagem são permitidos",
            })
        }).parse(req.body)

        if (image) {
            filePath = await saveImage(image.filename, image.data, companyId)
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
            maxPoints: z.coerce.number().positive(),
            image: z.any().optional().refine((file) => !!file && file.mimetype.startsWith("image"), {
                message: "Somente arquivos de imagem são permitidos",
            })
        }).parse(req.body)

        if (image) {
            filePath = await saveImage(image.filename, image.data, companyId)
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
            var card = await prisma.companyCard.findMany({
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

    app.delete('/delete/card/:cardId', async (req, res) => {
        const { cardId } = z.object({
            cardId: z.string()
        }).parse(req.params)

        await prisma.companyCard.delete({
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
            await prisma.stat.create({
                data: {
                    companyCard: { connect: { id: companyCardId } }
                }
            })
        } catch (err) {
            console.log(err)
        }
    })

    app.put('/edit/loyalty', async (req, res) => {
        const { cardId, companyCardId, token } = z.object({
            cardId: z.string(),
            companyCardId: z.string(),
            token: z.string().transform((t) => app.jwt.verify(t)).pipe(z.object({age: z.coerce.date()}))
        }).parse(req.body)
        const companyCard = await prisma.companyCard.findUnique({ where: { id: companyCardId } })
        const card = await prisma.userCard.findUnique({ where: { id: cardId } })

        if ((Date.now() - token.age.getTime()) < 300000) {
            if (card!.currentPoints == companyCard!.maxPoints) {
                await prisma.userCard.update({
                    where: { id: cardId },
                    data: {
                        currentPoints: 0,
                        xCompleted: card!.xCompleted + 1
                    }
                })
                await prisma.stat.create({
                    data: {
                        companyCard: { connect: { id: companyCardId } },
                        type: StatType.COMPLETION
                    }
                })
            } else {
                await prisma.userCard.update({
                    where: { id: cardId },
                    data: {
                        currentPoints: card!.currentPoints + 1
                    }
                })
                await prisma.stat.create({
                    data: {
                        companyCard: { connect: { id: companyCardId } }
                    }
                })
            }
        } else {
            return res.status(403).send({ message: 'Token inválido'})
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