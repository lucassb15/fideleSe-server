import { FastifyInstance } from "fastify"
import { z } from 'zod'
import { PrismaClient } from "@prisma/client"
import { saveImage } from "../lib/imageHandling"

const prisma = new PrismaClient()

export async function adRoutes(app: FastifyInstance) {
    app.post('/create/ad', async (req, res) => {
        var filePath: string | undefined
        const { name, price, companyId, image } = z.object({
            name: z.string(),
            price: z.coerce.number().positive(),
            companyId: z.string(),
            image: z.any().optional().refine((file) => !!file && file.mimetype.startsWith("image"), {
                message: "Only images are allowed to be sent.",
            })
        }).parse(req.body)
        if (image) {
            filePath = await saveImage(image.filename, image.data, companyId)
        }

        try {
            const ad = await prisma.ad.create({
                data: {
                    name,
                    price,
                    image: filePath,
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
            var ads = await prisma.ad.findMany({
                where: { companyId }
            })
        } else {
            var ads = await prisma.ad.findMany({
                orderBy: {
                    createdAt: 'desc'
                }
            })
        }
        return ads
    })

    app.put('/edit/ad', async (req, res) => {
        var filePath: string | undefined = undefined
        const { adId, companyId, name, price, image } = z.object({
            adId: z.string(),
            companyId: z.string(),
            name: z.string(),
            price: z.coerce.number().positive(),
            image: z.any().optional().refine((file) => !!file && file.mimetype.startsWith("image"), {
                message: "Only images are allowed to be sent.",
            })
        }).parse(req.body)
        if (image) {
            filePath = await saveImage(image.filename, image.data, companyId)
        }

        try {
            if (image) {
                await prisma.ad.update({
                    where: { id: adId },
                    data: {
                        name,
                        price,
                        image: filePath
                    }
                })
            } else {
                await prisma.ad.update({
                    where: { id: adId },
                    data: {
                        name,
                        price
                    }
                })
            }
        } catch (err) {
            console.log(err)
        }

    })

    app.delete('/delete/ad/:adId', async (req, res) => {
        const { adId } = z.object({
            adId: z.string()
        }).parse(req.params)

        await prisma.ad.delete({
            where: { id: adId }
        })
    })
}