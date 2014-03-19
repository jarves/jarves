jarves.LayoutVertical = new Class({

    Implements: [Events, Options],

    options: {

        /**
         * Defines how the layout should look like.
         *
         * [rowHeight1, rowHeight2, ...]
         * Can be a string in % as well.
         * Null means auto-flexi.
         * Int means px.
         *
         *
         * @var {Array}
         */
        rows: [1],

        /**
         * Enabled the cell rendering as it would be if all rows were in only one table.
         * (Means: each column are horizontal arranged under above)
         *
         * What is possible with deactivated grid layout?
         *
         *  Each row gets his own table element, that means:
         *
         * +--+----------+
         * |C |  Cell 2  |
         * |1 |          |
         * +--+--+-------+
         * |     |  Ce   |
         * |  C3 |  ll   |
         * |     |   4   |
         * +-------------+
         * @var {Boolean}
         */
        gridLayout: false,

        /**
         *
         *
         * @var {Boolean}
         */
        fixed: true
    },

    main: null,
    body: null,

    layout: null,
    horizontals: [],
    rows: [],

    initialize: function (pContainer, pOptions) {

        this.setOptions(pOptions);
        if (typeOf(pContainer) == 'null') {
            throw 'pContainer is null.';
        }

        if (instanceOf(pContainer, jarves.Layout)) {
            this.layout = pContainer;
            this.layout.setVertical(this);
        } else {
            this.layout = new jarves.Layout(pContainer, {fixed: this.options.fixed, gridLayout: this.options.gridLayout});
        }

        this.container = this.layout.getMain();

        if (this.options.gridLayout) {

            //we use a table for main=tbody, rows will be TRs
            if (this.container.get('tag') == 'table') {
                this.table = this.container;
            } else {
                this.table = new Element('table', {cellpadding: 0}).inject(this.container);
                //this.table.setStyle('table-layout', 'fixed');
            }
            this.table.setStyles({
                width: '100%',
                height: this.options.fixed ? '100%' : null
            });

            this.container =
                (this.container.get('tag') == 'tbody') ? pContainer : new Element('tbody').inject(this.table);
        }

        this.renderLayout();

    },

    getTable: function () {
        return this.table;
    },

    getLayout: function () {
        return this.layout;
    },

    toElement: function () {
        return this.main;
    },

    renderLayout: function () {

        Array.each(this.options.rows, function (height) {

            this.addRow(height);

        }.bind(this));
    },

    addRow: function (pHeight) {
        var row;

        if (this.container.get('tag') == 'tbody') {
            row = new Element('tr', {height: pHeight}).inject(this.container);
        } else {
            row = new Element('div', {styles: {height: pHeight}}).inject(this.container);
        }

        this.rows.push(row);

        return row;
    },

    getRow: function (pId) {
        return this.rows[pId - 1];
    },

    /**
     * Makes sure that you get a DIV or TD. If the row is a 'tr' in a table, then we'll create a TD.
     * @param pId
     */
    getContentRow: function (pId) {
        if (typeOf(this.rows[pId - 1]) == 'null') {
            throw 'Row not found %s'.replace('%s', pId);
        }

        if (this.rows[pId - 1].get('tag') == 'tr') {
            var children = this.rows[pId - 1].getChildren();
            if (children.length > 0) {
                return children[0];
            }
            else {
                var td = new Element('td', {
                    valign: 'top',
                    height: this.rows[pId - 1].get('height')
                }).inject(this.rows[pId - 1]);

                var div = new Element('div', {
                    'class': 'jarves-Layout-cell'
                }).inject(td);

                return div;
            }
        } else {
            return this.rows[pId - 1];
        }
    },

    getHorizontal: function (pId) {
        return this.horizontals[pId - 1];
    },

    addHorizontal: function (pHorizontal, pHeight) {

        var container = this.addRow(pHeight);
        this.horizontals.push(pHorizontal);
        return container;
    }


});