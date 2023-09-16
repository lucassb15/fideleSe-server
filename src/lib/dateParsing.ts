// funcao para o front-end
// export function dateToParams(date: Date) {
//     return date.toISOString().substring(0, 10).split('-').join('')
// }
/**
 * Parses the request's param date string and returns it in a `Date` object.
 * @param params The `Date` value in string format.
 * @returns A new `Date` object from the provided string.
 */
export function parseDate(params: string) {
    const year = params.substring(0, 4)
    const month = params.substring(4, 6)
    const day = params.substring(6, 8)

    return new Date([year, month, day].join('/'))
}