/**
 * 
 * @module Api
 * Ensemble des fonctions qui interragissent avec l'API de MyUlis
 * 
 * 
 */

const API_ME = "https://myulis.etnic.be/api/user/me";
const API_DATA = "https://myulis.etnic.be/api/data";
const API_AGENTSLIST = "https://myulis.etnic.be/api/autorisation/getPopulationAgenda";


/**
 * Récupère les calendriers de l'agent
 */
export async function getMyCalendars() {

    let response = await fetch(API_AGENTSLIST);

    if ( ! response.ok ) {
        throw new Error("Erreur API dans getMyCalendar : " + response.status);
    }

    return response.json();
        
}


/**
 * Récupère un calendrier
 */
export async function getCalendar(permats, startDate, endDate) {

    // on récupère les infos suivantes :
    // - FERMETURE
    // - ABSENCES
    // - TELETRAVAIL -> pas nécessaire car les "télétravails" sont repris dans "absences"
    // - POINTAGES
    // dans plusieurs requetes fetch qu'on va ensuite rassembler
    
    const payloadFermetures = {
        types: ["FERMETURE"],
        permats: permats,
        dd: startDate.toISOString().split("T")[0],
        df: endDate.toISOString().split("T")[0]
    };

    /*const payloadTeletravail = {
        types: ["TELETRAVAIL"],
        permats: permats,
        dd: startDate.toISOString().split("T")[0],
        df: endDate.toISOString().split("T")[0]
    };*/

    const payloadAbsences = {
        types: ["ABSENCES"],
        permats: permats,
        dd: startDate.toISOString().split("T")[0],
        df: endDate.toISOString().split("T")[0]
    };

    const payloadPointages = {
        types: ["POINTAGES"],
        permats: permats,
        dd: startDate.toISOString().split("T")[0],
        df: endDate.toISOString().split("T")[0]
    };


    const allPromises = Promise.all([
        fetch(API_DATA, {
            method: "POST",
            body: JSON.stringify(payloadFermetures),
            headers: { "Content-Type": "application/json" }
        }),
        /*fetch(API_DATA, {
            method: "POST",
            body: JSON.stringify(payloadTeletravail),
            headers: { "Content-Type": "application/json" }
        }),*/
        fetch(API_DATA, {
            method: "POST",
            body: JSON.stringify(payloadAbsences),
            headers: { "Content-Type": "application/json" }
        }),
        fetch(API_DATA, {
            method: "POST",
            body: JSON.stringify(payloadPointages),
            headers: { "Content-Type": "application/json" }
        }),
    ]);

    try {
        const responses = await allPromises;
        return (Promise.all(responses.map(response => response.json())));
    }
    catch (error) {
        throw new Error("Erreur API dans getCalendar : " + response.status);
    }

}



export async function getMe() {

    let response = await fetch(API_ME);

    if ( ! response.ok ) {
        throw new Error("Erreur API dans getMe : " + response.status);
    }

    return response.json();
    
}