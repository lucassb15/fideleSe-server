import { FastifyInstance } from "fastify"
import { z } from "zod"
import { toDataURL } from "qrcode"

export async function qrcodeRoutes(app: FastifyInstance) {
    app.post('/generate/qrcode', async (req, res) => {
        const { cardId, companyCardId } = z.object({
            cardId: z.string(),
            companyCardId: z.string()
        }).parse(req.body)
        const token = app.jwt.sign({ age: Date.now().toString() }, { expiresIn: '1m' })
        const payload = JSON.stringify({ cardId, companyCardId, token })

        try {
            const qrcode = await toDataURL(payload)

            return res.status(200).send(qrcode)
        } catch (err) {
            return res.status(500).send(err)
        }
    })
}