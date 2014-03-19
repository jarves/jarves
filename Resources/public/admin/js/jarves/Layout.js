jarves.Layout = new Class({

    Implements: [Events, Options],

    options: {

        /**
         * Defines how the layout should look like.
         *
         * Structure:
         *  [
         *     { //row 1
         *       height: 30%,
         *       columns: [150, null],
         *     },
         *     { //row 2
         *       height: 70%,
         *       columns: [null],
         *     }
         *  ]
         *
         * @var {Array}
         */
        layout: [],

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
        gridLayout: true,

        /**
         * True to fullscreen this layout. (position absolute, width: 100%, height 100%)
         *
         * @var {Boolean}
         */
        fixed: true,

        /**
         *
         * Structure:
         *
         * [
         *    [row, column, direction],
         *    ...
         * ]
         *
         * Example:
         *
         * [
         *    [1,1, 'right'] //mean a splitter between cell(1,1) and the right one.
         * ]
         *
         * @var {Array}
         */
        splitter: [],

        /**
         * Connects the width of two cells together, so that when the left ones gets resized
         * it adjusts the width to the equal width of the other/partner-cell as well.
         *
         * Structure
         * [
         *    [ [row, column], [row, column] ],
         *    or
         *    [ [row, column], DOMElement ]
         *    or
         *    [ DOMElement, [row, column] ]
         * ]
         *
         * @var {Array}
         */
        connections: []
    },

    main: null,
    body: null,

    container: null,

    cells: [],

    initialize: function (container, options) {

        this.setOptions(options);
        this.container = container;

        this.main = new Element('div', {
            'class': 'jarves-Layout-main'
        }).inject(container);

        if (this.options.fixed) {
            this.main.addClass('jarves-Layout-main-fixed');
        }

        this.renderLayout();

        this.createResizer();
        this.mapConnections();

    },

    getTable: function () {
        return document.id(this.getVertical().getTable());
    },

    destroy: function () {
        this.main.destroy();
    },

    mapConnections: function () {
        Array.each(this.options.connections, function (connection) {
            this.connectCells(connection[0], connection[1]);
        }.bind(this));
    },

    connectCells: function (cellOne, cellTwo) {
        if (typeOf(cellOne) == 'array') {
            cellOne = this.getCell(cellOne[0], cellOne[1]);
        }
        if (typeOf(cellTwo) == 'array') {
            cellTwo = this.getCell(cellTwo[0], cellTwo[1]);
        }

        if (cellTwo.get('tag') != 'td') {
            cellTwo = cellTwo.getParent('td');
        }

        cellOne.addEvent('resize', function () {
            cellTwo.setStyle('width', cellOne.getStyle('width'));
        }.bind(this));

        cellOne.fireEvent('resize');
    },

    createResizer: function () {
        this.resizer = {};
        Array.each(this.options.splitter, function (resize) {
            if ('array' === typeOf(resize)) {
                var splitter = new jarves.LayoutSplitter(this.getCell(resize[0], resize[1]), resize[2]);
                this.resizer[resize[0] +'_'+ resize[1] + '_' + resize[2]] = splitter;
            } else {
                console.log('wrong format of `splitter`. Should be a array in a array. [ [1, 2, \'right\']]');
            }
        }.bind(this));
    },

    getSplitter: function(row, column, direction) {
        return this.resizer[row + '_' + column + '_' + direction];
    },

    getCell: function (rowNo, columnNo) {
        var row, cell;
        if (row = this.getVertical().getHorizontal(rowNo)) {
            if (cell = row.getColumn(columnNo)) {
                return cell;
            } else {
                throw 'Column ' + columnNo + ' in row ' + rowNo + ' does not exist.';
            }
        } else {
            throw 'Row ' + rowNo + ' does not exist.';
        }
    },

    getTd: function(rowNo, columnNo) {
        var row, cell;
        if (row = this.getVertical().getHorizontal(rowNo)) {
            if (cell = row.getTd(columnNo)) {
                return cell;
            } else {
                throw 'Column ' + columnNo + ' in row ' + rowNo + ' does not exist.';
            }
        } else {
            throw 'Row ' + rowNo + ' does not exist.';
        }
    },

    getRow: function (row) {
        return this.getVertical().getRow(row);
    },

    toElement: function () {
        return this.main;
    },

    /**
     *
     * @param {Boolean} vertical
     */
    setVertical: function (vertical) {
        this.vertical = vertical;
    },

    getVertical: function () {
        return this.vertical;
    },

    getMain: function () {
        return this.main;
    },

    renderLayout: function () {
        if (!this.options.layout || !this.options.layout.length) {
            return;
        }

        if (!this.getVertical()) {
            this.setVertical(new jarves.LayoutVertical(this, {rows: [], gridLayout: this.options.gridLayout}));
        }

        var horizontal;

        Array.each(this.options.layout, function (row) {
            if (row.columns && row.columns.length > 0) {
                horizontal = new jarves.LayoutHorizontal(this.getVertical(), {
                    columns: row.columns,
                    height: row.height
                });
            }
        }.bind(this));
    }
});