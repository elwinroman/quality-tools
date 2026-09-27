import { Column, ExtendedProperty, ForeignKey, Index, UsertableSysObject } from '@sysobject/domain/schemas/usertable'

/**
 * Puerto del repositorio de SysUsertable (tipo driven/secondary).
 * Define las operaciones para acceder a metadatos de tablas de usuario en la base de datos
 */
export interface ForSysUsertableRepositoryPort {
  /**
   * Obtiene los metadatos base de una tabla de usuario por esquema y nombre.
   *
   * @param schema - Nombre del esquema.
   * @param name - Nombre de la tabla.
   * @returns Una promesa que resuelve con el objeto de sistema o null si no existe.
   */
  getBySchemaAndName(schema: string, name: string): Promise<UsertableSysObject | null>

  /**
   * Obtiene las columnas de una tabla de usuario por su identificador.
   *
   * @param id - ID de la tabla.
   * @returns Una promesa que resuelve con la lista de columnas asociadas.
   */
  getColumnsById(id: number): Promise<Column[]>

  /**
   * Obtiene los índices definidos sobre una tabla por su identificador.
   *
   * @param id - ID de la tabla.
   * @returns Una promesa que resuelve con la lista de índices.
   */
  getIndexesById(id: number): Promise<Index[]>

  /**
   * Obtiene las claves foráneas definidas en una tabla por su identificador.
   *
   * @param id - ID de la tabla.
   * @returns Una promesa que resuelve con la lista de claves foráneas.
   */
  getForeignKeysById(id: number): Promise<ForeignKey[]>

  /**
   * Obtiene las propiedades extendidas asociadas directamente a la tabla (no a sus columnas).
   *
   * @param id - ID de la tabla.
   * @returns Una promesa que resuelve con la lista de propiedades extendidas de la tabla.
   */
  getUsertableExtendedPropertieById(id: number): Promise<ExtendedProperty[]>
}
