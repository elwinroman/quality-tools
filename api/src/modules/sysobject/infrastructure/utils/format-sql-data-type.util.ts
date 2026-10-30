const enum SQLDataTypes {
  VARCHAR = 'varchar',
  CHAR = 'char',
  NVARCHAR = 'nvarchar',
  NCHAR = 'nchar',
  NUMERIC = 'numeric',
  DECIMAL = 'decimal',
  FLOAT = 'float',
  BINARY = 'binary',
  VARBINARY = 'varbinary',
}

/**
 * Formatea un tipo de dato SQL con sus atributos de longitud, precisión y escala.
 *
 * @param type - Tipo de dato SQL.
 * @param maxLength - Longitud máxima del dato (para tipos de longitud variable).
 * @param precision - Precisión (para tipos numéricos).
 * @param scale - Escala (para tipos numéricos).
 * @returns Cadena formateada representando el tipo de dato con sus parámetros.
 */
export const formatSQLDataType = (type: string, maxLenght: number, precision: number, scale: number) => {
  const normalizedType = type.toLowerCase()

  if (normalizedType === SQLDataTypes.VARCHAR || normalizedType === SQLDataTypes.CHAR)
    return maxLenght === -1 ? `${normalizedType}(MAX)` : `${normalizedType}(${maxLenght})`

  if (normalizedType === SQLDataTypes.NVARCHAR || normalizedType === SQLDataTypes.NCHAR)
    return maxLenght === -1 ? `${normalizedType}(MAX)` : `${normalizedType}(${maxLenght / 2})` // se divide entre 2 porque internamente se guarda en Bytes

  if (normalizedType === SQLDataTypes.NUMERIC || normalizedType === SQLDataTypes.DECIMAL) return `${normalizedType}(${precision}, ${scale})`

  // float(n) solo toma precisión, de 1 a 53 bits; la escala pertenece a numeric/decimal.
  if (normalizedType === SQLDataTypes.FLOAT) return `${normalizedType}(${precision})`

  if (normalizedType === SQLDataTypes.BINARY || normalizedType === SQLDataTypes.VARBINARY)
    return maxLenght === -1 ? `${normalizedType}(MAX)` : `${normalizedType}(${maxLenght})`

  return normalizedType
}
