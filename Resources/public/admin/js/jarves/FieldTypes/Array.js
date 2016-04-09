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

jarves.FieldTypes.Array = new Class({

    Extends: jarves.FieldAbstract,

    Statics: {
        isModel: true,
        options: {
            withOrder: {
                type: 'checkbox',
                label: t('With order possibility'),
                'default': false
            },
            columns: {
                label: t('Columns'),
                type: 'fieldTable',
                options: {
                    asFrameworkColumn: true,
                    withoutChildren: true,
                    tableItemLabelWidth: 200,
                    addLabel: t('Add column')
                }
            },
            fields: {
                label: t('Fields'),
                type: 'fieldTable',
                options: {
                    withoutChildren: true,
                    addLabel: t('Add field')
                }
            },
            startWith: {
                label: 'Start with',
                type: 'number',
                'default': 0
            },
            addText: {
                label: 'Add button label',
                type: 'text'
            },
            withoutRemove: {
                label: 'Without remove button',
                type: 'checkbox',
                'default': false
            },
            asHash: {
                label: 'As Hash',
                type: 'checkbox',
                'default': false
            },
            asArray: {
                label: 'As array',
                type: 'checkbox',
                'default': false
            },
            tableLayout: {
                type: 'checkbox',
                'default': false
            }
        }
    },

    options: {
        asHash: false,

        /**
         *
         * Structure
         *
         * [
         *    {label: 'Column 1', width: 50},
         *    {label: 'Column 2', width: '25%'},
         *    {label: 'Column 3'} //flexible width
         * ]
         *
         * @var {Array}
         */
        columns: [],

        /**
         * All jarves.Field definitions in one big hash.
         *
         * Example:
         *
         * {
         *
         *    field1: {
         *        label: 'Field 1',
         *        type: 'text'
         *    },
         *
         *    field2: {
         *        label: 'Really ?',
         *        type: 'checkbox'
         *    },
         *
         *    field3: {
         *        label: 'With stuff?',
         *        type: 'checkbox',
         *        children: {
         *            field4: {
         *                label: t('A text'),
         *                type: 'text'
         *            },
         *            field5: {
         *                label: t('B text'),
         *                type: 'text'
         *            }
         *        }
         *    }
         *
         *
         * }
         *
         * @var {Object}
         */
        fields: {},

        /**
         * With how many items should we start?
         * @var {Number}
         */
        startWith: 0,

        asArray: false,

        addText: '',

        tableLayout: false
    },

    createLayout: function () {

        var table = new Element('table', {
            cellpadding: 2,
            cellspacing: 0,
            width: '100%',
            'class': 'jarves-field-array'
        }).inject(this.fieldInstance.fieldPanel);

        if (this.options.tableLayout) {
            table.addClass('jarves-Table');
        }

        var thead = new Element('thead').inject(table);
        this.tbody = new Element('tbody').inject(table);

        var actions = new Element('div', {
            'class': 'jarves-ActionBar jarves-ActionBar-left'
        }).inject(this.fieldInstance.fieldPanel);

        var tr = new Element('tr').inject(thead);
        Array.each(this.options.columns, function (col) {

            var td = new Element('th', {
                valign: 'top',
                text: typeOf(col) == 'object' ? col.label : col
            }).inject(tr);

            if (typeOf(col) == 'object') {
                if (col.desc) {
                    new Element('div', {
                        'class': 'jarves-field-array-column-desc',
                        text: col.desc
                    }).inject(td);
                }
                if (col.width) {
                    td.set('width', col.width);
                }
            }
        });
        var td = new Element('th', {
            style: 'width: 30px'
        }).inject(tr);

        if (this.options.withOrder) {
            td.setStyle('width', 52);
        }

        if (!this.options.withoutAdd) {
            new jarves.Button(this.options.addText ? this.options.addText : [t('Add'), '#icon-plus-alt'])
                .addEvent('click', this.addRow.bind(this, [null])).inject(actions);
        }

        Object.each(this.options.fields, function (item, key) {
            if (!this.first) {
                this.first = key;
            } else if (!this.second) {
                this.second = key;
            }
        }.bind(this));

        this.fieldLength = Object.getLength(this.options.fields);

        if (this.options.startWith && this.options.startWith > 0) {
            for (var i = 0; i < this.options.startWith; i++) {
                this.addRow();
            }
        }
    },

    isValid: function () {

        var valid = true;

        this.tbody.getChildren('tr').each(function (tr) {

            if (!valid) {
                return;
            }

            Object.each(tr.fields, function (field) {
                if (!valid) {
                    return;
                }
                if (!field.isValid()) {
                    valid = false;
                }
            });
        });

        return valid;
    },

    checkValid: function () {

        var valid = true;

        this.tbody.getChildren('tr').each(function (tr) {

            Object.each(tr.fields, function (field) {
                if (!field.checkValid()) {
                    valid = false;
                }
            });
        });

        return valid;
    },

    getValue: function () {

        var res = this.options.asHash ? {} : [];

        var ok = true, values;

        this.tbody.getChildren('tr').each(function (tr) {
            if (ok == false) {
                return;
            }

            var row = this.options.asArray ? [] : {};

            ok = tr.fieldForm.isValid();
            if (!ok) {
                return;
            }

            values = tr.fieldForm.getValue();

            Object.each(values, function (value, fieldKey) {
                if (ok == false) {
                    return;
                }

                if (this.options.asArray) {
                    if (this.fieldLength == 1) {
                        row = value;
                    }
                    else {
                        row.push(value);
                    }
                } else {
                    row[fieldKey] = value;
                }

            }.bind(this));

            if (this.options.asHash) {

                if (this.fieldLength > 2) {

                    var hash = {};
                    var i = -1;

                    Object.each(row, function (rvalue, rkey) {
                        i++;
                        if (i == 0) {
                            return;
                        }
                        hash[rkey] = rvalue;

                    });

                    res[row[this.first]] = hash;
                } else {
                    res[row[this.first]] = row[this.second];
                }
            } else {
                res.push(row);
            }

        }.bind(this));

        if (ok == false) {
            return;
        }

        return res;
    },

    setValue: function (pValue) {
        this.tbody.empty();

        if ('null' === typeOf(pValue)) {
            return;
        }

        if (typeOf(pValue) == 'string') {
            pValue = JSON.decode(pValue);
        }

        if (this.options.asHash) {
            if (this.fieldLength > 2) {

                Object.each(pValue, function (item, idx) {
                    var val = {};
                    val[this.first] = idx;
                    Object.each(item, function (iV, iK) {
                        val[iK] = iV;
                    });
                    this.addRow(val);
                }.bind(this));

            } else {

                Object.each(pValue, function (item, idx) {
                    var val = {};
                    val[this.first] = idx;
                    val[this.second] = item;

                    this.addRow(val);
                }.bind(this));
            }
        } else {
            Array.each(pValue, function (item) {
                if (this.options.asArray) {
                    if (this.fieldLength == 1) {
                        var nItem = {};
                        nItem[this.first] = item;
                        this.addRow(nItem);
                    } else {

                        var nItem = {};
                        var index = 0;
                        Object.each(this.options.fields, function (def, key) {
                            nItem[key] = item[index];
                            index++;
                        });
                        this.addRow(nItem);
                    }
                } else {
                    this.addRow(item);
                }
            }.bind(this));
        }

    },

    removeRow: function(index) {
        this.tbody.getChildren('tr')[index].destroy();
    },

    addRow: function (pValue) {
        if (this.options.designMode) {
            return;
        }

        var tr = new Element('tr').inject(this.tbody);
        tr.fields = {};

        tr.fieldForm = new jarves.FieldForm();

        Object.each(this.options.fields, function (field, fieldKey) {
            var copy = Object.clone(field);
            copy.noWrapper = 1;
            var nField;

            var td = new Element('td', {
                'class': 'jarves-field',
                valign: 'top'
            }).inject(tr);

            if (copy.children) {
                var parseFields = {};
                parseFields[fieldKey] = copy;
                nField = new jarves.FieldForm(td, parseFields, {}, {win: this.win});
            } else {
                nField = new jarves.Field(copy, td, fieldKey, tr.fieldForm);
            }

            tr.fieldForm.attachField(fieldKey, nField, copy);

            tr.fields[fieldKey] = nField;
        }.bind(this));

        tr.fieldForm.setValue(pValue);
        tr.fieldForm.addEvent('change', this.fireChange);

        var td;
        if (this.options.withOrder || !this.options.withoutRemove) {
            td = new Element('td', {valign: 'top', width: 10, style: 'white-space: nowrap'}).inject(tr);
        }

        if (this.options.withOrder) {

            new Element('a', {
                'class': 'jarves-button-icon icon-arrow-up-14',
                title: t('Move up'),
                href: 'javascript: ;'
            }).addEvent('click',function () {
                if (tr.getPrevious()) {
                    tr.inject(tr.getPrevious(), 'before');
                    this.fireChange();
                }
            }).inject(td);

            new Element('a', {
                'class': 'jarves-button-icon icon-arrow-down-14',
                title: t('Move down'),
                href: 'javascript: ;'
            }).addEvent('click',function () {
                if (tr.getNext()) {
                    tr.inject(tr.getNext(), 'after');
                    this.fireChange();
                }
            }).inject(td);

        }

        if (!this.options.withoutRemove) {
            new Element('a', {
                'class': 'jarves-button-icon icon-minus-5',
                title: t('Remove'),
                href: 'javascript: ;'
            }).addEvent('click', function () {
                tr.destroy();
                this.fireChange();
            }.bind(this)).inject(td);
        }

    }

});