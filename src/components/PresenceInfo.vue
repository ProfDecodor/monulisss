<template>
    <div v-if="calendarStore.loading || !presenceData" 
         class="spinner-border text-secondary" role="status">
      <span class="visually-hidden">Chargement...</span>
    </div>

    <div v-else-if="calendarStore.error" class="alert alert-danger">
      ❌ {{ calendarStore.error }}
    </div>

    <div v-else>
      <div v-if="presenceData.presenceRate !== null"
           class="d-flex justify-content-center my-4">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle
            cx="60" cy="60" r="54"
            stroke="#e6e6e6" stroke-width="12" fill="none"
          />
          <circle
            cx="60" cy="60" r="54"
            :stroke="circleColor" stroke-width="12" fill="none"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="strokeOffset"
            transform="rotate(-90 60 60)"
          />
          <text
            x="50%" y="50%"
            dominant-baseline="middle" text-anchor="middle"
            font-size="22" font-weight="bold"
          >
            {{ presenceData.presenceRate }}%
          </text>
        </svg>
      </div>

      <div v-else class="text-muted"e >
        Aucune donnée de présence.
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
  return calendarStore.getPresenceDataForPermat(userStore.user.permat)
})

const circumference = 2 * Math.PI * 54

const strokeOffset = computed(() =>
  presenceData.value?.presenceRate !== null
    ? circumference * (1 - presenceData.value.presenceRate / 100)
    : circumference
)

const circleColor = computed(() => {
  const rate = presenceData.value?.presenceRate
  if (!rate) return '#e6e6e6'
  if (rate < 40) return '#e74c3c' // rouge
  if (rate < 50) return '#f39c12' // orange
  return '#27ae60' // vert
})

async function fetchData() {
  if (!userStore.user?.permat) return
  
  await calendarStore.fetchCalendar(
    [userStore.user.permat],
    monthStore.startDate,
    monthStore.endDate
  )
}

onMounted(fetchData)

// Recharger quand le mois change
watch([() => monthStore.startDate, () => monthStore.endDate], fetchData)

// Recharger quand l'utilisateur est disponible
watch(() => userStore.user, fetchData)

</script>

<style scoped>
circle {
  transition: stroke-dashoffset 1s ease;
}
</style>