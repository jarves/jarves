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

jarves.LayoutHorizontal = new Class({

    Implements: [Events, Options],

    options: {

        /**
         * Defines how the layout should look like.
         *
         * [columnWidth1, columnWidth2, ...]
         * Can be a string in % as well.
         * Null means auto-flexi.
         * Int means px.
         *
         * [['40%', 150, null]]
         *
         * @var {Array}
         */
        columns: [1],

        /**
         *
         *
         * @var {Boolean}
         */
        fixed: true,

        /**
         * The height of this horizontal layout. If you provide a non-jarves.LayoutVertical object as pContainer in the
         * constructor, then we'll create one, so that we have anyway a jarves.LayoutVertical object.
         * We set this `height` as the height of the new row we will insert in the jarves.LayoutVertical.
         *
         * @var {String|Integer}
         */
        height: null
    },

    main: null,
    body: null,

    container: null,

    columns: [],
    tds: [],

    vertical: null,

    layout: null,

    /**
     *
     *
     * @param {jarves.LayoutVertical|Element} pContainer
     * @param {Object} pOptions
     */
    initialize: function (pContainer, pOptions) {

        this.setOptions(pOptions);

        if (typeOf(pContainer) == 'null') {
            throw 'pContainer is null.';
        }

        if (instanceOf(pContainer, jarves.LayoutVertical)) {
            this.vertical = pContainer;
        } else {
            this.vertical = new jarves.LayoutVertical(pContainer, {rows: [], gridLayout: true, fixed: this.options.fixed});
        }

        this.container = this.vertical.addHorizontal(this, this.options.height);

        if (this.container && this.container.get('tag') == 'div') {
            //we have no gridLayout, so create a layout with one row and row flexible column.
            this.layout = new jarves.Layout(this.container, {gridLayout: true, layout: [
                {columns: [null]}
            ]});
        }

        this.renderColumns();

    },

    getLayout: function () {
        return this.vertical.getLayout();
    },

    getColumn: function (pColumn) {
        return this.columns[pColumn - 1];
    },

    getTd: function (column) {
        return this.tds[column - 1];
    },

    toElement: function () {
        return this.main;
    },

    renderColumns: function () {

        Array.each(this.options.columns, function (column) {

            this.addColumn(column);

        }.bind(this));
    },

    getVertical: function () {
        return this.vertical;
    },

    getContainer: function () {
        return this.layout ? this.layout.getCell(1, 1) : this.container;
    },

    addColumn: function (pWidth) {
        var td = new Element('td', {
            width: pWidth,
            valign: 'top',
            height: this.getContainer().get('height') || '100%'
        }).inject(this.getContainer());

        var div = new Element('div', {
            'class': 'jarves-Layout-cell'
        }).inject(td);

        this.tds.push(td);
        this.columns.push(div);
    }

});