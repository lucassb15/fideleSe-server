import { FastifyInstance } from "fastify"
import { hashPassword, verifyPassword } from "../lib/hashPassword"
import { z } from 'zod'
import { PrismaClient } from "@prisma/client"
import { Roles } from "../lib/enums"

const prisma = new PrismaClient()

export async function authRoutes(app: FastifyInstance) {
    //register user
    app.post('/register/user', async (req, res) => {
        const bodySchema = z.object({
            name: z.string(),
            email: z.string().email(),
            password: z.string(),
            confirmPassword: z.string(),
            isEmployee: z.boolean().default(false),
            companyId: z.string().optional()
        }).refine((data) => data.password === data.confirmPassword, {
            message: 'Passwords don\'t match',
            path: ['password', 'confirmPassword']
        })
        const { name, email, password, isEmployee, companyId } = bodySchema.parse(req.body)
        const { hash, salt } = hashPassword(password)

        try {
            let user = await prisma.user.findUnique({ where: { email } }) || await prisma.company.findUnique({ where: { email } })

            if (user) {
                return res.status(500).send({ message: 'Email already registered' })
            } else {
                user = await prisma.user.create({ data: {
                    name,
                    email,
                    password: { hash, salt },
                    isEmployee,
                    companyId
                } })
                if (user.companyId) {
                    await prisma.company.update({
                        where: { id: user.companyId },
                        data: { employeeId: user.id }
                    })
                }
            }
        } catch (err) {
            console.log(err)
        }
    })

    //register company
    app.post('/register/company', async (req, res) => {
        const bodySchema = z.object({
            name: z.string(),
            email: z.string().email(),
            password: z.string(),
            confirmPassword: z.string(),
            logo: z.string().optional()
        }).refine((data) => data.password === data.confirmPassword, {
            message: 'Passwords don\'t match',
            path: ['password', 'confirmPassword']
        })
        const { name, email, password, logo } = bodySchema.parse(req.body)
        const { hash, salt } = hashPassword(password)

        try {
            let company = await prisma.user.findUnique({ where: { email } }) || await prisma.company.findUnique({ where: { email } })

            if (company) {
                return res.status(500).send({ message: 'Email already registered' })
            } else {
                company = await prisma.company.create({ data: {
                    name,
                    email,
                    password: { hash, salt }
                } })
            }
        } catch (err) {
            console.log(err)
        }
    })

    //signin
    app.post('/signin', async (req, res) => {
        const { email, password } = z.object({
            email: z.string().email(),
            password: z.string()
        }).parse(req.body)
        const user = await prisma.user.findUnique({ where: { email } })
        const company = await prisma.company.findUnique({ where: { email } })

        if (user && verifyPassword(password, user.password.salt, user.password.hash)) {
            const { password, ...rest } = user
            const userRole = user.isEmployee ? Roles.Employee : Roles.Customer;
            const accessTokenPayload = { ...rest, role: userRole }
            const accessToken = app.jwt.sign(accessTokenPayload, { expiresIn: '7d' })

            return res.status(200).send({
                user: {
                    name: user.name,
                    email: user.email,
                    role: userRole
                },
                accessToken
            })
        } else if (company && verifyPassword(password, company.password.salt, company.password.hash)) {
            const { password, ...rest } = company
            const accessTokenPayload = { ...rest, role: Roles.Owner }
            const accessToken = app.jwt.sign(accessTokenPayload, { expiresIn: '7d' })

            return res.status(200).send({
                company: {
                    name: company.name,
                    email: company.email,
                    role: Roles.Owner
                },
                accessToken
            })
        } else {
            return res.status(400).send({
                message: 'Invalid email or password',
            })
        }
    })
}