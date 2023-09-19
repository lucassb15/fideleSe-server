import { FastifyInstance } from "fastify"
import { z } from 'zod'
import { Password, PrismaClient } from "@prisma/client"
import { saveImage } from "../lib/imageHandling"
import { hashPassword } from "../lib/hashPassword"

const prisma = new PrismaClient()

export async function companyRoutes(app: FastifyInstance) {
    app.post('/edit/company', async (req, res) => {
        let filePath: string | undefined
        let hashedPassword: Password | undefined
        const { companyId, name, address, logo, password, isPremium } = z.object({
            companyId: z.string(),
            name: z.string().optional(),
            address: z.string().optional(),
            logo: z.any().optional().refine((file) => !!file && file.mimetype.startsWith("image"), {
                message: "Somente arquivos de imagem são permitidos",
            }),
            password: z.string().optional(),
            confirmPassword: z.string().optional(),
            isPremium: z.boolean().optional()
        }).refine((data) => data.password === data.confirmPassword, {
            message: 'As senhas não batem',
            path: ['password', 'confirmPassword']
        }).parse(req.body)

        if (password) {
            hashedPassword = hashPassword(password)
        }

        if (logo) {
            filePath = await saveImage(logo.filename, logo.data)
        }

        try {
            const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } })

            if (company.isPremium != isPremium) {
                await prisma.ad.updateMany({ where: { companyId },
                    data: {
                        priority: isPremium
                    }
                })
            }

            await prisma.company.update({ where: { id: companyId },
                data: {
                    name: name || company.name,
                    address: address || company.address,
                    logo: filePath || company.logo,
                    password: hashedPassword || company.password,
                    isPremium: isPremium || company.isPremium
                }
            })
        } catch (err) {
            console.log(err)
        }
    })
}