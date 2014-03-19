jarves.FieldTypes.Condition = new Class({

    Extends: jarves.FieldAbstract,

    Statics: {
        asModel: true
    },

    options: {
        object: null,
        field: null,
        startWith: 0
    },

    dateConditions: ['= NOW()', '!=  NOW()', '<  NOW()', '>  NOW()', '<=  NOW()', '>=  NOW()'],

    createLayout: function () {
        this.main = new Element('div', {
            'class': 'jarves-field-condition-container'
        }).inject(this.fieldInstance.fieldPanel);

        new jarves.Button(t('Add condition'))
            .addEvent('click', function(){
                this.addCondition(this.main);
            }.bind(this))
            .inject(this.fieldInstance.fieldPanel);

        new jarves.Button(t('Add group'))
            .addEvent('click', function(){
                this.addGroup(this.main);
            }.bind(this))
            .inject(this.fieldInstance.fieldPanel);

        if (this.options.startWith) {
            for (var i = 0; i < this.options.startWith; i++) {
                this.addCondition(this.main);
            }
        }
    },

    reRender: function (pTarget) {

        pTarget.getChildren().removeClass('jarves-field-condition-withoutRel');

        var first = pTarget.getFirst();
        if (first) {
            first.addClass('jarves-field-condition-withoutRel');
        }

    },

    addCondition: function (pTarget, pValues, pCondition) {
        var div = new Element('div', {
            'class': 'jarves-field-condition-item'
        }).inject(pTarget);

        var table = new Element('table', {
            style: 'width: 100%; table-layout: fixed; background-color: transparent;',
            cellpadding: 1
        }).inject(div);

        var tbody = new Element('tbody').inject(table);
        var tr = new Element('tr').inject(tbody);

        var td = new Element('td', {style: 'width: 40px', 'class': 'jarves-field-condition-relContainer'}).inject(tr);

        var relSelect = new jarves.Select(td);
        document.id(relSelect).setStyle('width', '100%');
        relSelect.add('AND', 'AND');
        relSelect.add('OR', 'OR');

        div.relSelect = relSelect;

        if (pCondition) {
            relSelect.setValue(pCondition.toUpperCase());
        }

        var td = new Element('td').inject(tr);

        if (this.options.object || this.options.field) {
            div.iLeft = new jarves.Select(td, {
                customValue: true
            });

            document.id(div.iLeft).setStyle('width', '100%');

            var objectDefinition = jarves.getObjectDefinition(this.options.object);

            if (this.options.field) {
                div.iLeft.add(this.options.field,
                    objectDefinition.fields[this.options.field].label || this.options.field);
                div.iLeft.setEnabled(false);
            } else {
                Object.each(objectDefinition.fields, function (def, key) {
                    div.iLeft.add(key, def.label || key);
                }.bind(this));
            }

        } else {
            div.iLeft = new jarves.Field({type: 'text', noWrapper: 1}, td);
        }

        if (pValues) {
            div.iLeft.setValue(pValues[0]);
        }

        var td = new Element('td').inject(tr);

        div.iMiddle = new jarves.Field({
            type: 'select',
            noWrapper: true,
            items: ['=', '!=', '<', '>', '<=', '>=', 'LIKE', 'IN', 'NOT IN', 'REGEXP',
                '= CURRENT_USER', '!= CURRENT_USER']
        }, td);

        td.setStyles({
            width: 55,
            textAlign: 'center'
        });

        if (pValues) {
            div.iMiddle.setValue(pValues[1]);
        }

        div.rightTd = new Element('td').inject(tr);

        div.iRight = new jarves.Field({type: 'text', noWrapper: 1}, div.rightTd);
        if (pValues) {
            div.iRight.setValue(pValues[2]);
        }

        if (this.options.fields || this.options.field) {
            div.iLeft.addEvent('change', this.updateRightTdField.bind(this, div));
            div.iMiddle.addEvent('change', this.updateRightTdField.bind(this, div));

            this.updateRightTdField(div);
        }

        var actions = new Element('td', {style: 'width: ' + parseInt((16 * 4) + 3) + 'px'}).inject(tr);

        new Element('a', {
            'class': 'text-button-icon icon-arrow-up-14',
            title: t('Move up'),
            href: 'javascript: ;'
        }).addEvent('click', function () {
                if (div.getPrevious()) {
                    div.inject(div.getPrevious(), 'before');
                    this.reRender(pTarget);
                }
            }.bind(this)).inject(actions);

        new Element('a', {
            'class': 'text-button-icon icon-arrow-down-14',
            title: t('Move down'),
            href: 'javascript: ;'
        }).addEvent('click', function () {
                if (div.getNext()) {
                    div.inject(div.getNext(), 'after');
                    this.reRender(pTarget);
                }
            }.bind(this)).inject(actions);

        new Element('a', {
            'class': 'text-button-icon icon-minus-5',
            title: t('Remove'),
            href: 'javascript: ;'
        }).addEvent('click', function () {
                div.destroy();
                this.reRender(pTarget);
            }.bind(this)).inject(actions);

        this.reRender(pTarget);

    },

    updateRightTdField: function (div) {

        var chosenField = div.iLeft.getValue();

        var objectDefinition = jarves.getObjectDefinition(this.options.object);
        var fieldDefinition = Object.clone(objectDefinition.fields[chosenField]);

        if (div.iRight) {
            var backupedValue = div.iRight.getValue();
        }

        delete div.iRight;

        div.rightTd.empty();

        if (fieldDefinition.primaryKey) {
            if (['=', '!=', 'IN', 'NOT IN'].contains(div.iMiddle.getValue())) {
                fieldDefinition = {
                    type: 'object',
                    object: this.options.object
                };

                if (div.iMiddle.getValue() == 'IN') {
                    fieldDefinition.multi = 1;
                }
            } else {
                fieldDefinition.type = 'text';
            }
        }

        if (div.iMiddle.getValue() == 'IN' || div.iMiddle.getValue() == 'NOT IN') {
            if (fieldDefinition.type == 'select') {
                fieldDefinition.type = 'textlist';
            }
            else {
                fieldDefinition.multi = 1;
            }
        }

        if (['LIKE', 'REGEXP'].contains(div.iMiddle.getValue())) {
            fieldDefinition = {type: 'text'};
        }

        if (fieldDefinition.type == 'object' && fieldDefinition.object == 'user') {
            ['= CURRENT_USER', '!= CURRENT_USER'].each(function (item) {
                div.iMiddle.getFieldObject().getObject().showOption(item);
            });
        } else {
            ['= CURRENT_USER', '!= CURRENT_USER'].each(function (item) {
                div.iMiddle.getFieldObject().getObject().hideOption(item);
            });
        }

        if (fieldDefinition.type == 'date' || fieldDefinition.type == 'datetime') {
            this.dateConditions.each(function (item) {
                div.iMiddle.getFieldObject().getObject().add(item);
            });
        } else {
            this.dateConditions.each(function (item) {
                div.iMiddle.getFieldObject().getObject().remove(item);
            });
        }

        fieldDefinition.noWrapper = true;
        fieldDefinition.fieldWidth = '100%';

        if (!this.dateConditions.contains(div.iMiddle.getValue())) {

            div.iRight = new jarves.Field(
                fieldDefinition, div.rightTd
            );

            div.iRight.code = div.iMiddle.getValue() + '_' + chosenField;

            if (backupedValue) {
                div.iRight.setValue(backupedValue);
            }
        }

    },

    addGroup: function (pTarget, pValues, pCondition) {

        var div = new Element('div', {
            'class': 'jarves-field-condition-group'
        }).inject(pTarget);

        var relContainer = new Element('span', {
            'class': 'jarves-field-condition-relContainer',
            style: 'position: absolute; left: -52px;'
        }).inject(div);

        var relSelect = new jarves.Select(relContainer);
        document.id(relSelect).setStyle('width', '47px');
        relSelect.add('AND', 'AND');
        relSelect.add('OR', 'OR');
        div.relSelect = relSelect;

        if (pCondition) {
            relSelect.setValue(pCondition.toUpperCase());
        }

        var con = new Element('div', {
            'class': 'jarves-field-condition-container'
        }).inject(div);
        div.container = con;

        new jarves.Button(t('Add condition'))
            .addEvent('click', this.addCondition.bind(this, con))
            .inject(con, 'before');

        new jarves.Button(t('Add group'))
            .addEvent('click', this.addGroup.bind(this, con))
            .inject(con, 'before');

        var actions = new Element('span',
            {style: 'position: relative; top: 3px; width: ' + parseInt((16 * 4) + 3) + 'px'}).inject(con, 'before');

        new Element('img', {src: _path + 'bundles/jarves/admin/images/icons/arrow_up.png'})
            .addEvent('click', function () {
                if (div.getPrevious()) {
                    div.inject(div.getPrevious(), 'before');
                    this.reRender(pTarget);
                }
            }.bind(this))
            .inject(actions);

        new Element('img', {src: _path + 'bundles/jarves/admin/images/icons/arrow_down.png'})
            .addEvent('click', function () {
                if (div.getNext()) {
                    div.inject(div.getNext(), 'after');
                    this.reRender(pTarget);
                }
            }.bind(this))
            .inject(actions);

        new Element('img', {src: _path + 'bundles/jarves/admin/images/icons/delete.png'})
            .addEvent('click', function () {
                this.getWin().confirm(t('Really delete?'), function (a) {
                    if (!a) {
                        return;
                    }
                    div.destroy();
                    this.reRender(pTarget);
                }.bind(this));
            }.bind(this))
            .inject(actions);

        this.reRender(pTarget);

        this.renderValues(pValues, con);
    },

    renderValues: function (pValue, pTarget, pLastRel) {
        if (typeOf(pValue) == 'array') {

            var lastRel = pLastRel || '';

            Array.each(pValue, function (item) {

                if (typeOf(item) == 'array' && typeOf(item[0]) == 'array') {
                    //item is a group
                    this.addGroup(pTarget, item, lastRel);

                } else if (typeOf(item) == 'array') {
                    //item is a condition
                    this.addCondition(pTarget, item, lastRel);

                } else if (typeOf(item) == 'string') {
                    lastRel = item;
                }
            }.bind(this));
        }
    },

    setValue: function (pValue) {
        this.main.empty();

        if (typeOf(pValue) == 'string') {
            try {
                pValue = JSON.decode(pValue);
            } catch (e) {

            }
        }

        if (typeOf(pValue) == 'array' && typeOf(pValue[0]) == 'string') {
            pValue = [pValue];
        }

        if (typeOf(pValue) == 'array') {
            this.renderValues(pValue, this.main);
        }

    },

    extractValues: function (pTarget) {

        var result = [];

        pTarget.getChildren().each(function (item) {

            if (item.hasClass('jarves-field-condition-item')) {

                if (!item.hasClass('jarves-field-condition-withoutRel')) {
                    result.push(item.relSelect.getValue());
                }

                result.push([
                    item.iLeft.getValue(),
                    item.iMiddle.getValue(),
                    item.iRight.getValue()
                ]);
            }

            if (item.hasClass('jarves-field-condition-group')) {
                if (!item.hasClass('jarves-field-condition-withoutRel')) {
                    result.push(item.relSelect.getValue());
                }
                result.push(this.extractValues(item.container));
            }

        });

        return result;
    },

    getValue: function () {
        return this.extractValues(this.main);
    }

});
