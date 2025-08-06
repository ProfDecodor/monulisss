<template>
  <div v-if="userStore.loadingAgendas">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Chargement...</span>
    </div>
  </div>

  <div v-else-if="userStore.agendas && userStore.agendas.length > 0">
    <label for="agenda-select" class="form-label">Calendrier sélectionné</label>
    <select
        id="agenda-select"
        class="form-select mb-3"
        :value="agendaStore.selectedAgenda"
        @change="onChange"
    >
      <option
          v-for="agenda in userStore.agendas"
          :key="agenda.id"
          :value="agenda.id"
      >
        {{ agenda.label }}
      </option>
    </select>

    <!-- Indicateur de chargement des données calendrier -->
    <div v-if="calendarStore.loading" class="d-flex align-items-center mb-3">
      <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
        <span class="visually-hidden">Chargement des données...</span>
      </div>
      <span class="text-muted">Chargement des données du calendrier...</span>
    </div>

    <!-- Message d'erreur -->
    <div v-if="calendarStore.error" class="alert alert-danger" role="alert">
      <i class="bi bi-exclamation-triangle me-2"></i>
      Erreur lors du chargement des données : {{ calendarStore.error }}
    </div>

    <!-- Tableau des utilisateurs -->
    <div v-if="selectedAgendaUsers.length > 0" class="table-responsive">
      <table class="table table-striped table-hover">
        <thead class="table-dark">
        <tr>
          <th scope="col">Permat</th>
          <th scope="col">Nom</th>
          <th scope="col">Travail</th>
          <th scope="col">TT</th>
          <th scope="col">Sur site</th>
          <th scope="col">Erreurs</th>
          <th scope="col">Taux</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="user in selectedAgendaUsers" :key="user.permat">
          <td>{{ user.permat }}</td>
          <td>
            <div class="d-flex align-items-center">
              <img
                  v-if="user.photo"
                  :src="`https://myulis.etnic.be${user.photo}`"
                  :alt="user.nom"
                  class="rounded-circle me-2"
                  width="32"
                  height="32"
              >
              <span
                  v-else
                  class="badge bg-secondary rounded-circle me-2 d-flex align-items-center justify-content-center"
                  style="width: 32px; height: 32px; font-size: 12px;"
              >
                  {{ user.initiales }}
              </span>
              {{ user.nom }}
            </div>
          </td>
          <td>{{ getUserData(user.permat, 'workingDays') }}</td>
          <td>{{ getUserData(user.permat, 'homeworkingDays') }}</td>
          <td>{{ getUserData(user.permat, 'presenceDays') }}</td>
          <td :class="getErrorClass(getUserData(user.permat, 'invalidActivities'))">
            {{ getUserData(user.permat, 'invalidActivities') }}
          </td>
          <td :class="getRateClass(getUserData(user.permat, 'rate'))">
            {{ getUserData(user.permat, 'rate') }}%
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- Message si aucun utilisateur -->
    <div v-else class="alert alert-info" role="alert">
      <i class="bi bi-info-circle me-2"></i>
      Aucun utilisateur dans ce calendrier.
    </div>
  </div>
</template>

<script setup>
import {watch, computed} from 'vue'
import {useUserStore} from '@/stores/userStore'
import {useSelectedAgendaStore} from '@/stores/selectedAgendaStore'
import {useCalendarStore} from "@/stores/calendarStore.js"
import {useSelectedMonthStore} from '@/stores/selectedMonthStore'

const userStore = useUserStore()
const agendaStore = useSelectedAgendaStore()
const calendarStore = useCalendarStore()
const selectedMonthStore = useSelectedMonthStore()

// Computed pour obtenir les utilisateurs de l'agenda sélectionné
const selectedAgendaUsers = computed(() => {
  if (!userStore.agendas || !agendaStore.selectedAgenda) return []

  const selectedAgenda = userStore.agendas.find(
      agenda => agenda.id === agendaStore.selectedAgenda
  )

  return selectedAgenda?.userids || []
})

// Computed pour obtenir les permats des utilisateurs sélectionnés
const selectedPermats = computed(() => {
  return selectedAgendaUsers.value.map(user => user.permat)
})

// Fonction pour charger les données du calendrier
async function loadCalendarData() {
  if (!selectedPermats.value.length || !selectedMonthStore.selectedMonth) {
    return
  }

  const selectedDate = new Date(selectedMonthStore.selectedMonth)
  const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)

  try {
    await calendarStore.fetchCalendar(selectedPermats.value, startDate, endDate)
  } catch (error) {
    console.error('Erreur lors du chargement des données du calendrier:', error)
  }
}

function getUserData(permatNumber, dataType) {

  // Si les données ne sont pas chargées, retourner '?'
  if (!calendarStore.hasData) {
    return '?'
  }

  const permat = Number(permatNumber)

  // Mapper directement les types de données aux méthodes du store
  const dataGetters = {
    workingDays: () => calendarStore.getWorkingDaysForPermat(permat),
    homeworkingDays: () => calendarStore.getHomeworkingDaysForPermat(permat),
    presenceDays: () => calendarStore.getPresenceDaysForPermat(permat),
    invalidActivities: () => calendarStore.getInvalidActivitiesForPermat(permat),
    rate: () => calendarStore.getPresenceRateForPermat(permat)
  }

  const getter = dataGetters[dataType]
  return getter ? getter() : '?'
}

function getRateClass(rate) {
  if (rate < 40) return 'rate-low';
  if (rate >= 40 && rate < 50) return 'rate-medium';
  return 'rate-high';
}

function getErrorClass(errors) {
  if (errors > 0) return 'there-are-errors';
  return 'there-are-no-errors';
}

// Watcher pour mettre une sélection par défaut sur le premier calendrier
watch(
    () => userStore.agendas,
    (newAgendas) => {
      if (newAgendas && newAgendas.length > 0 && agendaStore.selectedAgenda === 0) {
        agendaStore.setAgenda(newAgendas[0].id)
      }
    },
    {immediate: true}
)

// Watcher principal pour charger les données quand l'agenda, les utilisateurs ou le mois change
watch(
    [
      () => agendaStore.selectedAgenda,
      () => selectedPermats.value,
      () => selectedMonthStore.selectedMonth
    ],
    () => {
      loadCalendarData()
    },
    {
      immediate: true,
      deep: true
    }
)

function onChange(e) {
  agendaStore.setAgenda(e.target.value)
}
</script>

<style scoped>
.table img {
  object-fit: cover;
}

.rate-low {
  color: #e74c3c;
}

.rate-medium {
  color: #f39c12;
}

.rate-high {
  color: #27ae60;
}

.there-are-errors {
  color: #E74C3C;
  font-weight: bolder;
}

.there-are-no-errors {
  color: #ececec;
}
</style>