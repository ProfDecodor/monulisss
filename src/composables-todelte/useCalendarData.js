import { ref } from 'vue'

const API_DATA = 'https://myulis.etnic.be/api/data'

export function useCalendarData() {
  const loading = ref(false)
  const error = ref(null)
  const result = ref(null)

  async function getCalendar(permats, startDate, endDate) {
    loading.value = true
    error.value = null

    const dd = startDate.toLocaleDateString('fr-CA').split("T")[0] // fr-CA car date au format yyyy-mm-dd exigée par myulis

// Si le mois est en cours, on prend hier comme date de fin
const today = new Date()
const isCurrentMonth = startDate.getMonth() === today.getMonth() && startDate.getFullYear() === today.getFullYear()

const adjustedEndDate = isCurrentMonth ? new Date(today.setDate(today.getDate() - 1)) : endDate

const df = adjustedEndDate.toLocaleDateString('fr-CA').split("T")[0]

    const makePayload = (types) => ({
      types,
      permats,
      dd,
      df
    })

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

      result.value = await Promise.all(responses.map(r => r.json()))
    } catch (err) {
      error.value = err.message || 'Erreur inconnue'
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    result,
    getCalendar
  }
}