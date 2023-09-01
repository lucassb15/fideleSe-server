import { FastifyInstance } from "fastify"
import { string, z } from 'zod'
import { PrismaClient } from "@prisma/client"
import { existsSync, mkdirSync, writeFileSync } from "fs"
import { join } from "path"

const prisma = new PrismaClient()

export async function adRoutes(app: FastifyInstance) {
    app.post('/create/ad', async (req, res) => {
        var filePath: string | undefined = undefined
        const { name, price, companyId, image } = z.object({
            name: z.string(),
            price: z.coerce.number().positive(),
            companyId: z.string(),
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
}