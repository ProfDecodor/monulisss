import { defineStore } from 'pinia'

export const useTabStore = defineStore('tab', {
  state: () => ({
    currentTabId: null,
    currentUrl: null,
    isOnMyulis: false,
    loading: false
  }),

  getters: {
    isMyulisUrl: (state) => {
      if (!state.currentUrl) return false
      try {
        const domain = new URL(state.currentUrl).hostname
        return domain === 'myulis.etnic.be'
      } catch {
        return false
      }
    }
  },

  actions: {
    async getActiveTab() {
      return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tab = tabs[0]
          this.currentTabId = tab.id
          this.currentUrl = tab.url
          this.isOnMyulis = this.isMyulisUrl
          resolve(tab)
        })
      })
    },

    async waitForPageReady(tabId = this.currentTabId) {
      try {
        const [result] = await chrome.scripting.executeScript({
          target: { tabId },
          func: () => {
            return new Promise((resolve) => {
              if (document.readyState === 'complete') {
                resolve(true)
              } else {
                window.addEventListener('load', () => resolve(true))
              }
            })
          }
        })
        return result.result === true
      } catch (err) {
        console.error('Erreur dans waitForPageReady:', err)
        return false
      }
    },

    updateUrl(url) {
      this.currentUrl = url
      this.isOnMyulis = this.isMyulisUrl
    },

    async redirectToMyulis() {
      if (!this.currentTabId) return

      this.loading = true

      const listener = async (tabId, changeInfo, tab) => {
        if (tabId === this.currentTabId && changeInfo.status === 'complete') {
          const ready = await this.waitForPageReady(tabId)
          if (ready) {
            this.updateUrl(tab.url)
            this.loading = false
            chrome.tabs.onUpdated.removeListener(listener)
          }
        }
      }

      chrome.tabs.onUpdated.addListener(listener)
      chrome.tabs.update(this.currentTabId, { url: 'https://myulis.etnic.be' })
    }
  }
})