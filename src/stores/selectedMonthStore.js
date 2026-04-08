import { defineStore } from 'pinia'
import { startOfMonth, endOfMonth } from 'date-fns'

const QUARTER_MONTH_RANGES = ['jan. - mars', 'avr. - juin', 'juil. - sept.', 'oct. - déc.']
const QUARTER_ORDINALS = ['1er', '2e', '3e', '4e']

function currentQuarterNum() {
  return Math.floor(new Date().getMonth() / 3) + 1
}

export const useSelectedMonthStore = defineStore('selectedMonth', {
  state: () => ({
    selectedMonth: new Date(), // Mois courant par défaut
    isQuarter: false,
    quarterYear: null,
    quarterNum: null   // 1-4
  }),

  getters: {
    isCurrentQuarter: (state) => {
      if (!state.isQuarter) return false
      const now = new Date()
      return state.quarterYear === now.getFullYear() && state.quarterNum === currentQuarterNum()
    },

    monthLabel(state) {
      if (state.isQuarter) {
        const base = `${QUARTER_ORDINALS[state.quarterNum - 1]} trimestre ${state.quarterYear} (${QUARTER_MONTH_RANGES[state.quarterNum - 1]})`
        return this.isCurrentQuarter ? `${base} — en cours` : base
      }
      return state.selectedMonth.toLocaleDateString('fr-BE', {
        year: 'numeric',
        month: 'long'
      })
    },

    startDate: (state) => {
      if (state.isQuarter) {
        return new Date(state.quarterYear, (state.quarterNum - 1) * 3, 1, 0, 0, 0, 0)
      }
      const start = startOfMonth(state.selectedMonth)
      return new Date(start.getFullYear(), start.getMonth(), 1, 0, 0, 0, 0)
    },

    endDate(state) {
      if (state.isQuarter) {
        if (this.isCurrentQuarter) {
          // Trimestre en cours : jusqu'à hier
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          return new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999)
        }
        return endOfMonth(new Date(state.quarterYear, state.quarterNum * 3 - 1))
      }
      return endOfMonth(state.selectedMonth)
    },

    formattedValue: (state) => {
      if (state.isQuarter) {
        return `${state.quarterYear}-Q${state.quarterNum}`
      }
      const year = state.selectedMonth.getFullYear()
      const month = String(state.selectedMonth.getMonth() + 1).padStart(2, '0')
      return `${year}-${month}`
    }
  },

  actions: {
    setMonthFromString(str) {
      // str format: '2025-05'
      const [year, month] = str.split('-')
      this.isQuarter = false
      this.quarterYear = null
      this.quarterNum = null
      this.selectedMonth = new Date(year, parseInt(month) - 1)
    },

    setQuarterFromString(str) {
      // str format: '2025-Q3'
      const [year, q] = str.split('-Q')
      this.isQuarter = true
      this.quarterYear = parseInt(year)
      this.quarterNum = parseInt(q)
    },

    setMonth(date) {
      this.isQuarter = false
      this.quarterYear = null
      this.quarterNum = null
      this.selectedMonth = new Date(date)
    },

    goToPreviousMonth() {
      const newMonth = new Date(this.selectedMonth)
      newMonth.setMonth(newMonth.getMonth() - 1)
      this.selectedMonth = newMonth
    },

    goToNextMonth() {
      const newMonth = new Date(this.selectedMonth)
      newMonth.setMonth(newMonth.getMonth() + 1)
      this.selectedMonth = newMonth
    }
  }
})