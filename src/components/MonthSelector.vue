<template>
    <label for="month-select" class="form-label">Période sélectionnée</label>
    <select
      id="month-select"
      class="form-select"
      :value="monthStore.formattedValue"
      @change="onChange"
    >
      <optgroup label="Mois">
        <option
          v-for="month in months"
          :key="month.value"
          :value="month.value"
        >
          {{ month.label }}
        </option>
      </optgroup>
      <optgroup label="Trimestres">
        <option
          v-for="quarter in quarters"
          :key="quarter.value"
          :value="quarter.value"
        >
          {{ quarter.label }}
        </option>
      </optgroup>
    </select>
</template>

<script setup>
import { computed } from 'vue'
import { useSelectedMonthStore } from '@/stores/selectedMonthStore'
import { format, subMonths } from 'date-fns'
import { fr } from 'date-fns/locale'

const monthStore = useSelectedMonthStore()

const QUARTER_ORDINALS = ['1er', '2e', '3e', '4e']
const QUARTER_MONTH_RANGES = ['jan. - mars', 'avr. - juin', 'juil. - sept.', 'oct. - déc.']

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

// Générer les 4 derniers trimestres (trimestre courant inclus)
const quarters = computed(() => {
  const now = new Date()
  const currentQuarterNum = Math.floor(now.getMonth() / 3) + 1
  const currentYear = now.getFullYear()

  return Array.from({ length: 4 }, (_, i) => {
    let q = currentQuarterNum - i
    let y = currentYear
    if (q <= 0) {
      q += 4
      y -= 1
    }
    const isCurrent = i === 0
    const label = `${QUARTER_ORDINALS[q - 1]} trimestre ${y} (${QUARTER_MONTH_RANGES[q - 1]})${isCurrent ? ' — en cours' : ''}`
    return { value: `${y}-Q${q}`, label }
  })
})

function onChange(e) {
  const value = e.target.value
  if (value.includes('-Q')) {
    monthStore.setQuarterFromString(value)
  } else {
    monthStore.setMonthFromString(value)
  }
}
</script>