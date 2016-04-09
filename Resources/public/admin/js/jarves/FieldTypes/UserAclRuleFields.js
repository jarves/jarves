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

jarves.FieldTypes.UserAclRuleFields = new Class({

    Extends: jarves.FieldAbstract,

    rows: {},

    fields: {}, //backup for speed

    createLayout: function () {

        this.value = '';

        this.main = new Element('div', {

        }).inject(this.fieldInstance.fieldPanel);

        new Element('div', {
            style: 'color: silver; padding: 5px 0px;',
            text: t('Please note that these fields are only for view/edit/add forms, not for the listing.')
        }).inject(this.main);

        this.renderFields();

    },

    renderFields: function () {

        var definition = jarves.getObjectDefinition(this.options.object);

        if (!definition) {
            new Element('div', {'class': 'error', text: 'Invalid object: ' + this.options.object}).inject(this.main);
            return;
        }

        this.fields = definition.fields;

        if (!definition.fields || Object.getLength(definition.fields) == 0) {
            new Element('div', {
                style: 'color: silver; padding: 20px; text-align: center;',
                text: t('There are no fields to manage.')
            }).inject(this.main);
            return;
        }

        this.table = new jarves.Table([
            [t('Field'), '200'],
            [t('Access'), '140'],
            [t('Limit field value')]

        ], {absolute: false, hover: false});

        Object.each(definition.fields, function (def, key) {

            var select = new jarves.Select();
            document.id(select).setStyle('width', 140);
            select.add('2', [t('Inherited'), 'bundles/jarves/admin/images/icons/arrow_turn_right_up.png']);
            select.add('0', [t('Deny'), 'bundles/jarves/admin/images/icons/exclamation.png']);
            select.add('1', [t('Allow'), 'bundles/jarves/admin/images/icons/accept.png']);

            var more = '';

            more = this.createConditionRule(def, key);

            this.rows[key] = this.table.addRow([
                def.label || key,
                select,
                more
            ]);

        }.bind(this));

        this.table.inject(this.main);

    },

    createConditionRule: function (pDefinition, pKey) {

        var div = new Element('div');

        var conditions = new Element('div', {
            'class': 'jarves-user-acl-rule-field-item-detail-rule-conditions',
            style: 'padding-left: 15px;'
        }).inject(div);

        new jarves.Button([t('Add field rule'), 'bundles/jarves/admin/images/icons/add.png'])
            .addEvent('click', this.addFieldRule.bind(this, conditions, pKey, null))
            .inject(div);

        return div;
    },

    checkHasFieldRules: function (pFieldKey) {

        if (!this.rows[pFieldKey]) {
            return;
        }

        var selectNode = this.rows[pFieldKey].getElement('.jarves-Select-box');

        if (this.rows[pFieldKey].getElement('.jarves-user-acl-rule-fields-item')) {
            selectNode.instance.setEnabled(false);
            selectNode.instance.setValue('2', true);
        } else {
            selectNode.instance.setEnabled(true);
        }

    },

    addFieldRule: function (pContainer, pFieldKey, pValues) {

        var div = new Element('div', {
            'class': 'jarves-user-acl-rule-fields-item'
        });

        var actions = new Element('div', {
            styles: {
                position: 'absolute',
                left: 15,
                top: -11
            }
        }).inject(div);

        var select = new jarves.Select(actions);
        document.id(select).setStyles({
            width: 100,
            marginRight: 4
        });

        var images = new Element('div', {
            'class': 'jarves-field-condition-container-field-rule-actionBar'
        }).inject(actions);

        var imagesContainer = new Element('div', {
        }).inject(images);

        new Element('img', {src: _path  + 'bundles/jarves/admin/images/icons/arrow_up.png'})
            .addEvent('click', function () {
                if (div.getPrevious()) {
                    div.inject(div.getPrevious(), 'before');
                }
            })
            .inject(imagesContainer);

        new Element('img', {src: _path + 'bundles/jarves/admin/images/icons/arrow_down.png'})
            .addEvent('click',function () {
                if (div.getNext()) {
                    div.inject(div.getNext(), 'after');
                }
            }).inject(imagesContainer);

        new Element('img', {src: _path + 'bundles/jarves/admin/images/icons/delete.png'})
            .addEvent('click', function () {
                this.win._confirm(t('Really delete?'), function (a) {
                    if (!a) {
                        return;
                    }
                    div.destroy();
                    this.checkHasFieldRules(pFieldKey);
                }.bind(this))
            }.bind(this))
            .inject(imagesContainer);

        select.add('0', [t('Deny'), 'bundles/jarves/admin/images/icons/exclamation.png']);
        select.add('1', [t('Allow'), 'bundles/jarves/admin/images/icons/accept.png']);

        if (pValues) {
            select.setValue(pValues.access, true);
        }

        if (this.fields[pFieldKey].type != 'object') {

            var conditionField = new jarves.Field({
                noWrapper: true,
                type: 'condition',
                field: pFieldKey,
                object: this.options.object,
                startWith: 1
            }, div, {win: this.win});

        } else {
            var objectDefinition = jarves.getObjectDefinition(this.options.object);
            var fieldDefinition = objectDefinition.fields[pFieldKey];

            var conditionField = new jarves.Field({
                noWrapper: true,
                type: 'condition',
                object: fieldDefinition.object,
                startWith: 1
            }, div, {win: this.win})
        }

        if (pValues) {
            conditionField.setValue(pValues.condition);
        }

        document.id(conditionField).addClass('jarves-user-acl-rule-fields-item-conditionfield');
        div.conditionField = conditionField;
        div.accessField = select;

        div.inject(pContainer);

        this.checkHasFieldRules(pFieldKey);
    },

    getValue: function () {

        var values = {};

        Object.each(this.rows, function (tr, key) {

            var selectNode = this.rows[key].getElement('.jarves-Select-box');
            var conditions = this.rows[key].getElement('.jarves-user-acl-rule-field-item-detail-rule-conditions');

            if (conditions.getElement('.jarves-user-acl-rule-fields-item')) {

                var detailedRule = [];
                conditions.getChildren().each(function (children) {

                    detailedRule.push({
                        access: children.accessField.getValue(),
                        condition: children.conditionField.getValue()
                    });

                });

                values[key] = detailedRule;

            } else if (selectNode.instance.getValue() != '2') {
                values[key] = selectNode.instance.getValue();
            }

        }.bind(this));

        this.values = values;
        return values;

    },

    setValue: function (pValue) {
        if (!pValue || pValue == '') {
            return;
        }

        if (typeOf(pValue) == 'string') {
            pValue = JSON.decode(pValue);
        }

        this.value = pValue;

        this.renderFieldValues();

    },

    renderFieldValues: function () {

        Object.each(this.value, function (def, key) {

            if (!this.rows[key]) {
                return;
            }

            var conditions = this.rows[key].getElement('.jarves-user-acl-rule-field-item-detail-rule-conditions');
            conditions.getChildren().destroy();

            if (typeOf(def) == 'array') {
                Array.each(def, function (rule) {
                    this.addFieldRule(conditions, key, rule);
                }.bind(this));
            } else {
                var selectNode = this.rows[key].getElement('.jarves-Select-box');
                selectNode.instance.setValue(def, true);
            }
            this.checkHasFieldRules(key);

        }.bind(this));

    },

    isEmpty: function () {
        if (this.value == '') {
            return true;
        }
        return false;
    },

    highlight: function () {
        this.main.highlight();
    }

});