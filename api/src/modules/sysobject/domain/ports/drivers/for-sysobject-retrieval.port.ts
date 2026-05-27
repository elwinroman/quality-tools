import { LogObjectContext, LogProdObjectContext } from '@sysobject/domain/schemas/log-object-context'
import { PermissionRol } from '@sysobject/domain/schemas/permission-rol'
import { SysObject, SysObjectDependency, SysObjectDependent, SysObjectSummary, TypeSysObject } from '@sysobject/domain/schemas/sysobject'
import { Usertable } from '@sysobject/domain/schemas/usertable'

/**
 * Puerto de acceso (interface) de tipo driver (primary) para recuperar objetos del sistema (SysObject)
 * desde una fuente de datos como base de datos o caché.
 *
 * Se utiliza en la capa de aplicación para desacoplar la lógica de acceso a datos.
 */
export interface ForSysObjectRetrievalPort {
  /**
   * Recupera un objeto del sistema por esquema y nombre, incluyendo los roles con permisos sobre él.
   *
   * @param schema - Nombre del esquema.
   * @param name - Nombre del objeto.
   * @returns Una promesa que resuelve con el objeto y sus permisos asociados.
   */
  getSysObjectBySchemaAndName(schema: string, name: string, log: LogObjectContext): Promise<SysObject & { permission: PermissionRol[] }>

  /**
   * Realiza una búsqueda de sugerencias de objetos del sistema, basada en el nombre parcial y tipo.
   *
   * @param name - Nombre parcial o completo del objeto a buscar.
   * @param type - Tipo de objeto (por ejemplo, 'P', 'FN', 'V', etc.).
   * @returns Una promesa que resuelve con una lista de objetos que coinciden con el criterio.
   */
  searchSuggestions(name: string, type: TypeSysObject): Promise<SysObjectSummary[]>

  /**
   * Recupera una tabla de usuario por esquema y nombre.
   *
   * @param schema - Nombre del esquema.
   * @param name - Nombre de la tabla.
   * @returns Una promesa que resuelve con la tabla de usuario correspondiente.
   */
  getSysUsertableBySchemaAndName(schema: string, name: string, log: LogObjectContext): Promise<Usertable>

  /**
   * Recupera un objeto del sistema desde el entorno de producción, incluyendo los roles con permisos sobre él.
   *
   * @param name - Nombre del objeto a recuperar.
   * @param schema - Nombre del esquema al que pertenece el objeto.
   * @param actionType - Tipo de acción realizado (recuperación por comparación, recuperación por búsqueda normal)
   * @param log - Log de contexto para el registro de trazabilidad.
   * @returns Una promesa que resuelve con el objeto y sus permisos asociados.
   */
  getProdSysObject(
    name: string,
    schema: string,
    actionType: number,
    log: LogProdObjectContext,
  ): Promise<SysObject & { permission: PermissionRol[] }>

  /**
   * Recupera los objetos que dependen del objeto indicado.
   *
   * En SQL Server este concepto corresponde a las entidades que referencian al objeto
   * consultado (`sys.dm_sql_referencing_entities`). Es decir, responde la pregunta:
   * "si cambio este objeto, que otros objetos podrian verse afectados?".
   *
   * @param name - Nombre del objeto consultado.
   * @param schema - Nombre del esquema al que pertenece el objeto consultado.
   * @returns Una promesa que resuelve con los objetos dependientes.
   */
  getSysObjectDependents(name: string, schema: string): Promise<SysObjectDependent[]>

  /**
   * Recupera los objetos usados por el objeto indicado.
   *
   * En SQL Server este concepto corresponde a las entidades referenciadas por el objeto
   * consultado (`sys.dm_sql_referenced_entities`). Es decir, responde la pregunta:
   * "que objetos necesita este objeto para funcionar?".
   *
   * @param name - Nombre del objeto consultado.
   * @param schema - Nombre del esquema al que pertenece el objeto consultado.
   * @returns Una promesa que resuelve con las dependencias del objeto.
   */
  getSysObjectDependencies(name: string, schema: string): Promise<SysObjectDependency[]>
}
