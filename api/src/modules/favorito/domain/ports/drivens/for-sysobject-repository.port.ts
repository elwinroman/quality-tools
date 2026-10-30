// TODO: Adaptar mediante proxy en el módulo sysobject

/**
 * Representa un objeto del sistema en SQL Server, como una tabla, vista, procedimiento, etc.
 * Incluye el esquema y el nombre del objeto dentro del módulo BusquedaReciente
 */
export interface SysObject {
  schema: string
  name: string
}

/**
 * Puerto del repositorio de SysObject de tipo driven (secundario).
 * Define las operaciones para acceder a los datos relacionados con objetos del sistema SQL Server.
 */
export interface ForSysObjectRepositoryPort {
  /**
   * Recupera los IDs internos de los objetos del sistema a partir de su esquema y nombre.
   *
   * @param objects - Lista de objetos del sistema, con esquema y nombre, para los cuales se desea obtener el ID.
   * @returns Una promesa que resuelve a un array con un ID por objeto proporcionado, en el mismo orden.
   *          El ID es `null` cuando `OBJECT_ID(...)` no encuentra el objeto porque ya no existe.
   */
  findIDsByNameAndSchema(objects: SysObject[]): Promise<(number | null)[]>
}
