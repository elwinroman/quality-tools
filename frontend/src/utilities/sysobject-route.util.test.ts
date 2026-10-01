import { describe, expect, it } from 'vitest'

import { buildQualifiedSysObjectPath, parseQualifiedSysObjectName } from '@/utilities/sysobject-route.util'

describe('buildQualifiedSysObjectPath', () => {
  it('debería construir la ruta con el nombre calificado del objeto', () => {
    expect(buildQualifiedSysObjectPath('/sql-definition', 'dbo', 'CRE_Cliente')).toBe('/sql-definition/dbo.CRE_Cliente')
  })

  it('debería codificar los caracteres especiales del nombre del objeto', () => {
    expect(buildQualifiedSysObjectPath('/user-table', 'dbo', 'mi tabla')).toBe('/user-table/dbo.mi%20tabla')
  })
})

describe('parseQualifiedSysObjectName', () => {
  it('debería devolver null cuando no hay nombre calificado', () => {
    expect(parseQualifiedSysObjectName()).toBeNull()
    expect(parseQualifiedSysObjectName('')).toBeNull()
  })

  it('debería devolver null cuando falta el esquema, el nombre o el separador', () => {
    expect(parseQualifiedSysObjectName('.tabla')).toBeNull()
    expect(parseQualifiedSysObjectName('dbo.')).toBeNull()
    expect(parseQualifiedSysObjectName('sinSeparador')).toBeNull()
  })

  it('debería separar por el primer punto cuando el nombre contiene puntos', () => {
    expect(parseQualifiedSysObjectName('dbo.mi.tabla')).toEqual({ schemaName: 'dbo', objectName: 'mi.tabla' })
  })

  it('debería restaurar esquema y nombre tras un round-trip con buildQualifiedSysObjectPath', () => {
    const path = buildQualifiedSysObjectPath('/sql-definition', 'dbo', 'CRE_Cliente')
    const qualifiedName = path.slice(path.lastIndexOf('/') + 1)

    expect(parseQualifiedSysObjectName(qualifiedName)).toEqual({ schemaName: 'dbo', objectName: 'CRE_Cliente' })
  })

  it('debería decodificar un nombre con espacios en el round-trip', () => {
    const path = buildQualifiedSysObjectPath('/user-table', 'dbo', 'mi tabla')
    const qualifiedName = path.slice(path.lastIndexOf('/') + 1)

    expect(parseQualifiedSysObjectName(qualifiedName)).toEqual({ schemaName: 'dbo', objectName: 'mi tabla' })
  })
})
