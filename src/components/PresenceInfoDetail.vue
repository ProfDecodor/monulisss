<template>
  <div class="col">
    <div v-if="calendarStore.loading || !presenceData" 
         class="spinner-border text-secondary" role="status">
      <span class="visually-hidden">Chargement...</span>
    </div>

    <div v-else-if="calendarStore.error" class="alert alert-danger">
      ❌ {{ calendarStore.error }}
    </div>

    <div v-else>
      <div v-if="presenceData.presenceRate !== null">
        <div class="row">
          <div class="col text-center fs-3"><span data-bs-toggle="tooltip" data-bs-placement="top" title="Jours de travail" style="cursor: help;">📆 {{ presenceData.workingDays }}</span></div>
          <div class="col text-center fs-3 border-start border-end"><span data-bs-toggle="tooltip" data-bs-placement="top" title="Jours de télétravail" style="cursor: help;">🏠 {{ presenceData.homeworkingDays }}</span></div>
          <div class="col text-center fs-3"><span data-bs-toggle="tooltip" data-bs-placement="top" title="Jours en présentiel" style="cursor: help;">🏢 {{ presenceData.presenceDays }}</span></div>
          <div v-if="presenceData.invalidActivities > 0" class="col text-center fs-3 border-start text-danger"><span data-bs-toggle="tooltip" data-bs-placement="top" title="Erreur de pointage" style="cursor: help;">❗ {{ presenceData.invalidActivities }}</span></div>
        </div>
      </div>

      <div v-else class="text-muted">
        Aucune donnée de présence.
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useCalendarStore } from '@/stores/calendarStore'
import { useSelectedMonthStore } from '@/stores/selectedMonthStore'

const userStore = useUserStore()
const calendarStore = useCalendarStore()
const monthStore = useSelectedMonthStore()

const presenceData = computed(() => {
  if (!userStore.user?.permat || !calendarStore.hasData) return null
  const presenceDetails = {};
  presenceDetails.workingDays = calendarStore.getWorkingDaysForPermat(userStore.user.permat)
  presenceDetails.homeworkingDays = calendarStore.getHomeworkingDaysForPermat(userStore.user.permat)
  presenceDetails.presenceDays = calendarStore.getPresenceDaysForPermat(userStore.user.permat)
  presenceDetails.invalidActivities = calendarStore.getInvalidActivitiesForPermat(userStore.user.permat)
  return presenceDetails;
})

async function fetchData() {
  if (!userStore.user?.permat) return
  
  /*await calendarStore.fetchCalendar(
    [userStore.user.permat],
    monthStore.startDate,
    monthStore.endDate
  )*/
}

onMounted(fetchData)

// Recharger quand le mois change
watch([() => monthStore.startDate, () => monthStore.endDate], fetchData)

// Recharger quand l'utilisateur est disponible
watch(() => userStore.user, fetchData)
</script>

<style scoped>
</style>