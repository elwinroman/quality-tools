import { DomainError } from '@shared/domain/domain-error'

export class SysObjectNotFoundException extends DomainError {
  readonly type = 'SysObjectNotFoundException'
  static readonly title = 'Objeto no encontrado'
  readonly detail: string
  static readonly metadata = { status: 404, errorCode: 3000 }

  constructor(identifier: number | string) {
    super(`[sysobject] Objeto SQL no encontrado: ${identifier}`)
    this.detail = `No se ha encontrado el objeto sql: ${identifier}.`
  }
}
