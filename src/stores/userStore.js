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

            console.log("start")

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
                console.error('Erreur de récupération via l\'onglet :', err)
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

            console.log("🔍 Début fetchAgendas - tabId:", tabStore.currentTabId)

            this.loadingAgendas = true
            this.agendasError = null

            try {
                const [result] = await chrome.scripting.executeScript({
                    target: {tabId: tabStore.currentTabId},
                    func: () => {
                        return (async () => {
                            const logs = [] // Pour collecter les logs

                            try {
                                logs.push("🌐 Début de l'exécution dans la page web")
                                logs.push("🌐 URL actuelle: " + window.location.href)

                                logs.push("🌐 Avant l'appel fetch")
                                const res = await fetch('https://myulis.etnic.be/api/autorisation/getPopulationAgenda', {
                                    credentials: 'include'
                                })
                                logs.push("🌐 Réponse reçue, status: " + res.status)

                                if (!res.ok) throw new Error('HTTP ' + res.status)
                                const data = await res.json()

                                logs.push("🌐 Data reçue: " + JSON.stringify(data))

                                // L'API retourne directement un tableau JSON, pas une structure XML
                                // Filtrer uniquement les agendas avec mode "calendarFull"
                                const filteredAgendas = Array.isArray(data) ?
                                    data.filter(agenda => agenda.mode !== 'calendarDiscreet') : []

                                logs.push("🌐 Agendas filtrés: " + JSON.stringify(filteredAgendas))
                                logs.push("🌐 Modes disponibles: " + JSON.stringify(data.map(a => a.mode)))

                                return {
                                    data: filteredAgendas,
                                    logs: logs
                                }
                            } catch (err) {
                                logs.push("🌐 Erreur dans la page web: " + err.message)
                                return {
                                    error: err.message,
                                    logs: logs
                                }
                            }
                        })()
                    }
                })

                console.log("📋 Résultat de l'executeScript:", result)

                // Afficher les logs de la page web dans la console de l'extension
                if (result.result?.logs) {
                    result.result.logs.forEach(log => console.log(log))
                }

                if (result.result?.error) {
                    throw new Error(result.result.error)
                }

                this.agendas = result.result?.data || []
                console.log("✅ Agendas stockés:", this.agendas)
            } catch (err) {
                console.error('Erreur de récupération des agendas :', err)
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