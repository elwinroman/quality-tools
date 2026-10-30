import type { NextFunction, Request, Response } from 'express'

import type { GetQueryStoreOptionsUseCase } from '@/modules/performance/application/use-cases/get-query-store-options.use-case'

/**
 * Expone las opciones públicas de filtrado de Query Store.
 * Sólo publica el DTO serializable; nunca los intervalos exactos internos del snapshot.
 */
export class GetQueryStoreOptionsController {
  constructor(private readonly getQueryStoreOptionsUseCase: Pick<GetQueryStoreOptionsUseCase, 'execute'>) {}

  async run(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.getQueryStoreOptionsUseCase.execute()

      return res.status(200).json({ correlationId: req.correlationId, data: result.options })
    } catch (err) {
      next(err)
    }
  }
}
