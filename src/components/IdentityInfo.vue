<template>
  
    <div v-if="userStore.loading">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
    </div>

    <div v-else-if="userStore.user">
      <div class="display-3 text-end">{{ userStore.user.prenom }}</div>
      <div class="display-3 text-end">{{ userStore.user.nom }}</div>
    </div>

    <div v-else class="alert alert-danger">
      ❌ Impossible de récupérer l'identité.
    </div>
  
</template>

<script setup>
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()
</script>