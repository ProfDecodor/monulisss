/**
 * 
 * @module ApiResponse
 * 
 * Module à renommer car au final il fait plus que prévu
 * 
 * explication des codes en fin de de code source
 */


/**
 * Modélisation de la réponse de l'api pour l'interrogation /getPopulationAgenda ---------------------------------------------------------------------------------------------
 */
export class CalendarResponse {

    constructor(jsonResponse) {
        this.sets = jsonResponse;
     }

    /**
     * Retourne une liste de clé/valeur pour populer un select
     * @returns Map de cle/valeur (id / label)
     */
    getListForSelect() {

        let values = new Map();

        this.sets.forEach(element => {
            values.set(element.id, {"label": element.label + (element.mode == "calendarDiscreet" ? " (🔒privé)" : ""), "mode": element.mode});  
        });

        return values;

    }

    /**
     * Retourne les permat d'un calendrier choisi sur son is
     * @param {*} calendarId 
     * @returns array de permats
     */
    getCalendarPermats(calendarId) {

        const permats = [];

        this.sets.forEach(element => {
            if (element.id == calendarId) {
                element.userids.forEach(user => {
                    permats.push(user.permat); 
                });
            }  
        });

        return permats;
    }

    getCalendarPeople(calendarId) {
        const people = new Map();
        this.sets.forEach(element => {
            if (element.id == calendarId) {
                element.userids.forEach(user => {
                    people.set(user.permat, user.nom);
                });
            }
        })

        return people;
    }

}




/**
 * Modélisation de la réponse de l'api pour l'interrogation /getCalendar ---------------------------------------------------------------------------------------------
 */
export class CalendarDetailsResponse {

    constructor(jsonResponse, people, startDate, endDate) {
        this.sets = jsonResponse;
        this.people = people; //liste des permat avec nom qui sont dans ce calendrier
        this.startDate = startDate;
        this.endDate = endDate;
    }


    /**
     * 
     * @returns la liste des personnes qui compose le calendrier
     */
    getPeople() {
        return this.people;
    }

    /**
     * 
     * @param {*} permat 
     * @returns le nombre de jour de travail
     */
    getWorkingDays(permat) {
        let workingDaysCount = 0;

        this.sets.forEach(calendar => {
            if (calendar.length !== undefined) {
                calendar.forEach(calendarEvent => {
                    /*
                        Avec ceci on va prendre
                        - les pointages physiques (dans le batiment, à la pointeuse)
                        - les présentiels etnic
                        - les télétravails
                        - les congés
                        - les missions, formations etc

                        et on ne prend que les jours ouvrés. pas les fermetures
                    */
                    if (calendarEvent.type == "POINTAGES" && calendarEvent.permat == permat) {
                        if (this.isOpeningDay(permat, calendarEvent.day)) {
                            if (calendarEvent.payload.pointages.length > 0) {
                                workingDaysCount++;
                            }
                        }
                    }
                    /*
                        On enlève les jours de congés pour avoir un solde cohérent
                        on exclus les codes suivant car lié à du temps partiel :  ETPEVE, MALCER
                        on fait par contre attention à enlever par demi journée
                        //TODO : Enelever les autres codes
                    */
                    if (calendarEvent.type == "ABSENCES" && calendarEvent.permat == permat) {
                        if (calendarEvent.payload.length > 0) {
                            let duration = 0;
                            calendarEvent.payload.forEach(absence => {
                                if (absence.category == "CONGE" && absence.lid.TYPE != "ETPEVE" && absence.lid.TYPE != "ETPEVE") {
                                    let timeStart = new Date(`2000-01-01T${absence.computedStartTime}Z`);
                                    let timeEnd = new Date(`2000-01-01T${absence.computedEndTime}Z`);
                                    let diffInHours = (timeEnd - timeStart) / 3600000; //la diff est en millisecondes
                                    duration += diffInHours;
                                }
                            });
                            if (duration >= 5) {
                                workingDaysCount--;
                            } else if (duration >= 2) { // 2, car une récup un après midi est compté de 14:00 à 16:00 ...
                                workingDaysCount -= 0.5;
                            }
                        }
                    }
                })
            }
        });

        if (workingDaysCount < 0) {
            workingDaysCount = 0;
        }
        
        return workingDaysCount;
    }


