import crypto from 'node:crypto'

// Value Object para el hashId
export class UserHashId {
  private constructor(private readonly value: string) {}

  private static readonly SIZE_MD5_HEX: number = 32

  static create(user: string, host: string, hash?: string): UserHashId {
    if (hash === undefined || hash === null) return new UserHashId(this.generate(user, host))

    if (hash.length !== this.SIZE_MD5_HEX) {
      throw new Error('[auth] Hash inválido, debe tener 32 caracteres.')
    }

    if (hash !== this.generate(user, host)) {
      throw new Error(`[auth] Hash inválido para el usuario '${user}', se ha creado incorrectamente o sido manipulado en BD.`)
    }

    return new UserHashId(hash)
  }

  /**
   * Genera un hash MD5 único basado en el `server` y el `username`.
   *
   * @param {string} username - Nombre del usuario.
   * @param {string} hostname - Nombre o identificador del host (no el alias).
   *
   * @returns {string} El hash MD5 de 32 caracteres generado a partir de la concatenación de `server` y `username`.
   */
  static generate(user: string, host: string): string {
    const username = user.toLowerCase()

    return crypto
      .createHash('md5')
      .update(host + username, 'utf8')
      .digest('hex')
  }

  get getValue(): string {
    return this.value
  }
}
