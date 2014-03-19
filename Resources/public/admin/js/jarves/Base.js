jarves.Base = new Class({
    Implements: [Events, Options],

    /**
     * @var {jarves.ProgressWatch}
     */
    progressWatch: null,

    /**
     * @returns {Element}
     */
    toElement: function() {
        return this.main;
    },

    /**
     * @returns {jarves.Window}
     */
    getWin: function() {
        var win = this.toElement().getParent('.kwindow-border');
        if (win) {
            return win.windowInstance;
        }
    },

    inject: function(target, position) {
        this.toElement().inject(target, position);
        return this;
    },

    setStyles: function(styles) {
        this.toElement().setStyles(styles);
        return this;
    },

    setStyle: function(key, value) {
        this.toElement().setStyle(key, value);
        return this;
    },

    getStyle: function(key) {
        this.toElement().getStyle(key);
        return this;
    },

    /**
     * Triggers the 'change' event and sets `dirty` to true.
     */
    fireChange: function() {
        this.setDirty(true);
        this.fireEvent('change');
    },

    /**
     * A asynchronous saving mechanism.
     *
     * @param {jarves.ProgressWatch} progressWatch
     */
    save: function(progressWatch) {
        this.lastProgressWatch = progressWatch;
        progressWatch.done(this.getValue());
    },

    /**
     * Stops the current asynchronous saving process.
     */
    stopSaving: function() {
        if (!this.lastProgressWatch.isFinished()) {
            this.lastProgressWatch.cancel();
        }
    },

    /**
     * Returns true if the content value has been changed.
     *
     * @return {Boolean}
     */
    isDirty: function() {
        return true === this.dirty;
    },

    /**
     *
     * @param {Boolean} dirty
     */
    setDirty: function(dirty) {
        this.dirty = dirty;
    },

    /**
     *
     * @returns {Boolean}
     */
    getDirty: function() {
        return this.dirty;
    },

    /**
     * @returns {jarves.Window}
     */
    getWin: function() {
        return this.findWin();
    },

    /**
     * Finds the jarves.Window instance through a DOM lookup.
     *
     * @return {jarves.Window} The window instance or null
     */
    findWin: function() {
        if (this.win) {
            return this.win;
        }

        var win = this.toElement().getParent('.kwindow-border');
        if (!win) {
            return null;
        }

        this.win = win.windowInstance;

        return this.win;
    },

    mkTable: function(pTarget) {
        if (pTarget) {
            this.oldTableTarget = pTarget;
        }

        if (!pTarget && this.oldTableTarget) {
            pTarget = this.oldTableTarget;
        }

        var table = new Element('table', {width: '100%'}).inject(pTarget);
        new Element('tbody').inject(table);
        this.setTable(table);
        return table;
    },

    setTable: function(pTable) {
        this.baseCurrentTable = pTable;
        this.baseCurrentTBody = pTable.getElement('tbody');
    },

    mkTr: function() {
        this.currentTr = new Element('tr').inject(this.baseCurrentTBody);
        return this.currenTr;
    },

    mkTd: function(pVal) {
        var opts = {};
        if (typeOf(pVal) == 'string') {
            opts.html = pVal;
        }
        return new Element('td', opts).inject(this.currentTr);
    }

});