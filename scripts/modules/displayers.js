/**
 *
 * @module Displayers
 * Ensemble des fonctions qui font de l'affichage ou interragissent avec le contenu du DOM
 *
 *
 */


// éléments html
const DOM_CalendarDetailsTable = document.getElementById("calendarDetails");
const DOM_DownloadButton = document.getElementById("downloadbutton");
const DOM_ContainerMain = document.getElementById("maincontent");
const DOM_ContainerError = document.getElementById("errormessage");
const DOM_ContainerLoader = document.getElementById("loader");
const DOM_MyUlisLink = document.getElementById("myUlisLink");
//const DOM_PreferencesLink = document.getElementById("preferenceslink");
const DOM_DateSelector = document.getElementById("timeselector");
const DOM_CalendarSelector = document.getElementById("calendarselector");
const DOM_MeFirstname = document.getElementById("me_firstname");
const DOM_MeLastName = document.getElementById("me_lastname");
const DOM_MeRatio = document.getElementById("me_ratio");
const DOM_MeMonth = document.getElementById("me_month");
const DOM_ErrorMessageContent = document.getElementById("errormessagecontent");
const DOM_Version = document.getElementById("version");



// les choses à faire par défaut
DOM_Version.innerText = browser.runtime.getManifest().version;
DOM_DownloadButton.addEventListener("click", createCsvFile);


export function displayLoading() {
    DOM_ContainerError.style.display = "none";
    DOM_ContainerLoader.style.display = "block";
    DOM_ContainerMain.style.display = "none";
}

export function hideLoading() {
    DOM_ContainerError.style.display = "none";
    DOM_ContainerLoader.style.display = "none";
    DOM_ContainerMain.style.display = "block";
}

/**
 * Affiche le bloc qui explique que le plugin n'est pas utilisable
 * Peut prenre un message d'erreur en paramètre
 */
export function showNotAccessibleMessage(errorMessage = "") {

    if (errorMessage.length) {
        DOM_ErrorMessageContent.textContent = errorMessage;
    }
    else {
        DOM_ErrorMessageContent.textContent = "";
    }

    DOM_ContainerError.style.display = "block";
    DOM_ContainerLoader.style.display = "none";
    DOM_ContainerMain.style.display = "none";

    /*DOM_PreferencesLink.onclick = function (event) {
        event.preventDefault();
        let sending = browser.runtime.sendMessage({"message": "open_addon_preferences"});

    }*/

}


/**
 * Arme le sélecteur de date
 */
export function prepareDateSelector() {

    let today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    //contenu : le mois en cours et les 6 précédent

    function addDateOption(select, pValue, pText) {
        let option = document.createElement("option");
        option.value = pValue;
        option.textContent = pText;
        select.appendChild(option);
    }

    let monthMinus0 = new Date(today.getFullYear(), today.getMonth());
    let monthMinus1 = new Date(today.getFullYear(), today.getMonth() - 1);
    let monthMinus2 = new Date(today.getFullYear(), today.getMonth() - 2);
    let monthMinus3 = new Date(today.getFullYear(), today.getMonth() - 3);
    let monthMinus4 = new Date(today.getFullYear(), today.getMonth() - 4);
    let monthMinus5 = new Date(today.getFullYear(), today.getMonth() - 5);
    let monthMinus6 = new Date(today.getFullYear(), today.getMonth() - 6);

    addDateOption(DOM_DateSelector, "month-0", "Ce mois ("+monthMinus0.toLocaleString('default', { month: 'long' })+")");
    addDateOption(DOM_DateSelector, "month-1", monthMinus1.toLocaleString('default', { month: 'long' }));
    addDateOption(DOM_DateSelector, "month-2", monthMinus2.toLocaleString('default', { month: 'long' }));
    addDateOption(DOM_DateSelector, "month-3", monthMinus3.toLocaleString('default', { month: 'long' }));
    addDateOption(DOM_DateSelector, "month-4", monthMinus4.toLocaleString('default', { month: 'long' }));
    addDateOption(DOM_DateSelector, "month-5", monthMinus5.toLocaleString('default', { month: 'long' }));
    addDateOption(DOM_DateSelector, "month-6", monthMinus6.toLocaleString('default', { month: 'long' }));

    // Sélection par défaut de l'option "ceMois"
    DOM_DateSelector.value = "month-0";

    return DOM_DateSelector;

}


/**
 * Récupère la date sélectionnée dans le sélecteur de date
 * si on passe un true en param, on obtient uniquement la value du select. sinon, on récpère les date
 * @returns un tableau contenant la date de début et la date de fin
 */
