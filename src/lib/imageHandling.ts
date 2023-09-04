import { existsSync, mkdirSync, writeFileSync } from "fs"
import { join } from "path"

export async function saveImage(filename: string, data: Promise<any>, companyId?: string) {
    var relativePath: string | undefined, filePath: string | undefined
    if (companyId) {
        relativePath = join('uploads', companyId, Date.now().toString() + filename)
        if (!existsSync(join(__dirname, '../../uploads', companyId))) {
            mkdirSync(join(__dirname, '../../uploads', companyId), { recursive: true })
        }
    } else {
        relativePath = join('uploads/logos', Date.now().toString() + filename)
        if (!existsSync(join(__dirname, '../../uploads/logos'))) {
            mkdirSync(join(__dirname, '../../uploads/logos'), { recursive: true })
        }
    }
    filePath = join(__dirname, '../../', relativePath)
    data.then((buffer: string) => { writeFileSync(filePath!, buffer) })
    return relativePath.replace(/\\/g, '/')
}