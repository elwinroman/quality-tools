export const buildQualifiedSysObjectPath = (basePath: string, schema: string, name: string) => {
  return `${basePath}/${encodeURIComponent(`${schema}.${name}`)}`
}

export const parseQualifiedSysObjectName = (qualifiedName?: string) => {
  if (!qualifiedName) return null

  const decodedName = decodeURIComponent(qualifiedName)
  const separatorIndex = decodedName.indexOf('.')

  if (separatorIndex <= 0 || separatorIndex === decodedName.length - 1) return null

  return {
    schemaName: decodedName.slice(0, separatorIndex),
    objectName: decodedName.slice(separatorIndex + 1),
  }
}
