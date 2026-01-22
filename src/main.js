import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')

// Afficher la version depuis le manifest
document.getElementById('version').textContent = 'version ' + browser.runtime.getManifest().version