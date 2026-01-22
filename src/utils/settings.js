import { DEBUG_MODE } from '../constants.js'

/**
 * Récupère la valeur du paramètre debug depuis le storage
 * Retourne DEBUG_MODE (constante) comme valeur par défaut
 * @returns {Promise<boolean>}
 */
export async function isDebugEnabled() {
  try {
    const result = await browser.storage.local.get('debugMode')
    return result.debugMode !== undefined ? result.debugMode : DEBUG_MODE
  } catch {
    // Fallback si l'API storage n'est pas disponible
    return DEBUG_MODE
  }
}

/**
 * Récupère la valeur du paramètre "mode dégueulasse" depuis le storage
 * @returns {Promise<boolean>}
 */
export async function isUglyModeEnabled() {
  try {
    const result = await browser.storage.local.get('uglyMode')
    return result.uglyMode || false
  } catch {
    return false
  }
}