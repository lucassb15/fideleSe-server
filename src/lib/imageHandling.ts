import { existsSync, mkdirSync, writeFileSync } from "fs"
import { join } from "path"

/**
 * Saves the provided image data to a file and returns the relative path to it.
 * @param filename The name of the image to be saved.
 * @param data The image data.
 * @param companyId The id of the company saving the image. If not provided, the image will be saved on the 'logos' folder.
 * @returns The relative path to where the image was saved.
 */
export async function saveImage(filename: string, data: Promise<Buffer>, companyId?: string) {
    let relativePath: string, filePath: string
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
    data.then((buffer: Buffer) => { writeFileSync(filePath, buffer) })
    return relativePath.replace(/\\/g, '/')
}