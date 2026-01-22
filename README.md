# MonUlisss

[![GitHub release](https://img.shields.io/github/v/release/ProfDecodor/monulisss?style=flat-square)](https://github.com/ProfDecodor/monulisss/releases)
[![GitHub last commit](https://img.shields.io/github/last-commit/ProfDecodor/monulisss?style=flat-square)](https://github.com/ProfDecodor/monulisss/commits)
[![GitHub issues](https://img.shields.io/github/issues/ProfDecodor/monulisss?style=flat-square)](https://github.com/ProfDecodor/monulisss/issues)
[![License](https://img.shields.io/badge/license-TOKILL-blue?style=flat-square)](#licence)

<div align="center">

### 🦄 Version actuelle

# `0.9.0` — *Cécémel revigorant*

</div>

---

Extension de navigateur (Firefox/Chrome) pour extraire et visualiser les données de présence depuis **myUlis** (système RH de l'ETNIC).

## Fonctionnalités

- Affichage du taux de présence personnel avec indicateur visuel coloré
- Détail des jours travaillés, télétravail et présence sur site
- Sélection de période par mois (12 derniers mois)
- Vue d'équipe avec tableau récapitulatif par agenda/calendrier
- Détection des pointages en erreur
- Retry automatique en cas d'échec réseau

## Installation

### Version stable (recommandée)

La version installable du plugin peut être téléchargée directement :

**[Télécharger MonUlisss (latest.xpi)](https://etnic.perfectday.be/monulisss/latest.xpi)**

### Depuis les sources

```bash
# Cloner le dépôt
git clone https://github.com/ProfDecodor/monulisss.git
cd monulisss

# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Construire pour la production
npm run build
```

## Utilisation

1. Installer l'extension dans Firefox et lui donner les permissions nécessaires
2. Se connecter à [myulis.etnic.be](https://myulis.etnic.be)
3. Cliquer sur l'icône de l'extension dans la barre d'outils
4. Les données de présence s'affichent automatiquement


## Technologies

| Technologie | Usage |
|-------------|-------|
| **Vue.js 3** | Framework frontend |
| **Pinia** | Gestion d'état |
| **Vite** | Build tool |
| **Bootstrap 5** | Interface utilisateur |
| **date-fns** | Manipulation des dates |

## Structure du projet

```
src/
├── components/          # Composants Vue
│   ├── AgendaSelector.vue      # Sélecteur d'agenda + tableau équipe
│   ├── IdentityInfo.vue        # Affichage identité utilisateur
│   ├── MonthSelector.vue       # Sélecteur de mois
│   ├── PresenceInfo.vue        # Cercle de taux de présence
│   └── PresenceInfoDetail.vue  # Détail des statistiques
├── composables/         # Logique réutilisable
│   └── usePresenceCalculator.js  # Calculs de présence optimisés
├── stores/              # Stores Pinia
│   ├── calendarStore.js        # Données calendrier
│   ├── selectedAgendaStore.js  # Agenda sélectionné
│   ├── selectedMonthStore.js   # Mois sélectionné
│   ├── tabStore.js             # Gestion onglet navigateur
│   └── userStore.js            # Données utilisateur
├── utils/               # Utilitaires
│   └── api.js                  # Helpers API (retry, URLs)
├── constants.js         # Constantes métier (codes pointage, seuils)
├── App.vue              # Composant racine
├── main.js              # Point d'entrée Vue
└── monulisss.html       # Page popup de l'extension
```

## Permissions de l'extension

| Permission | Raison |
|------------|--------|
| `scripting` | Injection de scripts pour les appels API authentifiés |
| `tabs` | Accès à l'onglet actif |
| `activeTab` | Interaction avec l'onglet courant |
| `host_permissions: myulis.etnic.be` | Accès au domaine myUlis uniquement |

## Développement

### Prérequis

- Node.js >= 20
- npm

### Scripts disponibles

```bash
npm run dev      # Serveur de développement avec hot-reload
npm run build    # Build de production dans dist/
npm run preview  # Prévisualisation du build
```

### Charger l'extension en mode développement

#### Firefox

1. Ouvrir `about:debugging#/runtime/this-firefox`
2. Cliquer sur **"Charger un module complémentaire temporaire"**
3. Sélectionner le fichier `dist/manifest.json`

#### Chrome

1. Ouvrir `chrome://extensions`
2. Activer le **"Mode développeur"** (toggle en haut à droite)
3. Cliquer sur **"Charger l'extension non empaquetée"**
4. Sélectionner le dossier `dist/`

### Mode debug

Un mode debug est disponible pour visualiser tous les appels API effectués par l'extension et leurs réponses.

#### Activation

Dans `src/constants.js`, modifier la constante `DEBUG_MODE` :

```js
export const DEBUG_MODE = true
```

#### Consultation des logs

Les logs apparaissent dans la **console de l'onglet myUlis** (pas celle de l'extension). Pour y accéder :

1. Ouvrir les DevTools sur l'onglet myulis.etnic.be (`F12` ou `Ctrl+Shift+I`)
2. Aller dans l'onglet **Console**
3. Les logs sont groupés et pliables, avec le préfixe `[MonUlisss API ...]`

#### Format des logs

```
▸ [MonUlisss userStore.fetchIdentity] [REQUEST] https://myulis.etnic.be/api/user/me
    Source: userStore.fetchIdentity
    Timestamp: 2024-01-15T10:30:00.000Z
    URL: https://myulis.etnic.be/api/user/me
    Data: { method: 'GET' }

▸ [MonUlisss calendarStore.fetchCalendar] [REQUEST] https://myulis.etnic.be/api/data
    Source: calendarStore.fetchCalendar
    Timestamp: 2024-01-15T10:30:00.500Z
    URL: https://myulis.etnic.be/api/data
    Data: { method: 'POST', body: '{"types":["POINTAGES"],...}' }

▸ [MonUlisss calendarStore.fetchCalendar] [RESPONSE] https://myulis.etnic.be/api/data
    Source: calendarStore.fetchCalendar
    Timestamp: 2024-01-15T10:30:01.234Z
    URL: https://myulis.etnic.be/api/data
    Data: { status: 200, attempt: 1 }
```

Les sources possibles :
- `userStore.fetchIdentity` : Récupération de l'identité utilisateur
- `userStore.fetchAgendas` : Récupération des agendas
- `calendarStore.fetchCalendar` : Récupération des données de calendrier
- `api.js` : Appels directs via l'utilitaire API

Les types de logs disponibles :
- `REQUEST` : Détails de la requête (méthode, body)
- `RESPONSE` : Statut HTTP et numéro de tentative
- `RESPONSE_DATA` : Données JSON parsées (pour les appels calendar)
- `ERROR` : Erreurs rencontrées (avec numéro de tentative)

## Comment contribuer

Ce projet est ouvert aux contributions des collègues du département développement de l'ETNIC.

### Préparer son environnement

1. **Forker** le dépôt sur GitHub
2. **Cloner** votre fork localement :
   ```bash
   git clone https://github.com/VOTRE_USERNAME/monulisss.git
   cd monulisss
   npm install
   ```
3. **Créer une branche** pour votre modification :
   ```bash
   git checkout -b feature/ma-nouvelle-fonctionnalite
   ```

### Bonnes pratiques

- **Testez** votre code en chargeant l'extension dans Firefox (`about:debugging`)
- **Respectez** la structure existante du projet (stores, composables, components)
- **Utilisez** les constantes de `src/constants.js` pour les codes métier myUlis
- **Commentez** en français pour rester cohérent avec le code existant
- **Vérifiez** que le build passe avant de soumettre : `npm run build`

### Soumettre une Pull Request

1. **Committez** vos modifications avec un message clair :
   ```bash
   git add .
   git commit -m "Ajout de la fonctionnalité X"
   ```
2. **Poussez** vers votre fork :
   ```bash
   git push origin feature/ma-nouvelle-fonctionnalite
   ```
3. **Créez une Pull Request** depuis GitHub vers la branche `main` du dépôt principal
4. **Décrivez** vos modifications dans la PR (quoi, pourquoi, comment tester)

### Idées de contributions

- Ajout de nouveaux codes de pointage dans `constants.js`
- Amélioration de l'interface utilisateur
- Support d'autres navigateurs
- Ajout de graphiques/statistiques

### Questions ?

Contactez julian.davreux@etnic.be; n'ouvrez pas une **Issue** sur GitHub ni un ticket ServiceNow.

---

<a id="changelog"></a>
## Changelog

### 0.9.0 "Cécémel revigorant" (2026-01-22)
- les releases ont maintenant un nom de code basé sur un belgicisme ou une spécialité belge + un adjectif
- ajouts d'options du plugin
- ajout des codes : ASPO
- Optimisation des calculs de présence (mise en cache)
- Ajout du retry automatique pour les appels API
- Parallélisation du chargement des données
- Refactorisation du code (constantes, composables)
- Mode debug
- Refresh automatique après redirection vers MyUlis

### 0.8.3 (2025-12-03)
- Adaptations des appels suite aux changements de politiques API de MyUlis.

### 0.8.2 (2025)
- Encore des petits fixes

### 0.8.1 (2025)
- Petits fixes

### 0.8.0 (2025)
- Réécriture en Vue.js3

### 0.7.5 (2024-11-10)
- Possibilité de consulter les 6 derniers mois

### 0.7.4 (2024-08-14)
- Correction du comptage des congés qui recouvraient des jours non ouvrés (weekend, fériés etc)

### 0.7.3 (2024-08-05)
- Correction d'un bug survenant le 1er jour du mois
- Prise en compte des codes MIS-IN et MIS-OUT
- Prise en compte des codes 4/5 pour maladie
- Exclusion pour le code ULIMIN, code inconnu qui pop sans explication

### 0.7.2 (2024-06-18)
- Correction d'un comportement sur le bouton download (encore)

### 0.7.1 (2024-06-17)
- Correction d'un comportement sur le bouton download

### 0.7.0 (2024-06-17)
- Refactoring majeur
- Ajout des pointages invalides
- Calcul par demi-journées

### 0.6 (jamais)
- Cette version n'a jamais existé. Jamais. Et ne posez pas de questions.

### 0.6 (2024-03-24)
- Ajout des codes de prestation "PRE", "MIE", "MIBE", "MIS" (et ses dérivés), "MIS1-HR", "FOR2"
- Ajout des codes d'absence "CC02", "MIO02", "COET", "COF2", "CCFM", "COFM", "DISP", "CC04", "CSYN", "CC12"
- Cosmétique : réduction de la taille des noms/prenoms

### 0.5 (2024-03-13)
- Ajout du ratio personnel pour le mois en cours
- Ajout de l'identité
- Ajout du sélecteur de calendrier

### 0.4 (2024-03-05)
- Sélecteur de mois affiche les noms des mois
- Ajout des codes CC20, POI-IN, POI-OUT et FOR1 (formation)

### 0.3 (2024-03-04)
- Sélecteur de mois
- Ajout d'un loader
- Refactoring des méthodes d'affichage
- Prise en compte des congés accompagnement de malade (CC20)
- Correction : bug en cas de jours sans activité

### 0.2 (2024-02-24)
- Prise en compte des congés politiques

### 0.1 (2024-02-26)
- Première version déployée


## Licence

Projet interne ETNIC.

## Contact

julian.davreux@etnic.be