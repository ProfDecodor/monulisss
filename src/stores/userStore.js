import {defineStore} from 'pinia'
import {useTabStore} from './tabStore'

export const useUserStore = defineStore('user', {
    state: () => ({
        user: null, //identité du user
        agendas: [], // Liste des agendas
        loading: false, // Etat de chargement du user
        loadingAgendas: false, // État de chargement des agendas
        error: null,
        agendasError: null
    }),

    getters: {
        isAuthenticated: (state) => !!state.user,
        userDisplayName: (state) =>
            state.user ? `${state.user.prenom} ${state.user.nom}` : null,
        hasAgendas: (state) => state.agendas.length > 0 // Getter pour vérifier si l'utilisateur a des agendas
    },

    actions: {
        async fetchIdentity() {
            const tabStore = useTabStore()

            if (!tabStore.currentTabId) {
                throw new Error('Aucun onglet actuel disponible')
            }

            this.loading = true
            this.error = null

            try {
                const [result] = await chrome.scripting.executeScript({
                    target: {tabId: tabStore.currentTabId},
                    func: () => {
                        return (async () => {
                            try {
                                const res = await fetch('https://myulis.etnic.be/api/user/me', {
                                    credentials: 'include'
                                })
                                if (!res.ok) throw new Error('HTTP ' + res.status)
                                const data = await res.json()
                                return {
                                    permat: data.permat,
                                    prenom: data.prenom,
                                    nom: data.nom
                                }
                            } catch (err) {
                                return {error: err.message}
                            }
                        })()
                    }
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

        // récupérer les agendas
        async fetchAgendas() {
            const tabStore = useTabStore()

            if (!tabStore.currentTabId) {
                throw new Error('Aucun onglet actuel disponible')
            }

            this.loadingAgendas = true
            this.agendasError = null

            try {
                const [result] = await chrome.scripting.executeScript({
                    target: {tabId: tabStore.currentTabId},
                    func: () => {
                        return (async () => {

                            try {
                                const res = await fetch('https://myulis.etnic.be/api/autorisation/getPopulationAgenda', {
                                    credentials: 'include'
                                })

                                if (!res.ok) throw new Error('HTTP ' + res.status)
                                const data = await res.json()

                                // L'API retourne directement un tableau JSON, pas une structure XML
                                // Filtrer uniquement les agendas avec mode "calendarFull"
                                const filteredAgendas = Array.isArray(data) ?
                                    data.filter(agenda => agenda.mode !== 'calendarDiscreet')
                                    : []

                                return {
                                    data: filteredAgendas,
                                }
                            } catch (err) {
                                return {
                                    error: err.message,
                                }
                            }
                        })()
                    }
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

        // Méthode combinée pour récupérer les données utilisateur ET les agendas
        async fetchUserData() {
            await this.fetchIdentity()
            if (this.user) {
                await this.fetchAgendas()
            }
        },

        clearUser() {
            this.user = null
            this.agendas = []
            this.error = null
            this.agendasError = null
        }
    }
})