    /**
     * 
     * @param {*} permat 
     * @returns le nombre de pointages problématiques
     */
    getInvalidActivities(permat) {
        let invalidActivitiesCount = 0;

        this.sets.forEach(calendar => {
            if (calendar.length !== undefined) {
                calendar.forEach(calendarEvent => {
                    if (calendarEvent.type == "POINTAGES" && calendarEvent.permat == permat) {
                        if (calendarEvent.payload.bilan.TYPE == "INVALID") {
                            invalidActivitiesCount++;
                        }
                    }
                })
            }
        });
        
        return invalidActivitiesCount;
    }



    /**
     * 
     * @param {*} permat 
     * @returns le nombre de jour de TT
     */
    getHomeworkingDays(permat) {
        let homeworkingDaysCount = 0;

        this.sets.forEach(calendar => {
            if (calendar.length !== undefined) {
                calendar.forEach(calendarEvent => {
                    if (calendarEvent.type == "POINTAGES" && calendarEvent.permat == permat) {
                        if (calendarEvent.payload.pointages.length > 0) {
                            calendarEvent.payload.pointages.forEach(pointage => {
                                if (pointage.teletravail == true) {
                                    let timeStart = new Date(`2000-01-01T${pointage.in}Z`);
                                    let timeEnd = new Date(`2000-01-01T${pointage.out}Z`);
                                    let duration = (timeEnd - timeStart) / 3600000; //la diff est en millisecondes
                                    if (duration >= 5) {
                                        homeworkingDaysCount++;
                                    } else if (duration >= 2) { // 2, car un pointage PM est compté de 14:00 à 16:00 ...
                                        homeworkingDaysCount += 0.5;
                                    }
                                }
                            });

                        }
                    }
                })
            }
        });
        
        return homeworkingDaysCount;
    }


    /**
     * 
     * @param {*} permat 
     * @returns le nombre de jour de présence
     */
    getPresenceDays(permat) {
        let presenceDaysCount = 0;

        this.sets.forEach(calendar => {
            if (calendar.length !== undefined) {
                calendar.forEach(calendarEvent => {
                    /*
                        on parcours les pointages avec pour idée d'exclure une série de codes
                        Règle de calcul des RH :
                        - pointage de <2H --> pas de présence
                        - pointage de <5H --> 1/2 jour de présence
                        - pointage de >=5H --> 1 jour de présence

                        Les codes suivants sont des codes de prestations presentielle :
                        POI (pointage) (POI-IN & POI-OUT ne sont pas pris en compte car sont des infos complémentaires incluse dans un POI --> à changer)
                        PRES (Présentiel ETNIC)
                        FOR1, FOR2 (Formation)
                        PRE	(Forfait prestation)
                        MIE1 (Mission à l'étranger)
                        MIBE (Mission en Belgique)
                        MIS, MIS1	(Mission (pointage))
                        MIS-IN, MIS-OUT (Pointage Mission)
                        MIS1-HR	(Mission donnant droit à un CR)
                    */
                    if (calendarEvent.type == "POINTAGES" && calendarEvent.permat == permat) {
                        if (calendarEvent.payload.pointages.length > 0) {
                            // on parcours les pointages du jour.
                            // subtilité : si on a un pointage, puis une mission, puis de nouveau un pointage, on peut avoir un dépassement et compter plus d'une journée
                            // on met donc une vérification en place pour compter au max une journée.
                            let totalPresenceDaysCount = 0;
                            // et on ne compte les présences que les jours ouvrés (pas les jours renseignés comme de la fermeture)
                            if (this.isOpeningDay(permat, calendarEvent.day)) {
                                let alternatePOI = false;
                                let alternatePOITimeStart = new Date();
                                calendarEvent.payload.pointages.forEach(pointage => {
                                    if (["POI-IN", "MIS-IN"].includes(pointage.nature.code)) {
                                        alternatePOITimeStart = new Date(`2000-01-01T${pointage.in}Z`);
                                        alternatePOI = true;
                                    } else if (["POI-OUT", "MIS-OUT"].includes(pointage.nature.code)) {
                                        let alternatePOITimeEnd = new Date(`2000-01-01T${pointage.out}Z`);
                                        let duration = (alternatePOITimeEnd - alternatePOITimeStart) / 3600000;
                                        if (duration >= 5) {
                                            totalPresenceDaysCount++;
                                        } else if (duration >= 2) { // 2, car un pointage PM est compté de 14:00 à 16:00 ...
                                            totalPresenceDaysCount += 0.5;
                                        }
                                    } else if (["POI", "PRES", "FOR1", "FOR2", "PRE", "MIE1", "MIBE", "MIS", "MIS1", "MIS1-HR"].includes(pointage.nature.code)) {
                                        let timeStart = new Date(`2000-01-01T${pointage.in}Z`);
                                        let timeEnd = new Date(`2000-01-01T${pointage.out}Z`);
                                        let duration = (timeEnd - timeStart) / 3600000; //la diff est en millisecondes
                                        if (duration >= 5) {
                                            totalPresenceDaysCount++;
                                        } else if (duration >= 2) { // 2, car un pointage PM est compté de 14:00 à 16:00 ...
                                            totalPresenceDaysCount += 0.5;
                                        }
                                    }
                                });
                                if (totalPresenceDaysCount > 1) {
                                    totalPresenceDaysCount = 1;
                                }
                                presenceDaysCount += totalPresenceDaysCount;
                            }

                        }
                    }
                })
            }
        });
        
        return presenceDaysCount;
    }


