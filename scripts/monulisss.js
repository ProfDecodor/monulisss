import * as Displayers from './modules/displayers.js';
import * as Api from './modules/api.js';
import * as ApiResponse from './modules/apiresponse.js';
import * as Me from './modules/me.js';
import {selectCalendar} from "./modules/displayers.js";


var myCalendars = null; // contient la liste des calendriers disponibles pour l'utilisateur
var myCalendarDetails = null; // contient les données des calendriers, dans le détail
var me = new Me.Me();


/*
 *  Au lancement de la popup, executons ceci 
 */
browser.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    var currentUrl = tabs[0].url;
    // si on est sur MyUlis (sinon on est pas dessus on se chope une erreur CORS qu'on ne sait pas catcher avec fetch() :( ))
    if (currentUrl.includes('myulis.etnic.be')) {

        /*
         * Récupérer les calendriers et le mettre dans le <select>
         * Préparer le select de dates
         * Puis lancer la méthode pour récupérer les infos du calendrier sélectionné
         */
        Api
            .getMyCalendars()
            .catch( (error) => {
                Displayers.showNotAccessibleMessage(error);
            })
            .then( (jsonResponse) => {
                myCalendars = new ApiResponse.CalendarResponse(jsonResponse);
                Displayers.prepareDateSelector().addEventListener('change', () => { proceedWithSelectedCalendar(); });
                Displayers.prepareCalendarSelector(myCalendars.getListForSelect()).addEventListener('change', () => { proceedWithSelectedCalendar(); });;

                // au chargement, on récupère les sélections précédentes
                restoreOptions();
                proceedWithSelectedCalendar();
            } );

        /*
         * En même temps, récupérer les infos d'identité
         */
        Api
            .getMe()
            .catch( (error) => {
                Displayers.showNotAccessibleMessage(error);
            })
            .then( (jsonResponse) => {

                me.setPermat(jsonResponse.permat);
                me.setFirstName(jsonResponse.prenom);
                me.setLastName(jsonResponse.nom);
                Displayers.displayMe(me);
    
            });        
        
    } 
    else {
        Displayers.showNotAccessibleMessage();
    }
});


function proceedWithSelectedCalendar() {

    let dates = Displayers.getSelectedDates();
    let startDate = dates[0];
    let endDate = dates[1];

    let selectedCalendar = Displayers.getSelectedCalendar();

    if (selectedCalendar.length) {

        /*
         * Récupérer le calendrier sélectionné dans le <select>, en fonction des dates
         */
        Api
            .getCalendar(myCalendars.getCalendarPermats(selectedCalendar), startDate, endDate)
            .catch( (error) => {
                Displayers.showNotAccessibleMessage(error);
            })
            .then( (jsonResponse) => {
                myCalendarDetails = new ApiResponse.CalendarDetailsResponse(jsonResponse, myCalendars.getCalendarPeople(selectedCalendar), startDate, endDate);
console.log(myCalendarDetails.sets);
                // affichage du calendrier
                Displayers.displayCalendarTable(myCalendarDetails);
                Displayers.displayPersonnalRatio(me, myCalendarDetails);
                Displayers.handleDownloadButton(myCalendarDetails);

                Displayers.hideLoading();                
            } );
    }
    else {
        // il doit y avoir une raison pour laquelle je ne fais que masquer le loader et pas afficher un message d'erreur ... mais je ne sais plus pourquoi
        hideLoading();
    }

    // on sauve les selects
    saveOptions();

}

async function saveOptions() {
    /*await browser.storage.sync.set({
        selectedCalendar: Displayers.getSelectedCalendar(),
        selectedDates: Displayers.getSelectedDates(true)
    });*/
}

async function restoreOptions() {
    /*let selectedCalendar = await browser.storage.managed.get('selectedCalendar');
    let selectedDates = await browser.storage.managed.get('selectedDates');

    Displayers.selectCalendar(selectedCalendar);
    Displayers.selectDates(selectedDates);*/

}
