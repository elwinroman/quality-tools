import { BaseError } from '@core/exceptions/base-error'
import { InfrastructureError } from '@core/infrastructure-error.exception'
import { logger } from '@core/logger/pino-instance'
import { mapMSSQLError } from '@core/store/map-mssql-error'
import { ApplicationError } from '@shared/application/application-error'
import { SafeInternalServerErrorException, ValidationException } from '@shared/application/exceptions'
import { DomainError } from '@shared/domain/domain-error'
import { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'

import { NODE_ENV } from '@/config/enviroment'

import { DatabaseError } from '../exceptions'
import { sentryScopeError } from '../sentry/sentryScopeError'
import { formatZodErrors } from '../utils/format-zod-errors.util'

/**
 * Middleware global para manejo de errores.
 *
 * Los errores son AUTO-CONTENIDOS: cada excepción define su propio
 * status HTTP y código de error en la propiedad `metadata`.
 *
 * Flujo:
 * - ZodError → ValidationException (422)
 * - DatabaseError → SafeInternalServerErrorException (500, enmascarado)
 * - DomainError/ApplicationError → Se expone al cliente (status/code del error)
 * - InfrastructureError → SafeInternalServerErrorException (500, enmascarado)
 * - Otros → SafeInternalServerErrorException (500, fallback)
 */
export function handleErrorMiddleware(err: unknown, req: Request, res: Response, _next: NextFunction) {
  let error: BaseError
  let invalidParams: unknown = undefined

  if (err instanceof DatabaseError) {
    console.log('Instancia del error: ', err.name)
  }
  switch (true) {
    // Errores de validación (Zod)
    case err instanceof ZodError: {
      invalidParams = err.errors
      const messages = formatZodErrors(err.errors)
      error = new ValidationException(messages)
      logger.warn(error.message, { err: error })
      break
    }

    // Errores de MSSQL (wrapper)
    case err instanceof DatabaseError: {
      sentryScopeError(err)
      const infraError = mapMSSQLError(err.originalError)
      logger.error(infraError.message, { err: infraError })

      // Enmascara detalles técnicos para el cliente
      error = new SafeInternalServerErrorException(
        'No se pudo completar la operación con la base de datos. Si el problema persiste, contacte con el administrador.',
      )
      break
    }

    // Errores de dominio (reglas de negocio) - SE EXPONEN al cliente
    case err instanceof DomainError: {
      const level = err.metadata.logLevel ?? 'warn'
      logger[level](err.message, { err })
      error = err
      break
    }

    // Errores de aplicación (validaciones, auth) - SE EXPONEN al cliente
    case err instanceof ApplicationError: {
      const level = err.metadata.logLevel ?? 'warn'
      logger[level](err.message, { err })
      error = err
      break
    }

    // Errores de infraestructura - SE ENMASCARAN
    case err instanceof InfrastructureError:
      sentryScopeError(err)
      logger.error(err.message, { err })
      error = new SafeInternalServerErrorException()
      break

    // Errores no controlados - SE ENMASCARAN
    default: {
      sentryScopeError(err)
      if (err instanceof Error) {
        logger.error(`[unhandled] ${err.name}: ${err.message}`, { err })
      } else {
        logger.error('[unhandled] Error desconocido', { err })
      }
      error = new SafeInternalServerErrorException()
      break
    }
  }

  // Construye respuesta usando metadata del error (AUTO-CONTENIDO)
  const errorApiResponse = {
    correlationId: req.correlationId,
    error: {
      type: error.type,
      title: error.title,
      status: error.status,
      detail: error.detail,
      errorCode: error.errorCode,
      invalidParams,
      // Stack trace solo en desarrollo
      ...(NODE_ENV === 'development' && {
        stack: error.stack,
        cause: error.cause?.message,
      }),
    },
  }

  return res.status(error.status).json(errorApiResponse)
}
