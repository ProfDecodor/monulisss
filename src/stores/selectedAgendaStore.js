import { defineStore } from 'pinia'

export const useSelectedAgendaStore = defineStore('selectedAgenda', {
  state: () => ({
    // la valeur de 0 sera interprétée par le composant AgendaSelector. ne pas modifier.
    selectedAgenda: 0
  }),

  getters: {
    agenda: (state) => {
      return state.selectedAgenda
    }
  },

  actions: {
    setAgenda(agendaId) {
      this.selectedAgenda = agendaId
    },
  }
})