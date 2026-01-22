# MonUlisss

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
▸ [MonUlisss API REQUEST] https://myulis.etnic.be/api/data
    Timestamp: 2024-01-15T10:30:00.000Z
    URL: https://myulis.etnic.be/api/data
    Data: { method: 'POST', body: '{"types":["POINTAGES"],...}' }

▸ [MonUlisss API RESPONSE] https://myulis.etnic.be/api/data
    Timestamp: 2024-01-15T10:30:01.234Z
    URL: https://myulis.etnic.be/api/data
    Data: { status: 200, data: [...] }
```

Les types de logs disponibles :
- `REQUEST` : Détails de la requête (méthode, body)
- `RESPONSE` : Statut HTTP et données reçues
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

## Changelog

### v0.8.4 (à venir)
- Optimisation des calculs de présence (mise en cache)
- Ajout du retry automatique pour les appels API
- Parallélisation du chargement des données
- Refactorisation du code (constantes, composables)
- Mode debug

## Licence

Projet interne ETNIC.

## Contact

julian.davreux@etnic.be