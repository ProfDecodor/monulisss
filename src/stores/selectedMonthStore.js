import { defineStore } from 'pinia'
import { startOfMonth, endOfMonth } from 'date-fns'

export const useSelectedMonthStore = defineStore('selectedMonth', {
  state: () => ({
    selectedMonth: new Date() // Mois courant par défaut
  }),

  getters: {
    monthLabel: (state) =>
      state.selectedMonth.toLocaleDateString('fr-BE', { 
        year: 'numeric', 
        month: 'long' 
      }),

    startDate: (state) => {
      const start = startOfMonth(state.selectedMonth)
      return new Date(start.getFullYear(), start.getMonth(), 1, 0, 0, 0, 0)
    },
    
    endDate: (state) => {
      const end = endOfMonth(state.selectedMonth)
      return end
      /*console.log("end")
      console.log(end)
      console.log("new date")
      console.log(new Date(
        end.getFullYear(),
        end.getMonth(),
        end.getDate() - 1,
        23, 59, 59, 999
      ))
      return new Date(
        end.getFullYear(),
        end.getMonth(),
        end.getDate() - 1,
        23, 59, 59, 999
      )*/
    },

    formattedValue: (state) => {
      const year = state.selectedMonth.getFullYear()
      const month = String(state.selectedMonth.getMonth() + 1).padStart(2, '0')
      return `${year}-${month}`
    }
  },

  actions: {
    setMonthFromString(str) {
      // str format: '2025-05'
      const [year, month] = str.split('-')
      this.selectedMonth = new Date(year, parseInt(month) - 1)
    },

    setMonth(date) {
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