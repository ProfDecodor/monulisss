import * as Displayers from './modules/displayers.js';
import * as Api from './modules/api.js';
import * as ApiResponse from './modules/apiresponse.js';
import * as Me from './modules/me.js';


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
                myCalendarDetails = new ApiResponse.CalendarDetailsResponse(jsonResponse, myCalendars.getCalendarPeople(selectedCalendar));
//console.log(myCalendarDetails.sets);
                // affichage du calendrier
                Displayers.displayCalendarTable(myCalendarDetails);
                Displayers.displayPersonnalRatio(me, myCalendarDetails);

                Displayers.hideLoading();                
            } );
    }
    else {
        // il doit y avoir une raison pour laquelle je ne fais que masquer le loader et pas afficher un message d'erreur ... mais je ne sais plus pourquoi
        hideLoading();
    }

}






/*
// la fonction qui lance le bouzin
function launch() {
    
}

function getMe() {

    fetch(API_ME)
        .then(response => response.json())
        .then(data => {
            me.setPermat(data.permat);
            me.setFirstName(data.prenom);
            me.setLastName(data.nom);

            // on rajoute ensuite un calendrier personnel, ne contenant que le numéro ulis de l'utilisateur
            myCalendars.set("__MYSELF__", new Team());
            myCalendars.get("__MYSELF__").addMember(me.getPermat(), me.getFirstName() + " " + me.getLastName());
            
            displayMe();
            retriveDataFromApiAndDisplay("__MYSELF__");
            
        });

}




        .then(data => {
            data.forEach(requestResponse => {
                requestResponse.forEach( item => {
                    const day = item.day;
                    const permat = item.permat; 
    
                    // un payload existe si un événement a eu lieu le jour
                    if (item.payload) {
                        switch (item.type) {
                            case 'FERMETURE':
                                // on ne prend que les journées entières de fermture
                                // si une demi-journée, la journée est comptée comme jour de travail
                                if (item.payload.period == 'JE') {
                                    myTeam.addTeamMemberEvent(permat, day, "FERMETURE");
                                }
                                break;
                            case 'ABSENCES':
                                if (item.payload[0]){ 
                                    if (item.payload[0].dossier) {
                                        myTeam.addTeamMemberEvent(permat, day, item.payload[0].dossier.nature.code);
                                    }
                                }
                                break;
                            case 'POINTAGES':
                                if (item.payload.pointages) {
                                    for (const pointage of item.payload.pointages) {
                                        if (pointage.nature && pointage.nature.code) {
                                            myTeam.addTeamMemberEvent(permat, day, pointage.nature.code);
                                        }
                                    }
                                }
                                break;
                            default: 
                                console.log("Type d'événement inconnu : " + item.type);
                        }
                    }
                    
                });
            });
    
    
            //surement possible de faire mieux ici
            if (selectedCalendar == "__MYSELF__") {
                displayMyRatio(myTeam, startDate, endDate);
            }
            else {
                displayMyTeamTable(myTeam, startDate, endDate);
            }
    
        })
        .catch(error => {
            console.error("Erreur : " + error);
            displayNotAccessibleMessage();
        });
    
        
    }
    else {
        hideLoading();
    }

}

*/