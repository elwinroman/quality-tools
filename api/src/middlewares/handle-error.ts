import { NextFunction, Request, Response } from 'express'

import { MyCustomError } from '@/models/schemas'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function handleError(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof MyCustomError) {
    console.error(err)
    const { status, statusCode, message, originalError } = err
    return res.status(statusCode).json({ status, statusCode, message, originalError })
  }
  console.error(err)
  return res.status(500).json({ status: 'error', statusCode: 500, message: 'Internal server error' })
}
