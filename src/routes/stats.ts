import { FastifyInstance } from "fastify"
import { z } from 'zod'
import { PrismaClient, StatType } from "@prisma/client"
import { parseDate } from "../lib/dateParsing"

const prisma = new PrismaClient()

export async function statRoutes(app: FastifyInstance) {
    app.get('/stats/:companyId/:type/:startDate-:endDate', async (req, res) => {
        const { companyId, type, startDate, endDate } = z.object({
            companyId: z.string(),
            type: z.string().default("all"),
            startDate: z.string().transform((dateString) => parseDate(dateString)).pipe(z.date()),
            endDate: z.string().transform((dateString) => parseDate(dateString)).pipe(z.date())
        }).parse(req.params)

        if (type == "completed") {
            var stats = await prisma.stat.findMany({
                where: { companyCard: { companyId }, type: StatType.COMPLETION, date: { gte: startDate, lte: endDate } }
            })
        } else if (type == "point") {
            var stats = await prisma.stat.findMany({
                where: { companyCard: { companyId }, type: StatType.POINT, date: { gte: startDate, lte: endDate } }
            })
        } else {
            var stats = await prisma.stat.findMany({
                where: { companyCard: { companyId }, date: { gte: startDate, lte: endDate } }
            })
        }

        return stats
    })
}