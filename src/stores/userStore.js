import { defineStore } from 'pinia'
import { useTabStore } from './tabStore'
import {
  API_USER_ENDPOINT,
  API_AGENDAS_ENDPOINT,
  EXCLUDED_AGENDA_MODE,
  RETRY_CONFIG
} from '@/constants'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,           // Identité de l'utilisateur
    agendas: [],          // Liste des agendas disponibles
    loading: false,       // État de chargement de l'utilisateur
    loadingAgendas: false, // État de chargement des agendas
    error: null,
    agendasError: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    userDisplayName: (state) =>
      state.user ? `${state.user.prenom} ${state.user.nom}` : null,
    hasAgendas: (state) => state.agendas.length > 0
  },

  actions: {
    /**
     * Crée la fonction de fetch avec retry à injecter dans la page
     */
    _createFetchWithRetry() {
      return async function fetchWithRetry(url, options, retryConfig) {
        const headers = {
          'Referer': 'https://myulis.etnic.be/',
          'Origin': 'https://myulis.etnic.be'
        }

        let lastError
        const { MAX_ATTEMPTS, BASE_DELAY_MS, BACKOFF_FACTOR } = retryConfig

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
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
            if (attempt === MAX_ATTEMPTS) break

            const delay = BASE_DELAY_MS * Math.pow(BACKOFF_FACTOR, attempt - 1)
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        }
        throw lastError
      }
    },

    /**
     * Récupère l'identité de l'utilisateur connecté
     */
    async fetchIdentity() {
      const tabStore = useTabStore()

      if (!tabStore.currentTabId) {
        throw new Error('Aucun onglet actuel disponible')
      }

      this.loading = true
      this.error = null

      try {
        const [result] = await chrome.scripting.executeScript({
          target: { tabId: tabStore.currentTabId },
          func: (apiUrl, retryConfig) => {
            return (async () => {
              // Fonction de fetch avec retry (doit être définie dans le contexte injecté)
              async function fetchWithRetry(url, options) {
                const headers = {
                  'Referer': 'https://myulis.etnic.be/',
                  'Origin': 'https://myulis.etnic.be'
                }

                let lastError
                const { MAX_ATTEMPTS, BASE_DELAY_MS, BACKOFF_FACTOR } = retryConfig

                for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
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
                    if (attempt === MAX_ATTEMPTS) break

                    const delay = BASE_DELAY_MS * Math.pow(BACKOFF_FACTOR, attempt - 1)
                    await new Promise(resolve => setTimeout(resolve, delay))
                  }
                }
                throw lastError
              }

              try {
                const data = await fetchWithRetry(apiUrl, {})
                return {
                  permat: data.permat,
                  prenom: data.prenom,
                  nom: data.nom
                }
              } catch (err) {
                return { error: err.message }
              }
            })()
          },
          args: [API_USER_ENDPOINT, RETRY_CONFIG]
        })

        if (result.result?.error) {
          throw new Error(result.result.error)
        }

        this.user = result.result
      } catch (err) {
        this.error = err.message
        this.user = null
      } finally {
        this.loading = false
      }
    },

    /**
     * Récupère la liste des agendas accessibles
     */
    async fetchAgendas() {
      const tabStore = useTabStore()

      if (!tabStore.currentTabId) {
        throw new Error('Aucun onglet actuel disponible')
      }

      this.loadingAgendas = true
      this.agendasError = null

      try {
        const [result] = await chrome.scripting.executeScript({
          target: { tabId: tabStore.currentTabId },
          func: (apiUrl, excludedMode, retryConfig) => {
            return (async () => {
              // Fonction de fetch avec retry
              async function fetchWithRetry(url, options) {
                const headers = {
                  'Referer': 'https://myulis.etnic.be/',
                  'Origin': 'https://myulis.etnic.be'
                }

                let lastError
                const { MAX_ATTEMPTS, BASE_DELAY_MS, BACKOFF_FACTOR } = retryConfig

                for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
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
                    if (attempt === MAX_ATTEMPTS) break

                    const delay = BASE_DELAY_MS * Math.pow(BACKOFF_FACTOR, attempt - 1)
                    await new Promise(resolve => setTimeout(resolve, delay))
                  }
                }
                throw lastError
              }

              try {
                const data = await fetchWithRetry(apiUrl, {})

                // Filtrer les agendas selon le mode
                const filteredAgendas = Array.isArray(data)
                  ? data.filter(agenda => agenda.mode !== excludedMode)
                  : []

                return { data: filteredAgendas }
              } catch (err) {
                return { error: err.message }
              }
            })()
          },
          args: [API_AGENDAS_ENDPOINT, EXCLUDED_AGENDA_MODE, RETRY_CONFIG]
        })

        if (result.result?.error) {
          throw new Error(result.result.error)
        }

        this.agendas = result.result?.data || []
      } catch (err) {
        this.agendasError = err.message
        this.agendas = []
      } finally {
        this.loadingAgendas = false
      }
    },

    /**
     * Récupère les données utilisateur et les agendas en parallèle
     */
    async fetchUserData() {
      // Lancer les deux requêtes en parallèle
      const identityPromise = this.fetchIdentity()
      const agendasPromise = this.fetchAgendas()

      // Attendre les deux résultats
      await Promise.all([identityPromise, agendasPromise])
    },

    /**
     * Réinitialise les données utilisateur
     */
    clearUser() {
      this.user = null
      this.agendas = []
      this.error = null
      this.agendasError = null
    }
  }
})