const debugCheckbox = document.getElementById('debugMode')
const uglyCheckbox = document.getElementById('uglyMode')
const statusEl = document.getElementById('status')

// Charger les valeurs actuelles au démarrage
browser.storage.local.get(['debugMode', 'uglyMode']).then((result) => {
  // Par défaut à false pour debug si non défini
  debugCheckbox.checked = result.debugMode || false
  // Par défaut à false pour ugly mode
  uglyCheckbox.checked = result.uglyMode || false
})

// Sauvegarder quand l'utilisateur change la valeur debug
debugCheckbox.addEventListener('change', () => {
  browser.storage.local.set({ debugMode: debugCheckbox.checked }).then(() => {
    showStatus('Paramètre sauvegardé')
  })
})

// Sauvegarder quand l'utilisateur change la valeur ugly mode
uglyCheckbox.addEventListener('change', () => {
  browser.storage.local.set({ uglyMode: uglyCheckbox.checked }).then(() => {
    showStatus('Paramètre sauvegardé')
  })
})

function showStatus(message) {
  statusEl.textContent = message
  statusEl.classList.add('show', 'success')
  setTimeout(() => {
    statusEl.classList.remove('show')
  }, 2000)
}