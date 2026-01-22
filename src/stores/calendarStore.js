import { defineStore } from 'pinia'
import { useTabStore } from './tabStore'
import { usePresenceCalculator } from '@/composables/usePresenceCalculator'
import {
  API_DATA_ENDPOINT,
  DATA_TYPES,
  RETRY_CONFIG
} from '@/constants'
import { isDebugEnabled } from '@/utils/settings'

// Instance partagée du calculateur de présence
const presenceCalculator = usePresenceCalculator()

export const useCalendarStore = defineStore('calendar', {
  state: () => ({
    calendarSets: null,
    loading: false,
    error: null,
    lastFetchParams: null // Pour éviter les appels redondants
  }),

  getters: {
    hasData: (state) => {
      return state.calendarSets?.length > 0 &&
        state.calendarSets.some(set => Array.isArray(set) && set.length > 0)
    },

    // Getter pour obtenir toutes les données de présence d'un permat
    getPresenceDataForPermat: () => (permat) => {
      return {
        presenceRate: presenceCalculator.getPresenceRate(permat),
        presenceDays: presenceCalculator.getPresenceDays(permat),
        workingDays: presenceCalculator.getWorkingDays(permat),
        homeworkingDays: presenceCalculator.getHomeworkingDays(permat),
        invalidActivities: presenceCalculator.getInvalidActivities(permat)
      }
    }
  },

  actions: {
    async fetchCalendar(permats, startDate, endDate) {
      const tabStore = useTabStore()

      if (!tabStore.currentTabId) {
        throw new Error('Aucun onglet actuel disponible')
      }

      // Éviter les appels redondants
      const params = { permats, startDate: startDate.getTime(), endDate: endDate.getTime() }
      if (JSON.stringify(params) === JSON.stringify(this.lastFetchParams)) {
        return
      }

      this.loading = true
      this.error = null

      // Format de date requis par myUlis (YYYY-MM-DD)
      const dd = startDate.toLocaleDateString('fr-CA').split('T')[0]

      // Si le mois est en cours, on prend hier comme date de fin
      const today = new Date()
      const isCurrentMonth = startDate.getMonth() === today.getMonth() &&
        startDate.getFullYear() === today.getFullYear()

      // Création d'une nouvelle date pour éviter la mutation de 'today'
      const adjustedEndDate = isCurrentMonth
        ? new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
        : endDate

      const df = adjustedEndDate.toLocaleDateString('fr-CA').split('T')[0]

      try {
        const debugMode = await isDebugEnabled()
        const [result] = await chrome.scripting.executeScript({
          target: { tabId: tabStore.currentTabId },
          func: this._createFetchFunction(),
          args: [API_DATA_ENDPOINT, permats, dd, df, Object.values(DATA_TYPES), RETRY_CONFIG, debugMode, 'calendarStore.fetchCalendar']
        })

        if (result.result?.error) {
          throw new Error(result.result.error)
        }

        this.calendarSets = result.result?.data || null
        this.lastFetchParams = params

        // Mettre à jour le calculateur avec les nouvelles données
        presenceCalculator.setCalendarData(this.calendarSets)
      } catch (err) {
        this.error = err.message || 'Erreur inconnue'
        this.calendarSets = null
      } finally {
        this.loading = false
      }
    },

    /**
     * Crée la fonction à injecter dans la page myUlis
     * Factorisée avec retry et appels parallèles
     */
    _createFetchFunction() {
      return (apiUrl, permats, dd, df, dataTypes, retryConfig, debugMode, source) => {
        return (async () => {
          const headers = {
            'Content-Type': 'application/json',
            'Referer': 'https://myulis.etnic.be/',
            'Origin': 'https://myulis.etnic.be'
          }

          /**
           * Fonction de log pour le debug
           */
          function debugLog(type, url, data) {
            if (!debugMode) return
            const timestamp = new Date().toISOString()
            console.groupCollapsed(`[MonUlisss ${source}] [${type}] ${url}`)
            console.log('Source:', source)
            console.log('Timestamp:', timestamp)
            console.log('URL:', url)
            console.log('Data:', data)
            console.groupEnd()
          }

          /**
           * Effectue un fetch avec retry et backoff exponentiel
           */
          async function fetchWithRetry(url, options) {
            let lastError
            const { MAX_ATTEMPTS, BASE_DELAY_MS, BACKOFF_FACTOR } = retryConfig

            debugLog('REQUEST', url, { method: options.method || 'GET', body: options.body })

            for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
              try {
                const response = await fetch(url, options)
                if (!response.ok) {
                  throw new Error(`HTTP ${response.status}`)
                }
                debugLog('RESPONSE', url, { status: response.status, attempt })
                return response
              } catch (error) {
                lastError = error
                debugLog('ERROR', url, { error: error.message, attempt })
                if (attempt === MAX_ATTEMPTS) break

                const delay = BASE_DELAY_MS * Math.pow(BACKOFF_FACTOR, attempt - 1)
                await new Promise(resolve => setTimeout(resolve, delay))
              }
            }
            throw lastError
          }

          /**
           * Récupère les données pour un type donné
           */
          async function fetchDataType(type) {
            const payload = { types: [type], permats, dd, df }
            const response = await fetchWithRetry(apiUrl, {
              method: 'POST',
              body: JSON.stringify(payload),
              credentials: 'include',
              headers
            })
            const jsonData = await response.json()
            debugLog('RESPONSE_DATA', `${apiUrl} [${type}]`, jsonData)
            return jsonData
          }

          try {
            // Appels parallèles pour tous les types de données
            const data = await Promise.all(dataTypes.map(fetchDataType))
            return { data }
          } catch (err) {
            return { error: err.message }
          }
        })()
      }
    },

    // Délégation des méthodes de calcul au composable
    getPresenceRateForPermat(permat) {
      return presenceCalculator.getPresenceRate(permat)
    },

    getWorkingDaysForPermat(permat) {
      return presenceCalculator.getWorkingDays(permat)
    },

    getHomeworkingDaysForPermat(permat) {
      return presenceCalculator.getHomeworkingDays(permat)
    },

    getPresenceDaysForPermat(permat) {
      return presenceCalculator.getPresenceDays(permat)
    },

    getInvalidActivitiesForPermat(permat) {
      return presenceCalculator.getInvalidActivities(permat)
    },

    clearData() {
      this.calendarSets = null
      this.error = null
      this.lastFetchParams = null
      presenceCalculator.clearCache()
    }
  }
})