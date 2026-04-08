# MonUlisss

[![GitHub release](https://img.shields.io/github/v/release/ProfDecodor/monulisss?style=flat-square)](https://github.com/ProfDecodor/monulisss/releases)
[![GitHub last commit](https://img.shields.io/github/last-commit/ProfDecodor/monulisss?style=flat-square)](https://github.com/ProfDecodor/monulisss/commits)
[![GitHub issues](https://img.shields.io/github/issues/ProfDecodor/monulisss?style=flat-square)](https://github.com/ProfDecodor/monulisss/issues)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue?style=flat-square)](LICENSE)

### 🦄 Version actuelle

# `0.9.0` — *Cécémel revigorant*

---

Extension de navigateur (Firefox/Chrome) pour extraire et visualiser les données de présence depuis **myUlis** (système RH de l'ETNIC).

> **Note :** Ce projet utilise l'API de MyUlis, un logiciel propriétaire tiers. Son utilisation nécessite un accès légitime à ce système. Ce plugin est un projet personnel indépendant, développé et maintenu par son auteur en dehors de tout cadre contractuel avec l'ETNIC.

## Fonctionnalités

* Affichage du taux de présence personnel avec indicateur visuel coloré
* Détail des jours travaillés, télétravail et présence sur site
* Sélection de période par mois (12 derniers mois)
* Vue d'équipe avec tableau récapitulatif par agenda/calendrier
* Détection des pointages en erreur
* Retry automatique en cas d'échec réseau

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
| --- | --- |
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
| --- | --- |
| `scripting` | Injection de scripts pour les appels API authentifiés |
| `tabs` | Accès à l'onglet actif |
| `activeTab` | Interaction avec l'onglet courant |
| `host_permissions: myulis.etnic.be` | Accès au domaine myUlis uniquement |

## Développement

### Prérequis

* Node.js >= 20
* npm

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
▸ [MonUlisss calendarStore.fetchCalendar] [REQUEST] https://myulis.etnic.be/api/data
▸ [MonUlisss calendarStore.fetchCalendar] [RESPONSE] https://myulis.etnic.be/api/data
```

## Comment contribuer

Ce projet est ouvert aux contributions. Les PR sont les bienvenues, qu'il s'agisse de collègues ETNIC ou d'utilisateurs de MyUlis.

> ⚠️ **Important :** Toute contribution soumise via Pull Request est réputée acceptée sous licence Apache 2.0 et attribuée à l'auteur originel du projet. Le projet reste maintenu par son auteur indépendamment de toute organisation.

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

* **Testez** votre code en chargeant l'extension dans Firefox (`about:debugging`)
* **Respectez** la structure existante du projet (stores, composables, components)
* **Utilisez** les constantes de `src/constants.js` pour les codes métier myUlis
* **Commentez** en français pour rester cohérent avec le code existant
* **Vérifiez** que le build passe avant de soumettre : `npm run build`

### Soumettre une Pull Request

1. **Committez** vos modifications avec un message clair
2. **Poussez** vers votre fork
3. **Créez une Pull Request** depuis GitHub vers la branche `main` du dépôt principal
4. **Décrivez** vos modifications dans la PR (quoi, pourquoi, comment tester)

### Questions ?

Contactez [julian.davreux@etnic.be](mailto:julian.davreux@etnic.be)

---

## Changelog

### 0.10.0 "Cuberdon sucré" (à paraitre)

* possibilité de consulter les données des 4 derniers trimestres (en plus des 12 derniers mois)
* ajout de codes : SNIC (absence St Nicolas, oui ca existe)
* changement du mode de calcul des jours ouvrés

### 0.9.0 "Cécémel revigorant" (2026-01-22)

* Les releases ont maintenant un nom de code basé sur un belgicisme ou une spécialité belge + un adjectif
* Ajouts d'options du plugin
* Ajout des codes : ASPO
* Optimisation des calculs de présence (mise en cache)
* Ajout du retry automatique pour les appels API
* Parallélisation du chargement des données
* Refactorisation du code (constantes, composables)
* Mode debug
* Refresh automatique après redirection vers MyUlis

### 0.8.3 (2025-12-03)

* Adaptations des appels suite aux changements de politiques API de MyUlis

### 0.8.2 — 0.8.1 (2025)

* Petits fixes divers

### 0.8.0 (2025)

* Réécriture en Vue.js 3

### 0.7.5 (2024-11-10)

* Possibilité de consulter les 6 derniers mois

### 0.7.4 (2024-08-14)

* Correction du comptage des congés recouvrant des jours non ouvrés

### 0.7.3 (2024-08-05)

* Correction d'un bug survenant le 1er jour du mois
* Prise en compte des codes MIS-IN, MIS-OUT, 4/5 maladie
* Exclusion du code ULIMIN

### 0.7.2 — 0.7.1 (2024-06-18)

* Corrections sur le bouton download

### 0.7.0 (2024-06-17)

* Refactoring majeur
* Ajout des pointages invalides
* Calcul par demi-journées

### 0.6 (jamais)

* Cette version n'a jamais existé. Jamais. Et ne posez pas de questions.

### 0.6 (2024-03-24)

* Ajout de nombreux codes de prestation et d'absence
* Cosmétique : réduction de la taille des noms/prénoms

### 0.5 (2024-03-13)

* Ratio personnel pour le mois en cours
* Ajout de l'identité et du sélecteur de calendrier

### 0.4 (2024-03-05)

* Sélecteur de mois avec noms
* Ajout des codes CC20, POI-IN, POI-OUT, FOR1

### 0.3 (2024-03-04)

* Sélecteur de mois, loader, refactoring
* Correction du bug en cas de jours sans activité

### 0.2 (2024-02-24)

* Prise en compte des congés politiques

### 0.1 (2024-02-26)

* Première version déployée

---

## Licence

Copyright (c) 2024-2026 **Julian Davreux**

Ce projet est distribué sous licence **Apache License 2.0**.
Voir le fichier [LICENSE](LICENSE) pour le texte complet.

En résumé : vous pouvez utiliser, modifier et redistribuer ce code librement, y compris dans un contexte institutionnel, **à condition de conserver la mention de copyright et l'attribution à l'auteur originel.**

## Contact

[julian.davreux@etnic.be](mailto:julian.davreux@etnic.be)
