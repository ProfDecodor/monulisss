import { ref, computed } from 'vue'
import { startOfMonth, endOfMonth } from 'date-fns'

const selectedMonth = ref(new Date()) // Mois courant par défaut

export function useSelectedMonth() {
  const monthLabel = computed(() =>
    selectedMonth.value.toLocaleDateString('fr-BE', { year: 'numeric', month: 'long' })
  )

  const dd = computed(() => {
    const start = startOfMonth(selectedMonth.value)
    return new Date(
      start.getFullYear(),
      start.getMonth(),
      1,
      0,0,0,0
    )
  })
  
  const df = computed(() => {
    const end = endOfMonth(selectedMonth.value)
    return new Date(
      end.getFullYear(),
      end.getMonth(),
      end.getDate()-1,
      23,59,59,999
    )
  })

  function setMonthFromString(str) {
    // str format: '2025-05'
    const [year, month] = str.split('-')
    selectedMonth.value = new Date(year, parseInt(month) - 1)
  }

  return {
    selectedMonth,
    monthLabel,
    dd,
    df,
    setMonthFromString
  }
}