/**
 *
 * Encriptador/desencriptador basado en criptocode (python package)
 * https://github.com/gdavid7/cryptocode
 *
 */

import crypto from 'node:crypto'

import { DecryptionException } from '@core/exceptions'

import { PASS_PHRASE } from '@/config/enviroment'

const passPhrase = PASS_PHRASE

interface ScryptOptions {
  N: number // trabajo (CPU/memoria)
  r: number // bloques
  p: number // paralelismo
  keyLen: number // longitud de la clave
}

class CryptoCode {
  private AES_BLOCK_SIZE: number
  private SCRYPT_OPTIONS: ScryptOptions

  constructor() {
    this.AES_BLOCK_SIZE = 16 // tamaño del bloque para AES
    this.SCRYPT_OPTIONS = {
      N: 2 ** 14, // trabajo (CPU/memoria)
      r: 8, // bloques
      p: 1, // paralelismo
      keyLen: 32, // longitud de la clave
    }
  }

  encrypt(message: string): string {
    /** genera un salt aleatoria de 16 caracteres */
    const salt = crypto.randomBytes(this.AES_BLOCK_SIZE)
    const privateKey = crypto.scryptSync(passPhrase, salt, this.SCRYPT_OPTIONS.keyLen, {
      cost: this.SCRYPT_OPTIONS.N,
      blockSize: this.SCRYPT_OPTIONS.r,
      parallelization: this.SCRYPT_OPTIONS.p,
    })

    /** genera un IV aleatorio (que sea aleatorio lo hace más seguro) */
    const iv = crypto.randomBytes(this.AES_BLOCK_SIZE)
    const cipher = crypto.createCipheriv('aes-256-gcm', privateKey, iv)
    const cipherText = Buffer.concat([cipher.update(message, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()

    /** genera el string encriptado */
    const encryptedString = [cipherText.toString('base64'), salt.toString('base64'), iv.toString('base64'), tag.toString('base64')].join(
      '*',
    )

    return encryptedString
  }

  decrypt(encryptedString: string): string {
    try {
      /** separa el string en partes */
      const [cipherTextB64, saltB64, nonceB64, tagB64] = encryptedString.split('*')

      /** decodifica las partes de Base64 */
      const cipherText = Buffer.from(cipherTextB64, 'base64')
      const salt = Buffer.from(saltB64, 'base64')
      const nonce = Buffer.from(nonceB64, 'base64')
      const tag = Buffer.from(tagB64, 'base64')

      const privateKey = crypto.scryptSync(passPhrase, salt, this.SCRYPT_OPTIONS.keyLen, {
        cost: this.SCRYPT_OPTIONS.N,
        blockSize: this.SCRYPT_OPTIONS.r,
        parallelization: this.SCRYPT_OPTIONS.p,
      })

      const decipher = crypto.createDecipheriv('aes-256-gcm', privateKey, nonce)
      decipher.setAuthTag(tag)

      /** desencripta el texto */
      const decrypted = Buffer.concat([decipher.update(cipherText), decipher.final()])

      return decrypted.toString('utf8')
    } catch (_err: unknown) {
      // se devuelve un error de dominio para evitar exponer data sensible (credenciales)
      throw new DecryptionException(encryptedString)
    }
  }
}

export default new CryptoCode()
