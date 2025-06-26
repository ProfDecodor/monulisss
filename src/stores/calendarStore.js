import { defineStore } from 'pinia'
import { useSelectedMonthStore } from './selectedMonthStore'

const API_DATA = 'https://myulis.etnic.be/api/data'

export const useCalendarStore = defineStore('calendar', {
  state: () => ({
    calendarSets: null,
    loading: false,
    error: null,
    lastFetchParams: null // Pour éviter les appels redondants
  }),

  getters: {
    hasData: (state) => !!state.calendarSets?.length,
    
    // Calculateurs de présence pour un permat donné
    getPresenceDataForPermat: (state) => (permat) => {
      if (!state.calendarSets?.length) return null
      
      return {
        presenceRate: state.getPresenceRateForPermat(permat),
        presenceDays: state.computePresenceDays(permat),
        workingDays: state.computeWorkingDays(permat),
        homeworkingDays: state.computeHomeworkingDays(permat),
        invalidActivities: state.computeInvalidActivities(permat)
      }
    }
  },

  actions: {
    async fetchCalendar(permats, startDate, endDate) {
      // Éviter les appels redondants
      const params = { permats, startDate: startDate.getTime(), endDate: endDate.getTime() }
      if (JSON.stringify(params) === JSON.stringify(this.lastFetchParams)) {
        return
      }

      this.loading = true
      this.error = null

      const dd = startDate.toLocaleDateString('fr-CA').split("T")[0] // fr-CA car date au format yyyy-mm-dd exigée par myulis
      
      // Si le mois est en cours, on prend hier comme date de fin
      const today = new Date()
      const isCurrentMonth = startDate.getMonth() === today.getMonth() && 
                           startDate.getFullYear() === today.getFullYear()
      
      const adjustedEndDate = isCurrentMonth ? 
        new Date(today.setDate(today.getDate() - 1)) : endDate

      const df = adjustedEndDate.toLocaleDateString('fr-CA').split("T")[0] // fr-CA car date au format yyyy-mm-dd exigée par myulis

      const makePayload = (types) => ({ types, permats, dd, df })

      try {
        const responses = await Promise.all([
          fetch(API_DATA, {
            method: 'POST',
            body: JSON.stringify(makePayload(["FERMETURE"])),
            headers: { 'Content-Type': 'application/json' }
          }),
          fetch(API_DATA, {
            method: 'POST',
            body: JSON.stringify(makePayload(["ABSENCES"])),
            headers: { 'Content-Type': 'application/json' }
          }),
          fetch(API_DATA, {
            method: 'POST',
            body: JSON.stringify(makePayload(["POINTAGES"])),
            headers: { 'Content-Type': 'application/json' }
          })
        ])

        this.calendarSets = await Promise.all(responses.map(r => r.json()))
        this.lastFetchParams = params
      } catch (err) {
        this.error = err.message || 'Erreur inconnue'
        this.calendarSets = null
      } finally {
        this.loading = false
      }
    },

    // ///////////////////////////////////////////////////////////////////////////////
    // 
    // METHODES DE CALCUL
    //
    // ///////////////////////////////////////////////////////////////////////////////

    /**
     * Le jour est il un jour ouvré (un jour à compter comme jour de travail)
     * @param {*} permat 
     * @param {*} day 
     * @returns 
     */
    isOpeningDay(permat, day) {
      if (!this.calendarSets) return true
      
      for (const calendar of this.calendarSets) {
        for (const event of calendar) {
          if (
            event.type === "FERMETURE" &&
            event.permat === permat &&
            event.day === day
          ) {
            // prise en compte du code ULIMIN ... ce truc est apparu chez SGL et a disparu ..
            if (!event.payload || event.payload.code === "ULIMIN") {
              return true
            }
            return false
          }
        }
      }
      return true
    },

    /**
     * Calculer le nombre de jour de présence ou assimilé
     * @param {*} permat 
     * @returns 
     */
    computePresenceDays(permat) {
      if (!this.calendarSets) return 0
      
      let count = 0
      this.calendarSets.forEach((set) => {
        set.forEach((event) => {
          if (
            event.type === "POINTAGES" &&
            event.permat === permat &&
            this.isOpeningDay(permat, event.day)
          ) {
            let totalForDay = 0
            let inTime = null

            for (const p of event.payload.pointages || []) {
              const { code } = p.nature

              if (["POI-IN", "MIS-IN"].includes(code)) {
                inTime = new Date(`2000-01-01T${p.in}Z`)
              } else if (["POI-OUT", "MIS-OUT"].includes(code) && inTime) {
                const outTime = new Date(`2000-01-01T${p.out}Z`)
                const duration = (outTime - inTime) / 3600000
                totalForDay += duration >= 5 ? 1 : duration >= 2 ? 0.5 : 0
                inTime = null
              } else if (
                [
                  "POI", "PRES", "FOR1", "FOR2", "PRE", "MIE1", 
                  "MIBE", "MIS", "MIS1", "MIS1-HR"
                ].includes(code)
              ) {
                const timeStart = new Date(`2000-01-01T${p.in}Z`)
                const timeEnd = new Date(`2000-01-01T${p.out}Z`)
                const duration = (timeEnd - timeStart) / 3600000
                totalForDay += duration >= 5 ? 1 : duration >= 2 ? 0.5 : 0
              }
            }

            count += Math.min(totalForDay, 1) // max 1 par jour
          }
        })
      })
      return count
    },

    /**
     * Calcule le nombre de jour travaillés
     * @param {*} permat 
     * @returns 
     */
    computeWorkingDays(permat) {
      if (!this.calendarSets) return 0
      
      let count = 0
      this.calendarSets.forEach((set) => {
        set.forEach((event) => {
          const isWorkDay = event.permat === permat && this.isOpeningDay(permat, event.day)
          /*
            Avec ceci on va prendre
              - les pointages physiques (dans le batiment, à la pointeuse)
              - les présentiels etnic
              - les télétravails
              - les congés
              - les missions, formations etc

              et on ne prend que les jours ouvrés. pas les fermetures
          */
          if (
            event.type === "POINTAGES" &&
            isWorkDay &&
            event.payload.pointages?.length
          ) {
            count++
          }

          /*
            On enlève les jours de congés pour avoir un solde cohérent
            on exclus les codes suivant car lié à du temps partiel :  ETPEVE, MALCER
            on fait par contre attention à enlever par demi journée
            //TODO : Enelever les autres codes
          */
          if (event.type === "ABSENCES" && isWorkDay && event.payload?.length) {
            let hours = 0
            for (const absence of event.payload) {
              if (
                absence.category === "CONGE" &&
                !["ETPEVE", "MALCER"].includes(absence.lid.TYPE)
              ) {
                const start = new Date(`2000-01-01T${absence.computedStartTime}Z`)
                const end = new Date(`2000-01-01T${absence.computedEndTime}Z`)
                hours += (end - start) / 3600000 // la diff est en millisecondes
              }
            }
            if (hours >= 5) count--
            else if (hours >= 2) count -= 0.5
          }

          /*
            On enlève les cas de pointages particuliers
              - RETM (retour de maladie)
          */
          if (
            event.type === "POINTAGES" &&
            isWorkDay &&
            event.payload.pointages?.length
          ) {
            let hours = 0
            for (const p of event.payload.pointages) {
              if (p.nature.code === "RETM") {
                const start = new Date(`2000-01-01T${p.in}Z`)
                const end = new Date(`2000-01-01T${p.out}Z`)
                hours += (end - start) / 3600000
              }
            }
            if (hours >= 5) count--
            else if (hours >= 2) count -= 0.5
          }
        })
      })
      return count
    },

    /**
     * Calcule le télétravail
     * @param {*} permat 
     * @returns 
     */
    computeHomeworkingDays(permat) {
      if (!this.calendarSets) return 0
      
      let count = 0
      this.calendarSets.forEach((set) => {
        set.forEach(event => {
          if (
            event.type === "POINTAGES" &&
            event.permat === permat &&
            Array.isArray(event.payload?.pointages)
          ) {
            event.payload.pointages.forEach(pointage => {
              if (pointage.teletravail === true) {
                const timeStart = new Date(`2000-01-01T${pointage.in}Z`)
                const timeEnd = new Date(`2000-01-01T${pointage.out}Z`)
                const duration = (timeEnd - timeStart) / 3600000

                if (duration >= 5) {
                  count += 1
                } else if (duration >= 2) {
                  count += 0.5
                }
              }
            })
          }
        })
      })
      return count
    },

    /**
     * Calcule le nombre de pointages en erreur
     * @param {*} permat 
     * @returns 
     */
    computeInvalidActivities(permat) {
      if (!this.calendarSets) return 0
      
      let count = 0
      this.calendarSets.forEach((set) => {
        set.forEach(event => {
          const isInvalid =
            event.type === "POINTAGES" &&
            event.permat === permat &&
            event.payload?.bilan?.TYPE === "INVALID"

          if (isInvalid) {
            count++
          }
        })
      })
      return count
    },

    /**
     * Retourne le taux de présence pour un utilisateur
     * @param {Ca} permat 
     * @returns 
     */
    getPresenceRateForPermat(permat) {
      const presence = this.computePresenceDays(permat)
      const working = this.computeWorkingDays(permat)
      return working > 0 ? Math.floor((100 * presence) / working) : 0
    },

    getWorkingDaysForPermat(permat) {
      return this.computeWorkingDays(permat)
    },

    getHomeworkingDaysForPermat(permat) {
      return this.computeHomeworkingDays(permat)
    },

    getPresenceDaysForPermat(permat) {
      return this.computePresenceDays(permat)
    },

    getInvalidActivitiesForPermat(permat) {
      return this.computeInvalidActivities(permat);
    },

    clearData() {
      this.calendarSets = null
      this.error = null
      this.lastFetchParams = null
    }
  }
})