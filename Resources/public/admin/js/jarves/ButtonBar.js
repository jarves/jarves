jarves.ButtonBar = new Class({
    initialize: function (pParent) {
        this.buttons = [];
        this.box = new Element('div', {
            'class': 'kwindow-win-buttonBar'
        }).inject(pParent);
    },

    destroy: function () {
        this.box.destroy();
    },

    toElement: function () {
        return this.box;
    },

    inject: function (pTo, pWhere) {
        this.box.inject(pTo, pWhere);
        return this;
    },

    setStyle: function (p, p2) {
        this.box.setStyle(p, p2);
    },

    hide: function () {
        this.box.setStyle('display', 'none');
        return this;
    },

    show: function () {
        this.box.setStyle('display', 'block');
        return this;
    },

    addButton: function (pTitle, pOnClick) {
        return new jarves.Button(pTitle).addEvent('click', pOnClick).inject(this.box);
    }
});