// TODO : refactor ce switch fait à la va vite pour répondre à une urgence
export function getSelectedDates(onlyValue=false) {

    if (onlyValue) {
        return (DOM_DateSelector.value);
    }

    let today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    let selectedDate = DOM_DateSelector.value;

    let startDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    let endDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()-1));

    switch (selectedDate) {
        // il y a six mois
        case 'month-6':
            startDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 6, 1));
            endDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 5 , 0));
            break;
        // il y a cinq mois
        case 'month-5':
            startDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 5, 1));
            endDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 4 , 0));
            break;
        // il y a quatre mois
        case 'month-4':
            startDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 4, 1));
            endDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 3 , 0));
            break;
        // il y a trois mois
        case 'month-3':
            startDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 3, 1));
            endDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 2 , 0));
            break;
        // il y a deux mois
        case 'month-2':
            startDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 2, 1));
            endDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1 , 0));
        break;
        // le mois passé
        case 'month-1':
            startDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
            endDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0));
        break;
        // ce mois-ci
        case 'month-0':
        default:
            ;; // par défaut on a fait le mois en cours à l'init des variables
    }

    return [startDate, endDate];

}

/**
 * changer la valeur du select
 * @param value
 */
export function selectDates(value) {
    DOM_DateSelector.value = value;
}

/**
 * Retourne le label du calendrier sélectionné dans le <select>
 * @returns label du calendrier sélectionné dans le <select>
 */
export function getSelectedDateLabel() {

    return DOM_DateSelector[DOM_DateSelector.selectedIndex].innerHTML;;

}


/*
 * Fonction qui prépare le sélecteur de calendrier
 * Prend en paramètre un MAP contenant des paires "clé/valeur"
 */
export function prepareCalendarSelector(calendarList) {

    function addCalendarOption(value, key, map) {
        let option = document.createElement("option");
        option.value = key;
        option.textContent = value.label;
        DOM_CalendarSelector.appendChild(option);
        if (value.mode == "calendarFull") {
            DOM_CalendarSelector.value = key;
        }
    }

    calendarList.forEach(addCalendarOption);

    return DOM_CalendarSelector;

}

/**
 * Retourne le calendrier sélectionné dans le <select>
 * @returns value du calendrier sélectionné dans le <select>
 */
export function getSelectedCalendar() {

    return DOM_CalendarSelector.value;;

}

/**
 * changer la valeur du select
 * @param value
 */
export function selectCalendar(value) {
    DOM_CalendarSelector.value = value;
}


/**
 * Affiche le calendrier sélectionné sous forme de table
 * TODO: contient du code redondant dans le calcul de ratio
 */
export function displayCalendarTable(calendarDetails) {

    //contenu du tableau, et on commence par le vider
    while (DOM_CalendarDetailsTable.firstChild) {
        DOM_CalendarDetailsTable.removeChild(DOM_CalendarDetailsTable.firstChild);
    }

    calendarDetails.getPeople().forEach((name, permat) => {

        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        nameCell.textContent = name;
        row.appendChild(nameCell);

        const permatCell = document.createElement("td");
        permatCell.textContent = permat;
        row.appendChild(permatCell);

        const workingDaysCell = document.createElement("td");
        let countWorkingDays =  calendarDetails.getWorkingDays(permat);
        let invalidActivities = calendarDetails.getInvalidActivities(permat);
        if (invalidActivities > 1) {
            workingDaysCell.innerHTML = countWorkingDays
                                            + ' <span class="small text-danger">'
                                            + invalidActivities
                                            + ' pointages invalides</span>';
        }
        else if (invalidActivities > 0) {
            workingDaysCell.innerHTML = countWorkingDays
                                            + ' <span class="small text-danger">'
                                            + invalidActivities
                                            + ' pointage invalide</span>';
        }
        else {
            workingDaysCell.textContent = countWorkingDays;
        }
        row.appendChild(workingDaysCell);

        const homeworkingDaysCell = document.createElement("td");
        homeworkingDaysCell.textContent = calendarDetails.getHomeworkingDays(permat);
        row.appendChild(homeworkingDaysCell);

        const presentDaysCell = document.createElement("td");
        let countPresenceDays = calendarDetails.getPresenceDays(permat);
        presentDaysCell.textContent = countPresenceDays;
        row.appendChild(presentDaysCell);

        const ratioCell = document.createElement("td");
        let ratio = Math.floor((100 * countPresenceDays) / countWorkingDays);
        // si le nombre de jours de travail est à 0, on considère que le taux est à 100% (puisque aucune présence n'est nécessaireà)
        if (countWorkingDays == 0) {
            ratio = 100;
        }
        if (isNaN(ratio)) { ratio = 0; } // si getWorkingDay est à 0 --> division par 0 --> NaN
        if (ratio < 40) {
            ratioCell.classList.add("text-danger");
        }
        else if (ratio < 50) {
            ratioCell.classList.add("text-warning");
        }
        ratioCell.textContent = ratio + "%";
        row.appendChild(ratioCell);

        DOM_CalendarDetailsTable.appendChild(row);

    });

}


