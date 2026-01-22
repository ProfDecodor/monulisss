<template>
  <div class="p-3" :class="{ 'ugly-mode': uglyMode }">
    <!-- Si on est sur myulis -->
    <div v-if="tabStore.isOnMyulis">
      <div v-if="userStore.loading">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Chargement...</span>
        </div>
      </div>

      <div v-else-if="userStore.user">
        <div class="row align-items-center mb-2">
          <div class="col-8 border-end">
            <IdentityInfo />
          </div>
          <div class="col">
            <PresenceInfo />
          </div>
        </div>
        <div class="row align-items-center border-top border-bottom mb-4 py-1">
          <PresenceInfoDetail />
        </div>
        <div class="row mb-3">
          <div class="col">
            <MonthSelector />
          </div>
        </div>
        <div class="row mb-3">
          <div class="col">
            <AgendaSelector />
          </div>
        </div>
      </div>

      <div v-else class="alert alert-danger">
        ❌ Impossible de récupérer l'identité.
        <div v-if="userStore.error" class="small text-muted mt-1">
          {{ userStore.error }}
        </div>
      </div>
    </div>

    <!-- Si on n'est PAS sur myulis -->
    <div v-else class="text-center">
      <div class="alert alert-warning">
        Vous n'êtes pas sur <strong>myulis.etnic.be</strong>.
      </div>

      <div v-if="tabStore.loading">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Chargement...</span>
        </div>
      </div>

      <button
        v-else
        @click="tabStore.redirectToMyulis"
        class="btn btn-primary"
      >
        Aller sur MyULiS
      </button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import IdentityInfo from './components/IdentityInfo.vue'
import PresenceInfo from './components/PresenceInfo.vue'
import PresenceInfoDetail from './components/PresenceInfoDetail.vue'
import MonthSelector from './components/MonthSelector.vue'
import AgendaSelector from "./components/AgendaSelector.vue";
import { useUserStore } from './stores/userStore'
import { useTabStore } from './stores/tabStore'
import { isUglyModeEnabled } from './utils/settings'

const userStore = useUserStore()
const tabStore = useTabStore()
const uglyMode = ref(false)

onMounted(async () => {
  uglyMode.value = await isUglyModeEnabled()
  if (uglyMode.value) {
    document.body.classList.add('ugly-mode')
  }
  await tabStore.getActiveTab()
  if (tabStore.isOnMyulis) {
    await userStore.fetchUserData()
  }
})

// Charger les données utilisateur après une redirection vers MyUlis
watch(() => tabStore.isOnMyulis, async (isOnMyulis) => {
  if (isOnMyulis && !userStore.user && !userStore.loading) {
    await userStore.fetchUserData()
  }
})
</script>

