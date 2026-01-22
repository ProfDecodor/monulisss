/**
 * Utilitaires pour les appels API vers myUlis
 * Inclut la logique de retry avec backoff exponentiel
 */

import { RETRY_CONFIG, API_HEADERS, API_BASE_URL } from '@/constants'
import { isDebugEnabled } from '@/utils/settings'

/**
 * Log un appel API dans la console si le mode debug est activé
 * @param {string} type - 'REQUEST', 'RESPONSE' ou 'ERROR'
 * @param {string} url - URL de l'appel
 * @param {Object} data - Données à logger
 * @param {string} source - Fichier/module source de l'appel
 * @param {boolean} debugMode - État du mode debug
 */
function debugLog(type, url, data, source = 'api.js', debugMode = false) {
  if (!debugMode) return

  const timestamp = new Date().toISOString()
  const prefix = `[MonUlisss ${source}] [${type}]`

  console.groupCollapsed(`${prefix} ${url}`)
  console.log('Source:', source)
  console.log('Timestamp:', timestamp)
  console.log('URL:', url)
  console.log('Data:', data)
  console.groupEnd()
}

/**
 * Effectue un appel fetch avec retry et backoff exponentiel
 * @param {string} url - URL à appeler
 * @param {Object} options - Options fetch (method, body, etc.)
 * @param {number} maxAttempts - Nombre max de tentatives
 * @param {number} baseDelay - Délai de base en ms
 * @returns {Promise<Response>}
 */
export async function fetchWithRetry(
  url,
  options = {},
  maxAttempts = RETRY_CONFIG.MAX_ATTEMPTS,
  baseDelay = RETRY_CONFIG.BASE_DELAY_MS
) {
  const debugMode = await isDebugEnabled()
  let lastError

  debugLog('REQUEST', url, { method: options.method || 'GET', body: options.body, attempt: 1 }, 'api.js', debugMode)

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, {
        credentials: 'include',
        headers: API_HEADERS,
        ...options
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      debugLog('RESPONSE', url, { status: response.status, attempt }, 'api.js', debugMode)

      return response
    } catch (error) {
      lastError = error
      debugLog('ERROR', url, { error: error.message, attempt }, 'api.js', debugMode)

      // Ne pas réessayer si c'est la dernière tentative
      if (attempt === maxAttempts) {
        break
      }

      // Calcul du délai avec backoff exponentiel
      const delay = baseDelay * Math.pow(RETRY_CONFIG.BACKOFF_FACTOR, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Génère le code de la fonction à injecter pour les appels API avec retry
 * Cette fonction retourne une string qui sera utilisée dans chrome.scripting.executeScript
 * @returns {Function} Fonction à injecter
 */
export function createInjectedFetchFunction() {
  // Cette fonction sera sérialisée et exécutée dans le contexte de la page myUlis
  return async function injectedFetch(url, options, maxAttempts = 3, baseDelay = 1000) {
    const headers = {
      'Content-Type': 'application/json',
      'Referer': 'https://myulis.etnic.be/',
      'Origin': 'https://myulis.etnic.be'
    }

    let lastError

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(url, {
          credentials: 'include',
          headers,
          ...options
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        return await response.json()
      } catch (error) {
        lastError = error

        if (attempt === maxAttempts) {
          break
        }

        // Backoff exponentiel
        const delay = baseDelay * Math.pow(2, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }
}

/**
 * Construit l'URL complète pour une photo utilisateur
 * @param {string} photoPath - Chemin de la photo depuis l'API
 * @returns {string|null} URL complète ou null si invalide
 */
export function buildPhotoUrl(photoPath) {
  if (!photoPath) {
    return null
  }

  // Vérifier que le chemin est valide (commence par /)
  if (typeof photoPath === 'string' && photoPath.startsWith('/')) {
    return `${API_BASE_URL}${photoPath}`
  }

  // Si c'est déjà une URL complète
  if (typeof photoPath === 'string' && photoPath.startsWith('http')) {
    return photoPath
  }

  return null
}

/**
 * Calcule la durée en heures entre deux horaires
 * @param {string} timeIn - Heure d'entrée (format HH:MM:SS)
 * @param {string} timeOut - Heure de sortie (format HH:MM:SS)
 * @returns {number} Durée en heures
 */
export function calculateDurationHours(timeIn, timeOut) {
  const start = new Date(`2000-01-01T${timeIn}Z`)
  const end = new Date(`2000-01-01T${timeOut}Z`)
  return (end - start) / 3600000 // Conversion ms -> heures
}

/**
 * Convertit une durée en heures en fraction de jour
 * @param {number} hours - Nombre d'heures
 * @returns {number} 0, 0.5 ou 1 selon les seuils
 */
export function hoursToDayFraction(hours) {
  if (hours >= 5) return 1
  if (hours >= 2) return 0.5
  return 0
}