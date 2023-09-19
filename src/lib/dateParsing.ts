// funcao para o front-end
// export function dateToParams(date: Date) {
//     return date.toISOString().substring(0, 10).split('-').join('')
// }
/**
 * Parses the request's param date string and returns it in a `Date` object.
 * @param params The `Date` value in string format.
 * @param end If `true`, the returned `Date` object's hours will be set to `23:59:59` (end of the day).
 * @returns A new `Date` object from the provided string.
 */
export function parseDate(params: string, end?: boolean) {
    const year = params.substring(0, 4)
    const month = params.substring(4, 6)
    const day = params.substring(6, 8)
    const date = new Date([year, month, day].join('/'))

    if (end) date.setUTCHours(23, 59, 59, 999)

    return date
}