/**
 * Cette méthode place le contenu du calendrier dans l'élément bouton
 * @returns {null}
 */
export function handleDownloadButton(calendarDetails) {
    DOM_DownloadButton.calendarDetails = calendarDetails;
}

function createCsvFile() {

    // le calendrier à exporter se situe dans l'élément bouton.
    // on le récupère
    let calendarDetails = DOM_DownloadButton.calendarDetails;

    const data = calendarDetails.getExport();
    //console.log(data);

    const csvArray = [];
    const csvHeader = ["matricule", "nom", ""]; // la colonne vide est intentionnelle

    if ( data.days[0] !== undefined ) {

        /*
            Ligne d'entete du CSV
         */

        for (let i=0; i<data.days.length; i++) {
            csvHeader.push(data.days[i]);
        }
        csvArray.push(csvHeader);

        /*
            Boucle sur les personnes pour créer une ligne par personne
         */
        Object.entries(data.permats).forEach( permat => {
            const [key, value] = permat;
            let csvArrayLine = [];

            // Prmeière ligne : les jours de fermeture
            csvArrayLine = [key, value.name, "Fermetures"];
            for (let i=0; i<data.days.length; i++) {
                csvArrayLine.push(
                    value.fermetures[data.days[i]] !== undefined ?
                        value.fermetures[data.days[i]].join(",") : ""
                );
            }
            csvArray.push(csvArrayLine);

            // Deuxième ligne : les jours d'absences
            csvArrayLine = [key, value.name, "Absences"];
            for (let i=0; i<data.days.length; i++) {
                csvArrayLine.push(
                    value.absences[data.days[i]] !== undefined ?
                        value.absences[data.days[i]].join(",") : ""
                );
            }
            csvArray.push(csvArrayLine);

            // Troisième ligne : les pointages
            csvArrayLine = [key, value.name, "Pointages"];
            for (let i=0; i<data.days.length; i++) {
                csvArrayLine.push(
                    value.pointages[data.days[i]] !== undefined ?
                        value.pointages[data.days[i]].join(",") : ""
                );
            }
            csvArray.push(csvArrayLine);

        });

        /*
            Création du fichier
         */

        let content = csvArray.map(e => e.join(";")).join("\n");
        const file = new File(["\ufeff"+content], 'export.csv', {type: "data:text/csv;charset=utf-8"});
        const url = window.URL.createObjectURL(file);

        const a = document.createElement("a");
        a.style = "display: none";
        a.href = url;
        a.download = file.name;
        a.click();
        window.URL.revokeObjectURL(url);

        return null;
    }
}


export function displayMe(me) {

    DOM_MeLastName.innerHTML = me.getLastName();
    DOM_MeFirstname.innerHTML = me.getFirstName();

}

/**
 * TODO: contient du code redondant dans le calcul de ratio
 * @param {*} me
 * @param {*} calendarDetails
 */
export function displayPersonnalRatio(me, calendarDetails) {

    DOM_MeMonth.textContent = getSelectedDateLabel();

    let countPresenceDays = calendarDetails.getPresenceDays(me.getPermat());
    let countWorkingDays = calendarDetails.getWorkingDays(me.getPermat())

    DOM_MeRatio.classList.remove("text-danger");
    DOM_MeRatio.classList.remove("text-warning");

    let ratio = Math.floor( (100 * countPresenceDays) / countWorkingDays);
    // si le nombre de jours de travail est à 0, on considère que le taux est à 100% (puisque aucune présence n'est nécessaireà)
    if (countWorkingDays == 0) {
        ratio = 100;
    }
    if (isNaN(ratio)) { ratio = 0; } // si getWorkingDay est à 0 --> division par 0 --> NaN
    if (ratio < 40) {
        DOM_MeRatio.classList.add("text-danger");
    }
    else if (ratio < 50) {
        DOM_MeRatio.classList.add("text-warning");
    }
    DOM_MeRatio.innerHTML =  ratio + "%";

}

