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

jarves.FieldTypes.TextboxList = new Class({

    Extends: jarves.FieldAbstract,

    Statics: {
        asModel: true,
        options: {
            'doubles': {
                label: t('Allow double entries'),
                type: 'checkbox'
            },
            __info__: {
                type: 'label',
                label: 'Use static items, a store or a object.'
            },
            items: {
                label: t('static items'),
                description: t('Use JSON notation. Array(key==label) or Object(key => label). Example: {"item1": "[[Item 1]]"} or ["Foo", "Bar", "Three"].')
            },
            /**
             * When options.items is a array and this is false the value is the index, otherwise index=label.
             *
             * true:
             *     ['a', 'b', 'c'] => 'c' returns 'c' as value
             * false:
             *     ['a', 'b', 'c'] => 'c' returns 2 as value
             *
             * @var {Boolean}
             */
            itemsLabelAsValue: {
                label: '`items` label as value',
                description: 'When options.items is a array and this is false the value is the index, otherwise index=label',
                type: 'checkbox',
                'default': true
            },
            multi: {
                label: t('Multiple selection'),
                description: t('This field returns then an array.'),
                'default': false,
                type: 'checkbox'
            },
            combobox: {
                label: t('Combobox'),
                'default': false,
                description: t('if you want to allow the user to enter a own value.'),
                type: 'checkbox'
            },
            object: {
                label: t('Objecy key'),
                combobox: true,
                type: 'objectKey',
                description: t('The key of the object')
            },
            withoutManageLink: {
                label: t('Without manage link'),
                type: 'checkbox',
                description: t('Disables the link that points to the manage-window')
            },
            withoutAddLink: {
                label: t('Without add link'),
                type: 'checkbox',
                description: t('Disables the link that points to the add-window')
            }
        }
    },

    options: {
        items: false, //array or object
        store: false, //string
        object: false, //for object chooser
        customValue: false //boolean
    },

    createLayout: function () {

        this.select = new jarves.TextboxList(this.fieldInstance.fieldPanel, this.options);

        document.id(this.select).setStyle('width', this.options.inputWidth ?
            this.options.inputWidth : '100%');

        this.select.addEvent('change', this.fireChange);

    },

    setValue: function (pValue) {
        this.select.setValue(pValue);
    },

    getValue: function () {
        return this.select.getValue();
    }
});