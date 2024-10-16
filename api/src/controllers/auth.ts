import 'dotenv/config'

import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

import { COMMON_ERROR_CODES } from '@/constants'
import { AuthModel } from '@/models/auth'
import { Credentials, MyCustomError } from '@/models/schemas'
import { encrypt } from '@/utils'

export class AuthController {
  login = async (req: Request, res: Response, next: NextFunction) => {
    const { server, dbname, username, password }: Credentials = req.body
    const credentials = { server, dbname, username, password: encrypt(password) }
    const authModel = new AuthModel(credentials)

    try {
      const result = await authModel.login()
      const token = await jwt.sign({ credentials }, process.env.JWT_SECRET as string, { expiresIn: '48h' })

      return res
        .status(200)
        .cookie('access_token', token, {
          httpOnly: true, // cookie solo accesible por el servidor
          // secure: process.env.NODE_ENV === 'production', // cookie disponible solo en https
          secure: false,
          sameSite: 'strict', // cookie no disponible para otros sitios
          maxAge: 1000 * 60 * 60 * 48, // cookie expira en 1 hora
        })
        .json({ status: 'success', statusCode: 200, message: 'Autenticación correcta', data: result })
    } catch (err) {
      next(err)
    }
  }

  logout = async (req: Request, res: Response, next: NextFunction) => {
    const { isSessionActive } = req.session

    try {
      if (!isSessionActive) throw new MyCustomError(COMMON_ERROR_CODES.SESSIONALREADYCLOSED)
      return res
        .clearCookie('access_token')
        .status(200)
        .json({ status: 'success', statusCode: 200, message: 'Sesión cerrada correctamente' })
    } catch (err) {
      next(err)
    }
  }

  checkSession = async (req: Request, res: Response, next: NextFunction) => {
    const { isSessionActive } = req.session

    try {
      if (!isSessionActive) throw new MyCustomError(COMMON_ERROR_CODES.SESSIONALREADYCLOSED)
      return res.status(200).json({ status: 'success', statusCode: 200, message: 'Sesión activa' })
    } catch (err) {
      next(err)
    }
  }
}
