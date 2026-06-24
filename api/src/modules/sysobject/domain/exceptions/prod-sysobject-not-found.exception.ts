import { DomainError } from '@shared/domain/domain-error'

export class ProdSysObjectNotFoundException extends DomainError {
  readonly type = 'ProdSysObjectNotFoundException'
  static readonly title = 'Objeto no encontrado'
  readonly detail: string
  static readonly metadata = { status: 404, errorCode: 3001 }

  constructor(name: string, schema: string) {
    super(`[sysobject] Objeto no encontrado en preprod: [${schema}].[${name}]`)
    this.detail = `No se ha encontrado el objeto \`[${schema}].[${name}]\` en producción.`
  }
}
