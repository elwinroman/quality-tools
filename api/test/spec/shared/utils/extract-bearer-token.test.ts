import { extractBearerToken } from '@core/utils/extract-bearer-token.util'
import { describe, expect, it } from 'vitest'

describe('extractBearerToken', () => {
  it('debe devolver el token cuando la cabecera es válida', () => {
    const validHeader1 = 'Bearer miToken123'
    const validHeader2 = 'Bearer miToken456'

    const token = extractBearerToken(validHeader1)
    const token2 = extractBearerToken(validHeader2)

    expect(token).toBe('miToken123')
    expect(token2).toBe('miToken456')
  })

  it('debe devolver null si la cabecera no es válida', () => {
    const invalidHeader1 = 'Bearer' // formato Bearer incorrecto
    const invalidHeader2 = 'Bearer ' // existe Bearer y su formato es correcto pero no existe el token
    const invalidHeader3 = 'InvalidHeader miToken123' // ningún Bearer
    const invalidHeader4 = ' Bearer ' // formato Bearer incorrecto con espacio al inicio
    const invalidHeader5 = 'Bearer myToken123 c456' // formato correcto, token separado por un espacio

    expect(extractBearerToken(invalidHeader1)).toBeNull()
    expect(extractBearerToken(invalidHeader2)).toBeNull()
    expect(extractBearerToken(invalidHeader3)).toBeNull()
    expect(extractBearerToken(invalidHeader4)).toBeNull()
    expect(extractBearerToken(invalidHeader5)).toBeNull()
  })

  it('debe devolver null si falta la cabecera', () => {
    const noHeader = undefined // la cabecera es UNDEFINED

    expect(extractBearerToken(noHeader)).toBeNull()
  })
})
