import { resolveTypeSysObjectValues, TypeSysObject } from '@sysobject/domain/schemas/sysobject'

/**
 * Devuelve una cadena formateada para usarse en una cláusula SQL `IN(...)`,
 * basada en el tipo de objeto SQL especificado.
 *
 * - Si el tipo es `ALL_EXCEPT_USERTABLE`, devuelve todos los tipos válidos excepto las tablas de usuario.
 * - Si el tipo es `ALL`, incluye todos los tipos válidos definidos en el dominio.
 * - Si es un tipo específico (`'P'`, `'U'`, etc.), devuelve ese único tipo entre comillas.
 *
 * @param {TypeSysObject} type - El tipo de objeto SQL, según el enum `TypeSysObjectEnum`.
 * @returns {string} Una cadena de tipos formateada como `'P', 'FN', ...`, lista para usarse en SQL.
 *
 * @example
 * // Para obtener todos los tipos excepto las tablas de usuario:
 * const condition = parseSqlObjectTypeCondition(TypeSysObjectEnum.ALL_EXCEPT_USERTABLE);
 * // Resultado: "'P', 'FN', 'TR', 'TF', 'IF', 'V'"
 *
 * @example
 * // Para un tipo específico:
 * const condition = parseSqlObjectTypeCondition(TypeSysObjectEnum.U);
 * // Resultado: "'U'"
 */
export function parseSqlObjectTypeCondition(type: TypeSysObject): string {
  return resolveTypeSysObjectValues(type)
    .map(typeValue => `'${typeValue}'`)
    .join(', ')
}
