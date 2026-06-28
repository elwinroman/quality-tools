import { NextFunction, Request, Response } from 'express'

import { GetHealthStatusUseCase } from '../../../../application/get-health-status.use-case'

export class HealthController {
  constructor(private readonly getHealthStatusUseCase: GetHealthStatusUseCase) {}

  live(req: Request, res: Response): Response {
    return res.status(200).json({
      correlationId: req.correlationId,
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    })
  }

  async ready(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const result = await this.getHealthStatusUseCase.execute()
      const httpStatus = result.status === 'ok' ? 200 : 503

      return res.status(httpStatus).json({
        correlationId: req.correlationId,
        ...result,
      })
    } catch (err) {
      next(err)
    }
  }
}
