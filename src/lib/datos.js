/**
 * src/lib/datos.js
 * Hook de React para carga de archivos JSON estáticos desde /data/{nombreArchivo}
 * con almacenamiento en memoria caché (sin localStorage) y deduplicación de peticiones.
 */

import { useState, useEffect } from 'react'

// Memoria caché global en tiempo de ejecución (persiste mientras la app esté abierta)
const memoryCache = new Map()
const inFlightRequests = new Map()

/**
 * useJSON(nombreArchivo)
 * @param {string} nombreArchivo - Nombre del archivo en la carpeta public/data/ (ej: "tendencias_distritos.json")
 * @returns {{ datos: any, cargando: boolean, error: string | null }}
 */
export function useJSON(nombreArchivo) {
  const [datos, setDatos] = useState(() => {
    if (!nombreArchivo) return null
    const cached = memoryCache.get(nombreArchivo)
    return cached?.datos ?? null
  })

  const [cargando, setCargando] = useState(() => {
    if (!nombreArchivo) return false
    return !memoryCache.has(nombreArchivo)
  })

  const [error, setError] = useState(() => {
    if (!nombreArchivo) return null
    const cached = memoryCache.get(nombreArchivo)
    return cached?.error ?? null
  })

  useEffect(() => {
    if (!nombreArchivo) {
      setDatos(null)
      setCargando(false)
      setError(null)
      return
    }

    let isMounted = true

    // 1. Si ya se encuentra en caché de memoria, retornar inmediatamente
    if (memoryCache.has(nombreArchivo)) {
      const cached = memoryCache.get(nombreArchivo)
      setDatos(cached.datos)
      setError(cached.error)
      setCargando(false)
      return
    }

    setCargando(true)
    setError(null)

    // 2. Cargar con fetch deduplicando peticiones en vuelo
    const loadData = async () => {
      try {
        let promise = inFlightRequests.get(nombreArchivo)

        if (!promise) {
          const url = `/data/${nombreArchivo}`
          promise = fetch(url).then(async (res) => {
            if (!res.ok) {
              throw new Error('Datos en proceso')
            }
            // Verificar si el servidor devolvió HTML (fallback 404 de SPAs)
            const contentType = res.headers.get('content-type') || ''
            if (contentType.includes('text/html')) {
              throw new Error('Datos en proceso')
            }
            return await res.json()
          })
          inFlightRequests.set(nombreArchivo, promise)
        }

        const data = await promise
        memoryCache.set(nombreArchivo, { datos: data, error: null })
        inFlightRequests.delete(nombreArchivo)

        if (isMounted) {
          setDatos(data)
          setError(null)
          setCargando(false)
        }
      } catch {
        inFlightRequests.delete(nombreArchivo)
        const errorMsg = 'Datos en proceso'
        memoryCache.set(nombreArchivo, { datos: null, error: errorMsg })

        if (isMounted) {
          setDatos(null)
          setError(errorMsg)
          setCargando(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [nombreArchivo])

  return { datos, cargando, error }
}

/**
 * Función auxiliar para invalidar la memoria caché si fuese necesario
 */
export function limpiarCacheDatos(nombreArchivo) {
  if (nombreArchivo) {
    memoryCache.delete(nombreArchivo)
    inFlightRequests.delete(nombreArchivo)
  } else {
    memoryCache.clear()
    inFlightRequests.clear()
  }
}

export default useJSON

