var jarves_pages = new Class({

    /**
     * @var {jarves.Window}
     */
    win: null,

    initialize: function (pWin) {
        this.win = pWin;
        this.createLayout();
    },

    createLayout: function () {
        this.win.content.setStyle('border', 0);
        this.win.content.setStyle('top', 0);
        this.win.content.setStyle('overflow', 'hidden');
        this.win.content.setStyle('background-color', 'transparent');
        document.id(this.win.getMainLayout()).addClass('jarves-pages-main-layout');

        new jarves.Field({
            noWrapper: true,
            type: 'PageContents',
            options: {
                standalone: true
            }
        }, this.win.content);
    }

});