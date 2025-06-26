export function useCalendarDataDetails(calendarSets) {
  // Vérifie si un jour donné est un jour ouvré (non fermé)
  function isOpeningDay(permat, day) {
    for (const calendar of calendarSets) {
      for (const event of calendar) {
        if (
          event.type === "FERMETURE" &&
          event.permat === permat &&
          event.day === day
        ) {
          // prise en compte du code ULIMIN ... ce truc est apparu chez SGL et a disparu ..

          if (!event.payload || event.payload.code === "ULIMIN") {
            return true;
          }
          return false;
        }
      }
    }
    return true; // par défaut, on considère que c’est ouvert
  }

  // Calcule les jours de présence
  function computePresenceDays(permat) {
    let count = 0;

    calendarSets.forEach((set) => {
      set.forEach((event) => {
        if (
          event.type === "POINTAGES" &&
          event.permat === permat &&
          isOpeningDay(permat, event.day)
        ) {
          let totalForDay = 0;
          let inTime = null;

          for (const p of event.payload.pointages || []) {
            const { code } = p.nature;

            if (["POI-IN", "MIS-IN"].includes(code)) {
              inTime = new Date(`2000-01-01T${p.in}Z`);
            } else if (["POI-OUT", "MIS-OUT"].includes(code) && inTime) {
              const outTime = new Date(`2000-01-01T${p.out}Z`);
              const duration = (outTime - inTime) / 3600000;
              totalForDay += duration >= 5 ? 1 : duration >= 2 ? 0.5 : 0;
              inTime = null;
            } else if (
              [
                "POI",
                "PRES",
                "FOR1",
                "FOR2",
                "PRE",
                "MIE1",
                "MIBE",
                "MIS",
                "MIS1",
                "MIS1-HR",
              ].includes(code)
            ) {
              const timeStart = new Date(`2000-01-01T${p.in}Z`);
              const timeEnd = new Date(`2000-01-01T${p.out}Z`);
              const duration = (timeEnd - timeStart) / 3600000;
              totalForDay += duration >= 5 ? 1 : duration >= 2 ? 0.5 : 0;
            }
          }

          count += Math.min(totalForDay, 1); // max 1 par jour
        }
      });
    });

    return count;
  }

  // Calcule les jours de travail attendus
  function computeWorkingDays(permat) {
    let count = 0;

    calendarSets.forEach((set) => {
      set.forEach((event) => {
        const isWorkDay =
          event.permat === permat && isOpeningDay(permat, event.day);

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
          count++;
        }

        /*
                        On enlève les jours de congés pour avoir un solde cohérent
                        on exclus les codes suivant car lié à du temps partiel :  ETPEVE, MALCER
                        on fait par contre attention à enlever par demi journée
                        //TODO : Enelever les autres codes
                    */
        if (event.type === "ABSENCES" && isWorkDay && event.payload?.length) {
          let hours = 0;
          for (const absence of event.payload) {
            if (
              absence.category === "CONGE" &&
              !["ETPEVE", "MALCER"].includes(absence.lid.TYPE)
            ) {
              const start = new Date(
                `2000-01-01T${absence.computedStartTime}Z`
              );
              const end = new Date(`2000-01-01T${absence.computedEndTime}Z`);
              hours += (end - start) / 3600000; // la diff est en millisecondes
            }
          }
          if (hours >= 5) count--;
          else if (hours >= 2) count -= 0.5;
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
          let hours = 0;
          for (const p of event.payload.pointages) {
            if (p.nature.code === "RETM") {
              const start = new Date(`2000-01-01T${p.in}Z`);
              const end = new Date(`2000-01-01T${p.out}Z`);
              hours += (end - start) / 3600000;
            }
          }
          if (hours >= 5) count--;
          else if (hours >= 2) count -= 0.5;
        }
      });
    });
    return count;
    //return Math.max(0, count)
  }

  // calcul le télétravail
  function computeHomeworkingDays(permat) {
    let count = 0
    calendarSets.forEach((set) => {

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
    
  })})

  return count
  }


  function computeInvalidActivities(permat) {
    let count = 0;
  
    calendarSets.forEach((set) => {

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
  
    return count;
  }


  // Calcule le taux de présence pour un utilisateur
  function getPresenceRateForPermat(permat) {
    const presence = computePresenceDays(permat);
    const working = computeWorkingDays(permat);
    return working > 0 ? Math.floor((100 * presence) / working) : 0;
  }

  return {
    isOpeningDay,
    computePresenceDays,
    computeWorkingDays,
    computeHomeworkingDays,
    computeInvalidActivities,
    getPresenceRateForPermat,
  };
}
