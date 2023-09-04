import { FastifyInstance } from "fastify"
import { z } from 'zod'
import { PrismaClient } from "@prisma/client"
import { existsSync, mkdirSync, writeFileSync } from "fs"
import { join } from "path"
import fastifyStatic from "@fastify/static"

const prisma = new PrismaClient()

export async function adRoutes(app: FastifyInstance) {
    app.register(fastifyStatic, {
        root: join(__dirname, '../../uploads'),
        prefix: '/uploads/',
    });

    app.post('/create/ad', async (req, res) => {
        var filePath: string | undefined = undefined
        var relativePath: string | undefined
        const { name, price, companyId, image } = z.object({
            name: z.string(),
            price: z.coerce.number().positive(),
            companyId: z.string(),
            image: z.any().optional().refine((file) => !!file && file.mimetype.startsWith("image"), {
                message: "Only images are allowed to be sent.",
            })
        }).parse(req.body)
        if (image) {
            relativePath = join('uploads', companyId, Date.now().toString() + image.filename)
            filePath = join(__dirname, '../../', relativePath)
            if (!existsSync(join(__dirname, '../../uploads', companyId))) {
                mkdirSync(join(__dirname, '../../uploads', companyId), { recursive: true })
            }
            image.data.then((buffer: string) => { writeFileSync(filePath!, buffer) })
        }

        let dbImagePath: string | undefined;
        if (relativePath) {
            dbImagePath = relativePath.replace(/\\/g, '/');
        }

        try {
            const ad = await prisma.ad.create({
                data: {
                    name,
                    price,
                    image: dbImagePath,
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
            filePath = join(__dirname, '../../uploads', companyId, Date.now().toString() + image.filename)
            if (!existsSync(join(__dirname, '../../uploads', companyId))) {
                mkdirSync(join(__dirname, '../../uploads', companyId), { recursive: true })
            }
            image.data.then((buffer: string) => { writeFileSync(filePath!, buffer) })
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

    app.delete('/delete/:adId', async (req, res) => {
        const { adId } = z.object({
            adId: z.string()
        }).parse(req.params)

        await prisma.ad.delete({
            where: { id: adId }
        })
    })
}