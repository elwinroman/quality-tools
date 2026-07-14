import { PermissionRol } from '@sysobject/domain/schemas/permission-rol'
import {
  SysObject,
  SysObjectDependency,
  SysObjectDependent,
  SysObjectRelationsResult,
  SysObjectSummary,
  ValidTypeSysObject,
} from '@sysobject/domain/schemas/sysobject'

/**
 * Puerto del repositorio de SysObject de tipo driven (secondary) que define las operaciones de acceso a datos del dominio.
 *
 */
export interface ForSysObjectRepositoryPort {
  /**
   * Obtiene un objeto del sistema por esquema y nombre. No incluye el objeto de tipo USER_TABLE.
   *
   * @param schema - Nombre del esquema.
   * @param name - Nombre del objeto.
   * @returns Una promesa que resuelve con el objeto si existe, o `null` si no se encuentra.
   */
  getBySchemaAndName(schema: string, name: string): Promise<SysObject | null>

  /**
   * Recupera la lista de roles con permisos asociados a un objeto determinado.
   *
   * @param id - Identificador del objeto.
   * @returns Una promesa que resuelve con un arreglo de `PermissionRol`.
   */
  getRolesById(id: number): Promise<PermissionRol[]>

  /**
   * Busca objetos del sistema por nombre parcial y tipo (ej. procedimiento, vista, función, etc.).
   *
   * @param name - Nombre o parte del nombre del objeto.
   * @param type - Tipo del objeto (ej. 'P', 'FN', 'V', etc.).
   * @returns Una promesa que resuelve con una lista de objetos coincidentes.
   */
  findByNameAndType(name: string, types: ValidTypeSysObject[]): Promise<SysObjectSummary[]>

  /**
   * Busca los objetos que dependen del objeto indicado por esquema y nombre.
   *
   * Este contrato representa dependencias entrantes: objetos que referencian al objeto consultado.
   * Sirve para analizar impacto antes de modificar o eliminar un objeto SQL.
   *
   * @param name - Nombre del objeto consultado.
   * @param schema - Nombre del esquema al que pertenece el objeto consultado.
   * @returns Una promesa que resuelve con los objetos dependientes.
   */
  findDependentsBySchemaAndName(name: string, schema: string): Promise<SysObjectRelationsResult<SysObjectDependent>>

  /**
   * Busca los objetos usados por el objeto indicado por esquema y nombre.
   *
   * Este contrato representa dependencias salientes: objetos que el objeto consultado referencia.
   * Sirve para entender que necesita un objeto SQL para compilar o ejecutarse correctamente.
   *
   * @param name - Nombre del objeto consultado.
   * @param schema - Nombre del esquema al que pertenece el objeto consultado.
   * @returns Una promesa que resuelve con las dependencias del objeto.
   */
  findDependenciesBySchemaAndName(name: string, schema: string): Promise<SysObjectRelationsResult<SysObjectDependency>>
}
