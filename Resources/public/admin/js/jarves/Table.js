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

jarves.Table = new Class({

    Binds: ['updateTableHeader'],
    Implements: [Options, Events],

    tableBody: false,
    safe: false,

    options: {
        absolute: true, //full size
        selectable: false,
        multi: false,
        alignTop: true,
        hover: true, //hover effect
        valign: 'top',
        safe: true //htmlentities
    },

    /**
     * Constructor
     *
     * @param {Array} pColumns [ ["label", optionalWidth], ["label", optionalWidth], ... ]
     * @param {Array} pOptions
     */
    initialize: function (pColumns, pOptions) {
        this.setOptions(pOptions);

        this.main = new Element('div');

        if (this.options.absolute) {
            this.main.addClass('jarves-Table-absolute');
        }

        if ('top' !== this.options.valign) {
            this.main.addClass('jarves-Table-valign-' + this.options.valign);
        }

        if (this.options.hover) {
            this.main.addClass('jarves-Table-hover');
        }

        if (this.options.alignTop) {
            this.main.addClass('jarves-Table-alignTop');
        }

        if (this.options.selectable == true) {
            this.main.addEvent('dblclick:relay(td)', function (e, item) {
                this.fireEvent('instantSelect');
            }.bind(this));
            this.main.addEvent('click:relay(td)', function (e, item) {
                this.fireEvent('preSelect');

                if (!this.multi || (this.multi && (e.ctrl != true && e.meta != true))) {
                    item.getParent().getParent().getChildren('tr').removeClass('active');
                }
                item.getParent().addClass('active');
                this.fireEvent('select', item);
            }.bind(this));

            this.main.addEvent('click:relay(th)', function (e, item) {
                this.fireEvent('selectHead', item);
            }.bind(this));

            this.main.addEvent('click', function (e) {
                this.fireEvent('preDeselect');
                e.target.getElements('tr').removeClass('active');
                this.fireEvent('deselect');
            }.bind(this));
        }

        if (pColumns && typeOf(pColumns) == 'array') {
            this.setColumns(pColumns);
        }

    },

    deselect: function () {
        this.tableBody.getElements('tr').removeClass('active');
        this.tableBody.getElements('tr').removeClass('jarves-table-body-item-active');
    },

    selected: function () {
        return this.tableBody.getElement('tr.active') || this.tableBody.getElement('tr.jarves-table-body-item-active');
    },

    inject: function (pTo, pWhere) {
        this.main.inject(pTo, pWhere);
        return this;
    },

    hide: function () {
        this.main.setStyle('display', 'none');
    },

    show: function () {
        this.main.setStyle('display', 'block');
    },

    toElement: function () {
        return this.main;
    },

    /**
     * @param {Boolean} pActivate
     */
    loading: function (pActivate) {

        if (!pActivate && this.loadingOverlay) {

            if (this.tableBody) {
                this.tableBody.setStyle('opacity', 1);
            }

            this.loadingOverlay.destroy();

        } else if (pActivate) {

            if (this.tableBody) {
                this.tableBody.setStyle('opacity', 0.5);
            }

            if (this.loadingOverlay) {
                this.loadingOverlay.destroy();
            }

            this.loadingOverlay = new Element('div', {
                style: 'position: absolute; left: 0px; top: 21px; right: 0px; bottom: 0px; text-align: center;'
            }).inject(this.body);

            new Element('img', {
                src: _path + 'bundles/jarves/admin/images/jarves-tooltip-loading.gif'
            }).inject(this.loadingOverlay);

            new Element('div', {
                html: _('Loading ...')
            }).inject(this.loadingOverlay);

            var size = this.loadingOverlay.getSize();
            this.loadingOverlay.setStyle('padding-top', (size.y / 2) - 50);
        }
    },

    /**
     *
     * @param {Integer} index Starting at 1
     */
    getColumn: function (index) {
        return this.tableHead.getElement('tr').getChildren()[index - 1];
    },

    /**
     * Set the columns of the table.
     *
     * @param {Array} pColumns  [ ["label", optionalWidth], ["label", optionalWidth], ... ]
     *
     * @return {Element[]} THs
     */
    setColumns: function (pColumns) {
        this.columns = pColumns;

        if (!pColumns && typeOf(pColumns) != 'array') {
            return;
        }

        var fragment = document.createDocumentFragment();

        if (this.options.absolute) {
            this.head = new Element('div', {
                'class': 'jarves-Table-head-container'
            }).inject(fragment);

            if (this.options.absolute == false) {
                this.head.setStyle('position', 'relative');
            }

            this.tableHead = new Element('table', {
                'class': 'jarves-Table-head',
                cellpadding: 0, cellspacing: 0
            }).inject(this.head, 'top');

            if (this.body) {
                this.body.destroy();
            }

            if (this.options.absolute == false) {
                this.body = new Element('div', {
                    'class': 'jarves-scrolling',
                    style: 'position: relative;'
                }).inject(fragment);
            } else {
                this.body = new Element('div', {
                    'class': 'jarves-Table-body-container jarves-scrolling'
                }).inject(fragment);
            }

            this.tableBody = new Element('table', {
                'class': 'jarves-Table-body',
                cellpadding: 0, cellspacing: 0
            }).inject(this.body);
        } else {
            this.table = new Element('table', {
                'class': 'jarves-Table'
            }).inject(fragment);

            this.tableHead = new Element('thead').inject(this.table);
            this.tableBody = new Element('tbody').inject(this.table);

            if (this.options.hover) {
                this.table.addClass('jarves-Table-hover');
            }

            if (this.options.alignTop) {
                this.table.addClass('jarves-Table-alignTop');
            }
        }

        var tr = new Element('tr').inject(this.tableHead);

        var columns = [];
        pColumns.each(function (column, index) {

            /**
             * column[0] = String|HTMLElement, actual content to display
             * column[1] = String|Integer, width
             * column[2] = String, text-align
             *
             */
            var th = new Element('th', {
                html: ('element' !== typeOf(column[0]) ? column[0] : null),
                styles: {
                    width: column[1],
                    textAlign: column[2]
                }
            }).inject(tr);

            if ('element' === typeOf(column[0])) {
                column[0].inject(th);
            }

            columns.push(th);
        }.bind(this));

        this.main.empty();
        this.main.appendChild(fragment);

        return columns;
    },

    getBody: function() {
        return this.tableBody;
    },

    getRows: function () {
        var children = this.tableBody.getChildren();
        if (typeOf(children) == 'array' && children[0].get('tag') == 'tbody') {
            return children[0].getChildren();
        } else {
            return children;
        }
    },

    addRow: function (pValues, pIndex, pNoHeaderUpdate) {
        if (!pIndex) {
            pIndex = this.tableBody.getElements('tr').length + 1;
        }

        var row = pValues;

        var tr = new Element('tr').inject(this.tableBody);
        tr.store('rowIndex', pIndex);

        var count = 0;
        this.columns.each(function (column, index) {
            var html = "";
            if ((typeOf(row[count]) == 'string' || typeOf(row[count]) == 'number') && !row[count].inject) {
                html = row[count];
            }

            var td = new Element('td', {
                styles: {
                    width: !isNaN(column[1]) ? parseInt(column[1]) : column[1],
                    textAlign: column[2]
                }
            }).inject(tr);

            if (this.safe || this.options.safe) {
                if (column[2] == 'html') {
                    td.set('html', html);
                } else {
                    td.set('text', html);
                }
            } else {
                td.set('html', html);
            }

            td.store('rowIndex', pIndex);

            if (row[count] && row[count].inject) {
                row[count].inject(td);
            }

            count++;

        }.bind(this));

        if (!pNoHeaderUpdate) {
            this.updateTableHeader();
        }

        return tr;
    },

    updateTableHeader: function () {
        if (this.options.absolute) {
            var firstTr = this.tableBody.getElement('tr');
            if (firstTr) {
                var columns = this.tableHead.getElement('tr').getChildren('th');
                firstTr.getChildren('td').each(function(td, index) {
                    columns[index].setStyle('width', td.getScrollSize().x - 6); //3+3 padding
                }.bind(this));
            }

            var height = parseInt(this.tableHead.getSize().y);
            if (27 > height) {
                height = 27;
            }
            this.body.setStyle('top', height);
            this.head.setStyle('height', height);
        }
    },

    empty: function () {
        this.tableBody.empty();
    },

    setValues: function (pValues) {
        this.tableBody.empty();

        if (typeOf(pValues) == 'array') {
            pValues.each(function (row) {
                this.addRow(row, null, true);
            }.bind(this));
        }

        this.updateTableHeader();
    }


});
