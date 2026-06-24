import { useAligmentStore } from '@aligment/zustand/aligment.store'
import { useState } from 'react'
import * as v from 'valibot'
import { safeParse } from 'valibot'

import { createSysObjectStoreAdapter } from '@/adapters'
import useFetchAndLoad from '@/hooks/useFetchAndLoad'
import { FullSysObject } from '@/models/sysobject'
import { getProdSysObjectService } from '@/services'

export const useSearch = () => {
  const [search, setSearch] = useState<string>('')
  const [errorValidation, setErrorValidation] = useState<string | null>(null)
  const { callEndpoint, loading, error } = useFetchAndLoad<FullSysObject>()

  const createSysObject = useAligmentStore((state) => state.createSysObject)

  // intenta recuperar el objeto de producción
  const getObject = async (): Promise<boolean> => {
    const parsed = validateWithValibot(search)

    // input no válido
    if (!parsed.success) {
      setErrorValidation(parsed.issues[0].message)
      return false
    }
    setErrorValidation(null)

    try {
      // recuperar objeto
      const response = await callEndpoint(getProdSysObjectService({ name: search, schema: 'dbo', actionType: 1 }))

      // crear el objeto en el store
      createSysObject(createSysObjectStoreAdapter(response.data))
    } catch (err) {
      console.error('Error al recuperar el objeto de producción: ', err)
      createSysObject(null)
      return false
    }

    return true
  }

  // setters
  const updateSearch = (search: string) => setSearch(search)
  const updateErrorValidation = (value: string) => setErrorValidation(value)

  return { search, updateSearch, errorValidation, updateErrorValidation, getObject, error, loading }
}

/** Validación de campo */
export const validateWithValibot = (search: string) => {
  const searchSchema = v.pipe(
    v.string(),
    v.trim(),
    v.minLength(3, 'Debe ser mayor a 3 caracteres'),
    v.maxLength(128, 'Ha sobrepasado el maximo permitido de caracteres'),
  )

  return safeParse(searchSchema, search)
}
