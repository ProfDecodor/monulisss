//gère l'ouverture d'un tab pour aller sur myulis
browser.runtime.onMessage.addListener(function(request) {
    if (request.message === "open_new_tab") {
        browser.tabs.create({"url": request.url});
    }
});