import { connection } from '../config/database.js'
import { ERROR_CODES } from '../constants/error-codes.js'

export class AuthModel {
  static async login ({ credentials }) {
    const { request } = await connection({ credentials })

    try {
      const stmt = 'SELECT 1 AS login'
      const res = await request.query(stmt)

      return res
    } catch (err) {
      const { number, message } = err.originalError.info
      return { ...ERROR_CODES.EREQUEST, originalError: { number, message } }
    }
  }
}
