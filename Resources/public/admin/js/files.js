var jarves_files = new Class({

    initialize: function (pWindow) {
        this.win = pWindow;
        this.kaFiles = new jarves.Files(this.win.content, {
            withSidebar: false,
            selection: false,
            useWindowHeader: true
        }, this.win);
    }
});
