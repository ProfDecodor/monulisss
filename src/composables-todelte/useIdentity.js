
import { ref } from 'vue'

export function useIdentity(currentTabId) {
  const user = ref(null)
  const loading = ref(false)

  async function fetchIdentity() {
    loading.value = true
    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: currentTabId.value },
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

      if (result.result?.error) throw new Error(result.result.error)
      user.value = result.result
    } catch (err) {
      console.error('Erreur de récupération via l’onglet :', err)
      user.value = null
    } finally {
      loading.value = false
    }
  }

  return { user, loading, fetchIdentity }
}
