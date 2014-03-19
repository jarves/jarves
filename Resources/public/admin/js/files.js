var jarves_files = new Class({

    initialize: function (pWindow) {
        this.win = pWindow;
        this.win.content.setStyle('border', 0);
        this.win.content.setStyle('background-color', 'transparent');
        this.win.getTitleGroupContainer().setStyle('margin-bottom', 10);
        this.kaFiles = new jarves.Files(this.win.content, {
            withSidebar: true,
            selection: false,
            useWindowHeader: true
        }, this.win);
    }
});
