import { InfrastructureError } from '@core/infrastructure-error.exception'

export class SysobjectIdsInconsistencyException extends InfrastructureError {
  readonly type = 'SysobjectIdsInconsistencyException'
  static readonly title = 'Inconsistencia en los IDs de objetos'
  readonly detail: string
  static readonly metadata = { status: 500, errorCode: 5300 }

  constructor(expected: number, received: number) {
    super(`[store] Inconsistencia en la recuperación de IDs: se esperaban ${expected} IDs y se recibieron ${received}`)
    this.detail = `El repositorio de objetos devolvió una cantidad de IDs distinta a la esperada. Se esperaban ${expected} IDs y se recibieron ${received}.`
  }
}
