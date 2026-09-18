import { UserHashId } from '@auth/domain/value-objects/user-hash-id'
import { describe, expect, it } from 'vitest'

const USUARIO = 'uMonitor'
const HOST = 'SQLSERVER01'
const SIZE_MD5_HEX = 32

/** Recorre largos de hash y devuelve el mensaje de error de cada uno, o null si no lanzó. */
function msgForMD5SizeHex(largo: number): string | null {
  try {
    UserHashId.create(USUARIO, HOST, 'a'.repeat(largo))
    return null
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

describe('UserHashId', () => {
  describe('generate', () => {
    it('debería devolver un hash MD5 hexadecimal de 32 caracteres', () => {
      expect(UserHashId.generate(USUARIO, HOST)).toMatch(/^[0-9a-f]{32}$/)
    })

    it('debería ser determinista para el mismo usuario y host', () => {
      const primero = UserHashId.generate(USUARIO, HOST)
      const segundo = UserHashId.generate(USUARIO, HOST)

      expect(primero).toBe(segundo)
    })

    it('debería normalizar el usuario a minúsculas', () => {
      expect(UserHashId.generate('uMonitor', HOST)).toBe(UserHashId.generate('UMONITOR', HOST))
    })

    it('no debería normalizar el host', () => {
      expect(UserHashId.generate(USUARIO, 'sqlserver01')).not.toBe(UserHashId.generate(USUARIO, 'SQLSERVER01'))
    })

    it('debería distinguir usuarios del mismo host', () => {
      expect(UserHashId.generate('usuarioA', HOST)).not.toBe(UserHashId.generate('usuarioB', HOST))
    })

    it('debería distinguir el mismo usuario en hosts distintos', () => {
      expect(UserHashId.generate(USUARIO, 'SQLSERVER01')).not.toBe(UserHashId.generate(USUARIO, 'SQLSERVER02'))
    })

    it('debería colisionar cuando la concatenación host+usuario coincide sin separador', () => {
      // `generate` hashea `host + usuario` SIN delimitador, así que dos pares
      // distintos que concatenan igual producen el MISMO hashId:
      //   host 'ab' + usuario 'c'  -> 'abc'
      //   host 'a'  + usuario 'bc' -> 'abc'
      //
      // Test de caracterización: documenta el comportamiento actual, no un
      // contrato deseado. Agregar un separador cambiaría TODOS los hashes ya
      // persistidos en dbo.Usuario.cHashUsuarioUID, así que exige migrar datos.
      // El impacto está acotado por el UNIQUE de la columna: la segunda fila
      // colisionada no puede insertarse.
      expect(UserHashId.generate('c', 'ab')).toBe(UserHashId.generate('bc', 'a'))
    })
  })

  describe('create — camino del hash ausente', () => {
    it('debería generar el hash cuando no se provee uno', () => {
      expect(UserHashId.create(USUARIO, HOST).getValue).toBe(UserHashId.generate(USUARIO, HOST))
    })

    it('debería generar el hash cuando el usuario tiene otra capitalización', () => {
      expect(UserHashId.create('UMONITOR', HOST).getValue).toBe(UserHashId.generate(USUARIO, HOST))
    })

    it('debería generar el hash cuando el valor provisto es null', () => {
      // Defensivo: una columna NULL de MSSQL llega como `null` aunque el
      // parámetro solo declare `string | undefined`.
      const nulo = null as unknown as string

      expect(UserHashId.create(USUARIO, HOST, nulo).getValue).toBe(UserHashId.generate(USUARIO, HOST))
    })
  })

  describe('create — camino del hash provisto', () => {
    it('debería aceptar el hash que corresponde al usuario y host', () => {
      const hash = UserHashId.generate(USUARIO, HOST)

      expect(UserHashId.create(USUARIO, HOST, hash).getValue).toBe(hash)
    })

    it('debería aceptar un hash generado con otra capitalización del usuario', () => {
      const hash = UserHashId.generate('UMONITOR', HOST)

      expect(UserHashId.create(USUARIO, HOST, hash).getValue).toBe(hash)
    })

    it('debería rechazar un hash que no corresponde al usuario', () => {
      const hashAjeno = UserHashId.generate('otroUsuario', HOST)

      expect(() => UserHashId.create(USUARIO, HOST, hashAjeno)).toThrow(/manipulado/)
    })

    it('debería rechazar un hash generado para otro host', () => {
      const hashOtroHost = UserHashId.generate(USUARIO, 'SQLSERVER02')

      expect(() => UserHashId.create(USUARIO, HOST, hashOtroHost)).toThrow(/manipulado/)
    })

    it('debería rechazar un hash de 32 caracteres que no corresponde', () => {
      expect(() => UserHashId.create(USUARIO, HOST, 'a'.repeat(SIZE_MD5_HEX))).toThrow(/manipulado/)
    })

    it('debería exponer el valor a través de getValue', () => {
      const hash = UserHashId.generate(USUARIO, HOST)
      const valueObject = UserHashId.create(USUARIO, HOST, hash)

      expect(valueObject.getValue).toBe(hash)
      expect(typeof valueObject.getValue).toBe('string')
      expect(valueObject.getValue).toHaveLength(SIZE_MD5_HEX)
    })
  })

  describe('create — validación de longitud', () => {
    it('debería reportar el error de longitud para un hash más corto', () => {
      expect(() => UserHashId.create(USUARIO, HOST, 'abc')).toThrow(/debe tener 32 caracteres/)
    })

    it('debería reportar el error de longitud para un hash más largo', () => {
      expect(() => UserHashId.create(USUARIO, HOST, 'a'.repeat(33))).toThrow(/debe tener 32 caracteres/)
    })

    it('no debería reportar como manipulado un hash de largo incorrecto', () => {
      // El orden de las validaciones importa para el diagnóstico: un largo
      // inválido debe decir que el largo es inválido, no que el hash fue manipulado.
      expect(() => UserHashId.create(USUARIO, HOST, 'abc')).not.toThrow(/manipulado/)
    })

    it('debería reportar el error de longitud para todo largo distinto de 32', () => {
      const largos = Array.from({ length: 64 }, (_, indice) => indice + 1).filter(largo => largo !== SIZE_MD5_HEX)

      largos.forEach(largo => {
        expect(() => UserHashId.create(USUARIO, HOST, 'a'.repeat(largo))).toThrow(/debe tener 32 caracteres/)
      })
    })

    it('debería lanzar el error de longitud y no generar para una cadena vacía', () => {
      // Una cadena vacía NO es "no provisto": es un valor provisto e inválido.
      expect(() => UserHashId.create(USUARIO, HOST, '')).toThrow(/debe tener 32 caracteres/)
      expect(msgForMD5SizeHex(0)).toMatch(/debe tener 32 caracteres/)
    })
  })
})
