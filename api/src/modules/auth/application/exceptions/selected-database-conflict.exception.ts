import { ApplicationError } from '@shared/application/application-error'

export class SelectedDatabaseConflictException extends ApplicationError {
  readonly type = 'SelectedDatabaseConflictException'
  static readonly title = 'Cambio de base de datos en conflicto'
  readonly detail =
    'La sesión cambió en otra pestaña o dispositivo antes de confirmar el cambio. Vuelve a intentar el cambio de base de datos.'
  static readonly metadata = { status: 409, errorCode: 2002 }

  constructor() {
    super('[auth] Conflicto al cambiar de base de datos: la sesión fue modificada durante la operación')
  }
}
