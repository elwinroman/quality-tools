import { describe, expect, it } from 'vitest'

import { formatPermissionRoles } from '@/utilities/format-permission-roles.util'

describe('formatPermissionRoles', () => {
  it('debería devolver una cadena vacía cuando no hay permisos', () => {
    expect(formatPermissionRoles({ permission: [], schemaName: 'dbo', objectName: 'CRE_Cliente' })).toBe('')
  })

  it('debería generar un bloque GRANT delimitado por GO para un único permiso', () => {
    const script = formatPermissionRoles({
      permission: [{ stateDesc: 'GRANT', permissionName: 'EXECUTE', name: 'Rol_Fin' }],
      schemaName: 'dbo',
      objectName: 'CRE_Cliente',
    })

    expect(script).toBe('GO\nGRANT EXECUTE ON [dbo].[CRE_Cliente] TO [Rol_Fin]\nGO')
  })

  it('debería separar cada permiso con un delimitador GO intermedio', () => {
    const script = formatPermissionRoles({
      permission: [
        { stateDesc: 'GRANT', permissionName: 'EXECUTE', name: 'Rol_Fin' },
        { stateDesc: 'GRANT', permissionName: 'SELECT', name: 'Rol_Admin' },
      ],
      schemaName: 'dbo',
      objectName: 'CRE_Cliente',
    })

    expect(script).toBe(
      'GO\n' +
        'GRANT EXECUTE ON [dbo].[CRE_Cliente] TO [Rol_Fin]\n' +
        'GO\n' +
        'GRANT SELECT ON [dbo].[CRE_Cliente] TO [Rol_Admin]\n' +
        'GO',
    )
    expect(script.match(/GO/g)).toHaveLength(3)
  })
})
