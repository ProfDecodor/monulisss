/**
 * Constantes métier pour l'application MonUlisss
 * Centralise tous les codes utilisés par l'API myUlis
 */

// URL de base de l'API myUlis
export const API_BASE_URL = 'https://myulis.etnic.be'
export const API_DATA_ENDPOINT = `${API_BASE_URL}/api/data`
export const API_USER_ENDPOINT = `${API_BASE_URL}/api/user/me`
export const API_AGENDAS_ENDPOINT = `${API_BASE_URL}/api/autorisation/getPopulationAgenda`

// Types de données récupérées depuis l'API
export const DATA_TYPES = {
  FERMETURE: 'FERMETURE',
  ABSENCES: 'ABSENCES',
  POINTAGES: 'POINTAGES'
}

// Codes de pointage considérés comme présence
export const PRESENCE_CODES = [
  'POI',      // Pointage standard
  'PRES',     // Présence
  'FOR1',     // Formation type 1
  'FOR2',     // Formation type 2
  'PRE',      // Présentiel
  'MIE1',     // Mission externe type 1
  'MIBE',     // Mission interne/externe
  'MIS',      // Mission
  'MIS1',     // Mission type 1
  'MIS1-HR',  // Mission type 1 hors résidence
  'ASPO',     // Absence sportive
  'ASPO2'     // Absence sportive (>limite)
]

// Codes de pointage d'entrée/sortie
export const CLOCK_IN_CODES = ['POI-IN', 'MIS-IN']
export const CLOCK_OUT_CODES = ['POI-OUT', 'MIS-OUT']

// Codes d'absence à exclure du calcul des jours travaillés (temps partiel)
export const EXCLUDED_ABSENCE_CODES = ['ETPEVE', 'MALCER']

// Code de retour maladie (à soustraire des jours travaillés)
export const SICK_RETURN_CODE = 'RETM'

// Catégorie d'absence pour les congés
export const LEAVE_CATEGORY = 'CONGE'

// Code spécial pour les fermetures (jour considéré comme ouvré malgré FERMETURE)
export const SPECIAL_OPENING_CODE = 'ULIMIN'

// Mode d'agenda à exclure
export const EXCLUDED_AGENDA_MODE = 'calendarDiscreet'

// Seuils de durée pour le calcul des jours
export const DURATION_THRESHOLDS = {
  FULL_DAY: 5,    // >= 5h = 1 jour
  HALF_DAY: 2     // >= 2h = 0.5 jour
}

// Seuils de taux de présence pour l'affichage couleur
export const RATE_THRESHOLDS = {
  LOW: 40,        // < 40% = rouge
  MEDIUM: 50      // < 50% = orange, >= 50% = vert
}

// Couleurs associées aux seuils
export const RATE_COLORS = {
  LOW: '#e74c3c',     // Rouge
  MEDIUM: '#f39c12',  // Orange
  HIGH: '#27ae60'     // Vert
}

// Configuration du retry pour les appels API
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  BASE_DELAY_MS: 1000,  // Délai initial en ms
  BACKOFF_FACTOR: 2     // Facteur multiplicateur pour backoff exponentiel
}

// Headers HTTP standards pour les requêtes vers myUlis
export const API_HEADERS = {
  'Content-Type': 'application/json',
  'Referer': `${API_BASE_URL}/`,
  'Origin': API_BASE_URL
}