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

jarves.FieldTypes.FieldTable = new Class({
    Extends: jarves.FieldAbstract,

    Statics: {
        asModel: true,
        options: {
            addLabel: {
                label: 'Add button label'
            },
            asModel: {
                label: 'As Model',
                description: 'renders `modelOptions` of jarves.Fields instead of `options` if available. Includes ORM specific stuff.',
                type: 'checkbox'
            },
            asFrameworkColumn: {
                label: 'As Column',
                description: 'for column definition, with width field. renders all fields of jarves.LabelTypes.',
                type: 'checkbox'
            },
            asFrameworkSearch: {
                label: 'As Search field',
                description: 'Remove some option fields, like `visibility condition`, `required`, etc',
                type: 'checkbox'
            },
            withoutChildren: {
                label: 'Without children',
                type: 'checkbox'
            },
            allTableItems: {
                label: 'All as table items',
                type: 'checkbox',
                'default': true
            },
            withActions: {
                label: 'With actions',
                type: 'checkbox',
                'default': true
            },
            withWidth: {
                label: 'With width',
                description: 'Is enabled if `as Column` is active. Otherwise you can enable it here manually',
                type: 'checkbox'
            },
            fieldTypes: {
                label: 'Fields whitelist',
                description: 'A comma separated list of types that are allowed.',
                type: 'text'
            },
            fieldTypesBlacklist: {
                label: 'Fields blacklist',
                description: 'A comma separated list of types that are NOT allowed.',
                type: 'text'
            },
            arrayKey: {
                label: 'Allow array keys',
                description: 'Allows key like foo[bar], foo[barsen], foo[bar][sen]',
                type: 'checkbox'
            },
            noActAsTableField: {
                label: 'Without `actAsTable`',
                description: 'Removes the field `Acts as a table item`',
                type: 'checkbox'
            },
            asTableItem: {
                label: 'asTableItem',
                type: 'checkbox',
                'default': true
            },
            keyModifier: {
                label: 'Key field modifier',
                type: 'text',
                description: 'A pipe separated list of modifiers. Exampple: trim|ucfirst|camelcase. Same as `modifier` at Text field.'
            }
        }
    },

    options: {
        addLabel: t('Add'),
        asModel: false, //renders 'modelOptions' of jarves.Fields instead of 'options' if available. Includes ORM specific stuff.
        asFrameworkColumn: false, //for column definition, with width field. renders all fields of jarves.LabelTypes.
        asFrameworkSearch: false, //Remove some option fields, like 'visibility condition', 'required', etc
        withoutChildren: false, //deactivate children?
        tableItemLabelWidth: 330,
        allTableItems: true,
        withActions: true,

        withWidth: false, //is enabled if asFrameworkColumn is active. otherwise you can enable it here manually.

        fieldTypes: false, //if as array defined, we only have types which are in this list
        fieldTypesBlacklist: false, //if as array defined, we only have types which are not in this list

        keyModifier: '',

        asTableItem: true,

        noActAsTableField: false, //Remove the field 'Acts as a table item'
        arrayKey: false //allows key like foo[bar], foo[barsen], foo[bar][sen]
    },

    createLayout: function () {
        this.fieldTable = new jarves.FieldTable(this.fieldInstance.fieldPanel, this.win, this.options);

        this.fieldTable.addEvent('change', this.fireChange);
    },

    setValue: function (pValue) {
        this.fieldTable.setValue(pValue);
    },

    getValue: function () {
        return this.fieldTable.getValue();
    }
});