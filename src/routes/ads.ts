import { FastifyInstance } from "fastify"
import { z } from 'zod'
import { PrismaClient } from "@prisma/client"
import { saveImage } from "../lib/imageHandling"

const prisma = new PrismaClient()

export async function adRoutes(app: FastifyInstance) {
    app.post('/create/ad', async (req, res) => {
        let filePath: string
        const { companyId, image } = z.object({
            companyId: z.string(),
            image: z.any().refine((file) => !!file && file.mimetype.startsWith("image"), {
                message: "Somente arquivos de imagem são permitidos",
            })
        }).parse(req.body)
        filePath = await saveImage(image.filename, image.data, companyId)

        try {
            await prisma.ad.create({
                data: {
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
        let filePath: string
        const { adId, companyId, image } = z.object({
            adId: z.string(),
            companyId: z.string(),
            image: z.any().refine((file) => !!file && file.mimetype.startsWith("image"), {
                message: "Somente arquivos de imagem são permitidos",
            })
        }).parse(req.body)
        filePath = await saveImage(image.filename, image.data, companyId)

        try {
            await prisma.ad.update({
                where: { id: adId },
                data: {
                    image: filePath
                }
            })
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