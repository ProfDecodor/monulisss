<template>
  
    <div v-if="userStore.loadingAgendas">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
    </div>

    <div v-else-if="userStore.agendas">
      {{userStore.agendas}}
    </div>

</template>

<script setup>
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()
</script>