    isOpeningDay(permat, day) {

        for (let iSet = 0; iSet < this.sets.length; iSet++) {
            let calendar = this.sets[iSet];
            for (let iCalendar = 0; iCalendar < calendar.length; iCalendar++) {
                let calendarEvent = calendar[iCalendar];
                if (calendarEvent.type == "FERMETURE" && calendarEvent.permat == permat && calendarEvent.day == day) {
                    if (calendarEvent.payload == null) { // pas de payload = ouverture
                        return true;
                    }
                    else {
                        // prise en compte du code ULIMIN ... ce truc est apparu chez SGL et a disparu ..
                        if (calendarEvent.payload.code == "ULIMIN") {
                            return true;
                        }
                        return false;
                    }
                }
            }       
        }

    }


    /**
     * L'objectif de cette méthode est de récupérer un tableau de données par permat.
     * il sera renvoyé au displayer qui mettra cela dans le csv d'export
     * Structure de l'objet retourné :
     *
     *      data.days                                                   <- tableau contenant les jours de la période
     *      data.permats                                                <- tableau d'objets avec comme clé le numero ulis (permat)
     *          data.permats[].name                                     <- nom + prénom
     *          data.permats[].fermetures                               <- tableau des fermetures
     *              data.permats[].fermetures[].date                    <- tableau des dates avec comme clé la date
     *                  data.permats[].fermetures[].date[].evenements   <- tableau d'événements du jour
     *          data.permats[].absences                                 <- tableau des absences
     *              data.permats[].absences[].date                      <- tableau des dates avec comme clé la date
     *                  data.permats[].absences[].date[].evenements     <- tableau d'événements du jour
     *          data.permats[].poitnages                                <- tableau des pointages
     *              data.permats[].pointages[].date                     <- tableau des dates avec comme clé la date
     *                  data.permats[].pointages[].date[].evenements    <- tableau d'événements du jour
     *
     *
     * Methode à refactorer .
     */
    getExport() {

        const data = {};
        data.days = [];
        data.permats = {} // j'utilise un objet car la clé est numérique (et si le premier permat est 20000 j'ai 19999 cases vides avant, merci JS :)
        const people = this.getPeople();

        // on commence par lister les jours de la période et on les place dans data.days
        let currentDate = new Date(this.startDate.getTime());
        while (currentDate <= this.endDate) {
            data.days.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // on boucle ensuite sur les personnes présentes dans ce calendrier
        this.getPeople().forEach((name, permat) => {
            // première dimension du tableau
            data.permats[permat] = { "name": name, "fermetures": [], "absences": [], "pointages": [] };

            // boucle pour avoir les jours de fermeture, absences et pointages de cette personne
            this.sets.forEach(calendar => {
                calendar.forEach(calendarEvent => {

                    if (calendarEvent.type == "FERMETURE" && calendarEvent.permat == permat) {
                        if (calendarEvent.payload != null) {
                            if (data.permats[permat].fermetures[calendarEvent.day] === undefined) {
                                data.permats[permat].fermetures[calendarEvent.day] = [];
                            }
                            data.permats[permat].fermetures[calendarEvent.day].push(calendarEvent.payload.code);
                        }
                    }
                    if (calendarEvent.type == "ABSENCES" && calendarEvent.permat == permat) {
                        if (calendarEvent.payload != null) {
                            if (data.permats[permat].absences[calendarEvent.day] === undefined) {
                                data.permats[permat].absences[calendarEvent.day] = [];
                            }
                            if (calendarEvent.payload.length > 0) {
                                calendarEvent.payload.forEach(absence => {
                                    data.permats[permat].absences[calendarEvent.day].push(absence.lid.TYPE); //TYPE est bien en majuscule dans cette putain d'api
                                });
                            }
                        }
                    }
                    if (calendarEvent.type == "POINTAGES" && calendarEvent.permat == permat) {
                        if (calendarEvent.payload != null) {
                            if (data.permats[permat].pointages[calendarEvent.day] === undefined) {
                                data.permats[permat].pointages[calendarEvent.day] = [];
                            }
                            if ( calendarEvent.payload.pointages !== undefined ) {
                                calendarEvent.payload.pointages.forEach(pointage => {
                                    data.permats[permat].pointages[calendarEvent.day].push(pointage.nature.code);
                                });
                            }
                        }
                    }

                });
            });

        });

        /*for (let iPeople = 0; iPeople < this.people.length; iPeople++) {
            console.log(this.people[iPeople]);
            //data[this.people[i]] = ["fermetures","absences","pointages"];
        }*/

        return data;
    }
    
}

/*

TLT	Télétravail	Prestation

POI	Pointage	Prestation
POI-IN	Pointage Arrivée	Prestation
POI-OUT	Pointage Départ	Prestation
PRES	Présentiel ETNIC	Prestation
FOR1	Formation (avec CRP)	Prestation
PRE	Forfait prestation	Prestation
MIE1	Mission à l'étranger (donnant droit à un chèque-repas)	Prestation
MIBE	Mission en Belgique 	Prestation
MIS	Mission (pointage)	Prestation
MIS-IN	Pointage Mission Départ	Prestation
MIS-OUT	Pointage Mission Retour	Prestation
MIS1-HR	Mission (donnant droit à un CR) (h. réelles)	Prestation
FOR2	Formation (sans CRP)	Prestation

MIS1    non communiqué par anthony : mission en extérieur

CGAN	Congé Annuel	Ne pas tenir compte
RECU	Récupération (h. ordinaires)	Ne pas tenir compte
REC1    non communiqué par Anthony : récupération heures exceptionnelles
RETR	Retard train	Ne pas tenir compte
CC02	Naissance (accouchement épouse/conjointe/ss même toit(20J)	Ne pas tenir compte
RETM	Retour Malade	Ne pas tenir compte
MIO2	Congé pour motifs impérieux d'ordre familial Garde	Ne pas tenir compte
COET	Congé d'étude	Ne pas tenir compte
DKIN	Dispense kinesiste-thérapeute sur prescription médicale	Ne pas tenir compte
DMED	Dispense médecin spécialiste/dentiste	Ne pas tenir compte
CC07	Congé décès d'un parent ou allié au 2ème ou 3ème degré	Ne pas tenir compte
REC1	Récupération (h. exceptionnelles)	Ne pas tenir compte
CC20	Congé accompagnement de malade	Ne pas tenir compte
COF2	Congé cause de force majeure : garde enfant (8j max)	Ne pas tenir compte
CCFM	Congé pour cause de force majeure	Ne pas tenir compte
COFM	Congé cause de force majeure (Max 8J/an)	Ne pas tenir compte
DISP	Dispense de service (forfait)	Ne pas tenir compte
CC04	Décès parent(1er degré) de l'agent ou son conjoint (5J)	Ne pas tenir compte
CSYN	Congé syndical	Ne pas tenir compte
CC12	Congé pour cause de force majeure (enfant - 12 ans)	Ne pas tenir compte
CPOL	Congé politique (dispense de service)	Ne pas tenir compte

MALCER  non comuniqué par anthony : maladie sous certificat
MAL     non communiqué par anthony : maladie

ETPEVE  non communiqué par anthony : 4/5
APC     non communiqué : lié au congé et temps partiel ( = le jour de congé ?)

RECF	Arrivée tardive / Départ anticipé	Ne pas tenir compte
ASPO	Absence sportive	Ne pas tenir compte
ASPO2	Absence sportive ( > limite)	Ne pas tenir compte
CC11	Convocation comme témoin/comparution personnelle(Durée néc.)	Ne pas tenir compte
REST	Retard STIB	Ne pas tenir compte

ULIMIN --> code apparu une fois chez SGL et a disparu du jour au lendemain. code lié à une fermeture apparemment

*/