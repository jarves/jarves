var jarves_dashboard = new Class({
    initialize: function (pWindow) {
        pWindow.hideHead();
        new jarves.Dashboard(pWindow.getContentContainer());
    }
});