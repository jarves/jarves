var jarves_dashboard = new Class({
    /**
     * 
     * @param {jarves.Window} pWindow
     */
    initialize: function (pWindow) {
        pWindow.hideHead();
        var dashboard = new jarves.Dashboard(pWindow.getContentContainer());
        pWindow.addEvent('closed', function() {
            dashboard.destroy();
        });
    }
});