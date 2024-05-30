/**
 * 
 * @module Displayers
 * Ensemble des fonctions qui font de l'affichage ou interragissent avec le contenu du DOM
 * 
 * 
 */


// éléments html
const DOM_CalendarDetailsTable = document.getElementById("calendarDetails");
const DOM_StartDate = document.getElementById("startdate");
const DOM_EndDate = document.getElementById("enddate");
const DOM_NumberOfDays = document.getElementById("numberofdays");
const DOM_DownloadButton = document.getElementById("downloadbutton");
const DOM_ContainerMain = document.getElementById("maincontent");
const DOM_ContainerError = document.getElementById("errormessage");
const DOM_ContainerLoader = document.getElementById("loader");
const DOM_MyUlisLink = document.getElementById("myUlisLink");
const DOM_DateSelector = document.getElementById("timeselector");
const DOM_CalendarSelector = document.getElementById("calendarselector");
const DOM_MeFirstname = document.getElementById("me_firstname");
const DOM_MeLastName = document.getElementById("me_lastname");
const DOM_MeRatio = document.getElementById("me_ratio");
const DOM_MeMonth = document.getElementById("me_month");
const DOM_ErrorMessageContent = document.getElementById("errormessagecontent");


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

}


/**
 * Arme le sélecteur de date
 */
export function prepareDateSelector() {

    let today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    //contenu : le mois en cours, -1 et -2

    function addDateOption(select, pValue, pText) {
        let option = document.createElement("option");
        option.value = pValue;
        option.textContent = pText;
        select.appendChild(option);
    }

    let monthMinus0 = new Date(today.getFullYear(), today.getMonth());
    let monthMinus1 = new Date(today.getFullYear(), today.getMonth() - 1);
    let monthMinus2 = new Date(today.getFullYear(), today.getMonth() - 2);
      
    addDateOption(DOM_DateSelector, "month-0", "Ce mois ("+monthMinus0.toLocaleString('default', { month: 'long' })+")");
    addDateOption(DOM_DateSelector, "month-1", monthMinus1.toLocaleString('default', { month: 'long' }));
    addDateOption(DOM_DateSelector, "month-2", monthMinus2.toLocaleString('default', { month: 'long' }));
      
    // Sélection par défaut de l'option "ceMois"
    DOM_DateSelector.value = "month-0";

    return DOM_DateSelector;

}


/**
 * Récupère la date sélectionnée dans le sélecteur de date
 * @returns un tableau contenant la date de début et la date de fin
 */
export function getSelectedDates() {

    let today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    let selectedDate = DOM_DateSelector.value; 

    let startDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    let endDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()-1));

    switch (selectedDate) {
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



/*






function displayMyTeamTable(team, startDate, endDate) {

    //infos de date
    /* DOMStartDate.textContent = startDate.toISOString().split("T")[0];
    DOMEndDate.textContent = endDate.toISOString().split("T")[0];
    DOMNumberOfDays.textContent = numberOfDays; * /

    //on fait le csv en meme temps
    const csvArray = [];
    const csvHeader = ["matricule", "nom"];
    
    let currentDate = new Date(startDate.getTime());
    
    while (currentDate <= endDate) {
        csvHeader.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    csvArray.push(csvHeader);

    //contenu du tableau, et on commence par le vider
    while (myTeamTable.firstChild) {
        myTeamTable.removeChild(myTeamTable.firstChild);
    }
    team.getMembers().forEach(member => {
        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        nameCell.textContent = member.name;
        row.appendChild(nameCell);
        
        const permatCell = document.createElement("td");
        permatCell.textContent = member.permat;
        row.appendChild(permatCell);
        
        const workingDaysCell = document.createElement("td");
        workingDaysCell.textContent = team.getWorkingDays(member.permat);
        row.appendChild(workingDaysCell);

        const presentDaysCell = document.createElement("td");
        presentDaysCell.textContent = team.getPresentDays(member.permat);
        row.appendChild(presentDaysCell);

        const ratioCell = document.createElement("td");
        if ( team.getPresentDays(member.permat) == 0 && team.getWorkingDays(member.permat) == 0 ) {
            ratioCell.textContent =  "--%";
        }
        else {
            let ratio = Math.floor((100 * team.getPresentDays(member.permat)) / team.getWorkingDays(member.permat));
            if (isNaN(ratio)) { ratio = 0; } // si getWorkingDay est à 0 --> division par 0 --> NaN
            if (ratio < 40) {
                ratioCell.classList.add("text-danger");
            }
            else if (ratio < 50) {
                ratioCell.classList.add("text-warning");
            }
            ratioCell.textContent =  ratio + "%";
        }

        row.appendChild(ratioCell);

        //html
        myTeamTable.appendChild(row);
        
        //csv
        let currentDate = new Date(startDate.getTime());
        let memberEvents = [];
        while (currentDate <= endDate) {
            memberEvents = memberEvents.concat(team.getMemberEvent(member.permat, currentDate.toISOString().split('T')[0]).join(','));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        csvArray.push( [ member.permat, member.name ].concat(memberEvents) );
    });

    hideLoading();

    // on cree le lien de téléchargement
    DOMDownloadButton.addEventListener("click", function (e) { createCsvFile(csvArray)} );

}


function createCsvFile(array){
        
    content = array.map(e => e.join(";")).join("\n");
    var file = new File(["\ufeff"+content], 'export.csv', {type: "data:text/csv;charset=utf-8"});
    url = window.URL.createObjectURL(file);
  
    var a = document.createElement("a");
    a.style = "display: none";
    a.href = url;
    a.download = file.name;
    a.click();
    window.URL.revokeObjectURL(url);
} 


function displayMyRatio(team, startDate, endDate) {

    team.getMembers().forEach(member => { // on aura qu'un seul member dans ce cas
        let ratio = Math.floor((100 * team.getPresentDays(member.permat)) / team.getWorkingDays(member.permat));
        if (isNaN(ratio)) { ratio = 0; } // si getWorkingDay est à 0 --> division par 0 --> NaN
        if (ratio < 40) {
            DOMMeRatio.classList.add("text-danger");
        }
        else if (ratio < 50) {
            DOMMeRatio.classList.add("text-warning");
        }
        DOMMeRatio.innerHTML =  ratio + "%";
    });
    
}

*/

