import '@core/sentry/instruments'

import { handleErrorMiddleware, loggerContextMiddleware, routeNotFoundMiddleware } from '@core/middlewares'
import { swaggerRouter } from '@core/swagger/swagger.route'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { Express, json, Router } from 'express'

import { NODE_ENV } from './enviroment'
import { NetworkController } from './network.controller'

interface Options {
  port: number
  routes: Router
  allowedOrigins: string[]
}

export class Server {
  public app: Express = express()
  private port: number
  private routes: Router
  private allowedOrigins: string[]

  constructor(options: Options) {
    const { port, routes, allowedOrigins } = options
    this.port = port
    this.routes = routes
    this.allowedOrigins = [...allowedOrigins]
  }

  public start() {
    this.app.use(
      cors({
        credentials: true,
        origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
          // mismo origen, curl
          if (!origin) return callback(null, true)

          const url = new URL(origin)
          const domain = url.hostname

          if (NODE_ENV === 'development' && domain === 'localhost') return callback(null, true)

          const isAllowed = this.allowedOrigins.some(allowedOrigin => {
            return allowedOrigin.includes(domain)
          })

          // si no se encuentra en la lista de origenes permitidos se deniega el acceso
          if (!isAllowed) {
            const msg = `Política CORS: Acceso no autorizado para ${origin}`
            return callback(new Error(msg), false)
          }
          return callback(null, true)
        },
      }),
    )
    this.app.use(loggerContextMiddleware)
    this.app.use(json())
    this.app.use(cookieParser())

    this.app.use('/api/docs', swaggerRouter())
    this.app.use(this.routes)
    this.app.use(routeNotFoundMiddleware)
    this.app.use(handleErrorMiddleware)

    const network = new NetworkController(this.port)
    this.app.listen(this.port, network.gethost, () => {
      if (process.env.NODE_ENV !== 'production') network.printNetworks()
    })
  }
}
