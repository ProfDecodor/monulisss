<template>
    <label for="month-select" class="form-label">Mois sélectionné</label>
    <select
      id="month-select"
      class="form-select"
      :value="monthStore.formattedValue"
      @change="onChange"
    >
      <option
        v-for="month in months"
        :key="month.value"
        :value="month.value"
      >
        {{ month.label }}
      </option>
    </select>
  
</template>

<script setup>
import { computed } from 'vue'
import { useSelectedMonthStore } from '@/stores/selectedMonthStore'
import { format, subMonths } from 'date-fns'
import { fr } from 'date-fns/locale'

const monthStore = useSelectedMonthStore()

// Générer les 12 derniers mois
const months = computed(() => 
  Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i)
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy', { locale: fr })
    }
  })
)

function onChange(e) {
  monthStore.setMonthFromString(e.target.value)
}
</script>