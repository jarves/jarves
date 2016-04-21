/*
 * This file is part of Jarves.
 *
 * (c) Marc J. Schmidt <marc@marcjschmidt.de>
 *
 *     J.A.R.V.E.S - Just A Rather Very Easy [content management] System.
 *
 *     http://jarves.io
 *
 * To get the full copyright and license information, please view the
 * LICENSE file, that was distributed with this source code.
 */

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
            this.layout = new jarves.Layout(pContainer, {
                fixed: this.options.fixed,
                gridLayout: this.options.gridLayout
            });
        }

        this.container = this.layout.getMain();

        if (this.options.gridLayout) {

            //we use a table for main=tbody, rows will be TRs
            if (this.container.hasClass('jarves-Layout-Table')) {
                this.table = this.container;
            } else {
                this.table = new Element('div', {
                    'class': 'jarves-Layout-Table'
                }).inject(this.container);
                //this.table.setStyle('table-layout', 'fixed');
            }
            this.table.setStyles({
                width: '100%',
                height: this.options.fixed ? '100%' : null
            });

            this.container = this.table;
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

        row = new Element('div', {
            styles: {
                height: pHeight
            },
            'class': 'jarves-Layout-row'
        }).inject(this.container);

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

        if (this.rows[pId - 1].hasClass('jarves-Layout-row')) {
            var children = this.rows[pId - 1].getChildren();
            if (children.length > 0) {
                return children[0];
            }
            else {
                var div = new Element('div', {
                    styles: {
                        height: this.rows[pId - 1].get('height')
                    },
                    'class': 'jarves-Layout-cell'
                }).inject(this.rows[pId - 1]);

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