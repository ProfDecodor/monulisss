import { defineStore } from 'pinia'
import { useTabStore } from './tabStore'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    loading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    userDisplayName: (state) => 
      state.user ? `${state.user.prenom} ${state.user.nom}` : null
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
          target: { tabId: tabStore.currentTabId },
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
                return { error: err.message }
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

    clearUser() {
      this.user = null
      this.error = null
    }
  }
})