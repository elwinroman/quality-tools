import { ERROR_CODES, AUTH_ERROR_CODES } from '../constants/error-codes.js'
import { isLoggedIn } from '../utils/verify-session.util.js'

export class ObjectController {
  constructor ({ objectModel }) {
    this.objectModel = objectModel
  }

  // Ruta protegida
  getObjectDefinition = async (req, res) => {
    const { credentials } = req.session

    if (!isLoggedIn(credentials)) {
      const { statusCode } = AUTH_ERROR_CODES.TOKEN_INVALID
      return res.status(statusCode).json(AUTH_ERROR_CODES.TOKEN_INVALID)
    }

    const { id } = req.params

    try {
      const result = await this.objectModel.getObjectDefinition({ id, credentials })
      if (result.error) {
        res.status(result.statusCode).json(result)
        return
      }

      res.json(result)
    } catch (err) {
      const { statusCode } = ERROR_CODES.INTERNAL_SERVER_ERROR
      res.status(statusCode).json({ ...ERROR_CODES.INTERNAL_SERVER_ERROR, originalError: err.originalError })
    }
  }

  // Ruta protegida
  getObjectDescription = async (req, res) => {
    const { credentials } = req.session

    if (!isLoggedIn(credentials)) {
      const { statusCode } = AUTH_ERROR_CODES.TOKEN_INVALID
      return res.status(statusCode).json(AUTH_ERROR_CODES.TOKEN_INVALID)
    }

    const { id } = req.params

    try {
      const result = await this.objectModel.getObjectDescription({ id, credentials })
      if (result.error) {
        res.status(result.statusCode).json(result)
        return
      }

      res.json(result)
    } catch (err) {
      const { statusCode } = ERROR_CODES.INTERNAL_SERVER_ERROR
      res.status(statusCode).json({ ...ERROR_CODES.INTERNAL_SERVER_ERROR, originalError: err.originalError })
    }
  }

  // Ruta protegida
  findObject = async (req, res) => {
    const { credentials } = req.session

    if (!isLoggedIn(credentials)) {
      const { statusCode } = AUTH_ERROR_CODES.TOKEN_INVALID
      return res.status(statusCode).json(AUTH_ERROR_CODES.TOKEN_INVALID)
    }

    const { name } = req.params

    try {
      const result = await this.objectModel.findObject({ name, credentials })
      if (result.error) {
        res.json(result)
        return
      }

      res.json(result)
    } catch (err) {
      const { statusCode } = ERROR_CODES.INTERNAL_SERVER_ERROR
      res.status(statusCode).json({ ...ERROR_CODES.INTERNAL_SERVER_ERROR, originalError: err.originalError })
    }
  }
}
