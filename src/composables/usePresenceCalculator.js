/**
 * Composable pour le calcul des métriques de présence
 * Optimisé pour calculer toutes les métriques en une seule passe
 */

import { ref, computed } from 'vue'
import {
  DATA_TYPES,
  PRESENCE_CODES,
  CLOCK_IN_CODES,
  CLOCK_OUT_CODES,
  EXCLUDED_ABSENCE_CODES,
  SICK_RETURN_CODE,
  LEAVE_CATEGORY,
  SPECIAL_OPENING_CODE,
  DURATION_THRESHOLDS
} from '@/constants'
import { calculateDurationHours, hoursToDayFraction } from '@/utils/api'

/**
 * Crée une instance du calculateur de présence
 * @returns {Object} API du composable
 */
export function usePresenceCalculator() {
  // Cache des métriques calculées par permat
  const metricsCache = ref(new Map())

  // Référence aux données du calendrier
  const calendarData = ref(null)

  /**
   * Définit les données du calendrier et invalide le cache
   * @param {Array} data - Données du calendrier (tableau de sets)
   */
  function setCalendarData(data) {
    calendarData.value = data
    metricsCache.value.clear()
  }

  /**
   * Vérifie si un jour est un jour ouvré pour un permat donné
   * @param {number} permat - Identifiant de l'employé
   * @param {string} day - Date au format YYYY-MM-DD
   * @returns {boolean}
   */
  function isOpeningDay(permat, day) {
    if (!calendarData.value) return true

    for (const calendar of calendarData.value) {
      for (const event of calendar) {
        if (
          event.type === DATA_TYPES.FERMETURE &&
          event.permat === permat &&
          event.day === day
        ) {
          // Prise en compte du code ULIMIN (jour ouvré malgré fermeture)
          if (!event.payload || event.payload.code === SPECIAL_OPENING_CODE) {
            return true
          }
          return false
        }
      }
    }
    return true
  }

  /**
   * Calcule toutes les métriques pour un permat en une seule passe
   * @param {number} permat - Identifiant de l'employé
   * @returns {Object} Métriques calculées
   */
  function computeAllMetrics(permat) {
    if (!calendarData.value) {
      return {
        presenceDays: 0,
        workingDays: 0,
        homeworkingDays: 0,
        invalidActivities: 0
      }
    }

    // Vérifier le cache
    if (metricsCache.value.has(permat)) {
      return metricsCache.value.get(permat)
    }

    // Structures pour accumuler les données par jour
    const dayData = new Map()

    // Première passe : collecter toutes les données par jour
    for (const set of calendarData.value) {
      for (const event of set) {
        if (event.permat !== permat) continue

        const day = event.day
        if (!dayData.has(day)) {
          dayData.set(day, {
            isOpening: isOpeningDay(permat, day),
            pointages: [],
            absences: [],
            isInvalid: false
          })
        }

        const data = dayData.get(day)

        if (event.type === DATA_TYPES.POINTAGES) {
          if (event.payload?.pointages) {
            data.pointages.push(...event.payload.pointages)
          }
          if (event.payload?.bilan?.TYPE === 'INVALID') {
            data.isInvalid = true
          }
        }

        if (event.type === DATA_TYPES.ABSENCES && event.payload?.length) {
          data.absences.push(...event.payload)
        }
      }
    }

    // Deuxième passe : calculer les métriques
    let presenceDays = 0
    let workingDays = 0
    let homeworkingDays = 0
    let invalidActivities = 0

    for (const [day, data] of dayData) {
      if (!data.isOpening) continue

      // Comptage des erreurs
      if (data.isInvalid) {
        invalidActivities++
      }

      // Calcul des jours travaillés
      if (data.pointages.length > 0) {
        workingDays++

        // Soustraction des congés
        let leaveHours = 0
        for (const absence of data.absences) {
          if (
            absence.category === LEAVE_CATEGORY &&
            !EXCLUDED_ABSENCE_CODES.includes(absence.lid?.TYPE)
          ) {
            leaveHours += calculateDurationHours(
              absence.computedStartTime,
              absence.computedEndTime
            )
          }
        }
        workingDays -= hoursToDayFraction(leaveHours)

        // Soustraction des retours maladie
        let sickReturnHours = 0
        for (const pointage of data.pointages) {
          if (pointage.nature?.code === SICK_RETURN_CODE) {
            sickReturnHours += calculateDurationHours(pointage.in, pointage.out)
          }
        }
        workingDays -= hoursToDayFraction(sickReturnHours)
      }

      // Calcul des jours de présence et télétravail
      let dayPresence = 0
      let dayHomeworking = 0
      let inTime = null

      for (const pointage of data.pointages) {
        const code = pointage.nature?.code

        // Gestion des paires IN/OUT
        if (CLOCK_IN_CODES.includes(code)) {
          inTime = new Date(`2000-01-01T${pointage.in}Z`)
        } else if (CLOCK_OUT_CODES.includes(code) && inTime) {
          const outTime = new Date(`2000-01-01T${pointage.out}Z`)
          const duration = (outTime - inTime) / 3600000
          dayPresence += hoursToDayFraction(duration)
          inTime = null
        } else if (PRESENCE_CODES.includes(code)) {
          // Codes de présence standard
          const duration = calculateDurationHours(pointage.in, pointage.out)
          dayPresence += hoursToDayFraction(duration)
        }

        // Comptage du télétravail
        if (pointage.teletravail === true) {
          const duration = calculateDurationHours(pointage.in, pointage.out)
          dayHomeworking += hoursToDayFraction(duration)
        }
      }

      presenceDays += Math.min(dayPresence, 1) // Max 1 jour par jour
      homeworkingDays += dayHomeworking
    }

    // Stocker en cache
    const metrics = {
      presenceDays,
      workingDays,
      homeworkingDays,
      invalidActivities
    }
    metricsCache.value.set(permat, metrics)

    return metrics
  }

  /**
   * Calcule le taux de présence pour un permat
   * @param {number} permat - Identifiant de l'employé
   * @returns {number} Taux de présence (0-100)
   */
  function getPresenceRate(permat) {
    const metrics = computeAllMetrics(permat)
    if (metrics.workingDays <= 0) return 0
    return Math.floor((100 * metrics.presenceDays) / metrics.workingDays)
  }

  /**
   * Récupère une métrique spécifique pour un permat
   * @param {number} permat - Identifiant de l'employé
   * @param {string} metricName - Nom de la métrique
   * @returns {number}
   */
  function getMetric(permat, metricName) {
    const metrics = computeAllMetrics(permat)
    return metrics[metricName] ?? 0
  }

  // Getters pratiques
  const getPresenceDays = (permat) => getMetric(permat, 'presenceDays')
  const getWorkingDays = (permat) => getMetric(permat, 'workingDays')
  const getHomeworkingDays = (permat) => getMetric(permat, 'homeworkingDays')
  const getInvalidActivities = (permat) => getMetric(permat, 'invalidActivities')

  /**
   * Vérifie si des données sont disponibles
   */
  const hasData = computed(() => {
    return calendarData.value?.length > 0 &&
      calendarData.value.some(set => Array.isArray(set) && set.length > 0)
  })

  /**
   * Vide le cache des métriques
   */
  function clearCache() {
    metricsCache.value.clear()
  }

  return {
    // État
    hasData,

    // Actions
    setCalendarData,
    clearCache,

    // Getters de métriques
    computeAllMetrics,
    getPresenceRate,
    getPresenceDays,
    getWorkingDays,
    getHomeworkingDays,
    getInvalidActivities
  }
}