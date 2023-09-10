// funcao para o front-end
// export function dateToParams(date: Date) {
//     return date.toISOString().substring(0, 10).split('-').join('')
// }

export function parseDate(params: string) {
    const year = params.substring(0, 4)
    const month = params.substring(4, 6)
    const day = params.substring(6, 8)

    return new Date([year, month, day].join('/'))
}