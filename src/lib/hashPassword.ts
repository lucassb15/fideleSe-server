import crypto from 'crypto'

/**
 * Hashes the password using the SHA512 algorithm and a randomly generated salt value.
 * @param password - Password string to be hashed.
 * @returns Object containing the hashed password and the salt value for it.
 */
export function hashPassword(password: string): { hash: string; salt: string } {
    const salt = crypto.randomBytes(16).toString('hex')
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')

    return { hash, salt }
}

/**
 * Verifies the provided password string by hashing it using the same salt value and comparing it with the hash stored in the database.
 * @param password Password string to verify against the hash stored in databse.
 * @param salt The salt value used for hashing.
 * @param hash The hashed password retrieved from database to be checked.
 * @returns `true` if the password string matches the hashed version, `false` if it doesn't.
 */
export function verifyPassword(password: string, salt: string, hash: string): boolean {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex') === hash
}