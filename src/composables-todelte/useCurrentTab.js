import { ref } from 'vue'

export const currentTabId = ref(null)

export function getActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0]
      currentTabId.value = tab.id
      resolve(tab)
    })
  })
}

export async function waitForPageReady(tabId) {
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
}