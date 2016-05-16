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

jarves.FieldTypes.Select = new Class({

    Extends: jarves.FieldAbstract,

    Statics: {
        asModel: true,
        options: {
            __info__: {
                type: 'label',
                label: 'Use static items, a store or a object.'
            },
            items: {
                label: t('static items'),
                desc: t('Use JSON notation. Array(key==label) or Object(key => label). Example: {"item1": "[[Item 1]]"} or ["Foo", "Bar", "Three"].')
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
                desc: 'When options.items is a array and this is false the value is the index, otherwise index=label',
                type: 'checkbox',
                'default': true
            },
//            multi: {
//                label: t('Multiple selection'),
//                desc: t('This field returns then an array.'),
//                'default': false,
//                type: 'checkbox'
//            },
            combobox: {
                label: t('Combobox'),
                'default': false,
                desc: t('if you want to allow the user to enter a own value.'),
                type: 'checkbox'
            },
            object: {
                label: t('Objecy key'),
                combobox: true,
                type: 'objectKey',
                desc: t('The key of the object')
            },
            withoutManageLink: {
                label: t('Without manage link'),
                type: 'checkbox',
                desc: t('Disables the link that points to the crud edit window')
            },
            withoutAddLink: {
                label: t('Without add link'),
                type: 'checkbox',
                desc: t('Disables the link that points to the crud add window')
            }
        }
    },

    options: {
        inputWidth: 'auto',
        style: '',
        combobox: false,
        items: false, //array or object
        store: false, //string
        object: false, //for object chooser
        objectIdAsUrlId: false,
        withoutManageLink: false,
        withoutAddLink: false
    },

    createLayout: function () {
        if (typeOf(this.options.inputWidth) == 'number' || (typeOf(this.options.inputWidth) == 'string' &&
            this.options.inputWidth.replace('px', '') &&
            this.options.inputWidth.search(/[^0-9]/) === -1)) {
            this.options.inputWidth -= 2;
        }

        this.select = new jarves.Select(this.getContainer(), this.options);

        if (this.options.object && (!this.options.withoutManageLink || !this.options.withoutAddLink)) {
            this.definition = jarves.getObjectDefinition(this.options.object);

            if (!this.options.withoutManageLink && this.definition.listEntryPoint) {

                this.manageLink = new jarves.Button(['', '#icon-pencil'], this.openManage.bind(this), t('Manage/Edit'))
                    .inject(this.getContainer());
            }

            if (!this.options.withoutAddLink && this.definition.addEntryPoint) {
                this.addLink = new jarves.Button(['', '#icon-plus-5'], this.openAdd.bind(this), t('Add new'))
                    .inject(this.getContainer());
            }

            if (this.addLink || this.manageLink) {
                this.getContainer().addClass('jarves-field-type-select-with-buttons');
            }
        }

        if (this.options.inputWidth && 'auto' !== this.options.inputWidth) {
            document.id(this.select).setStyle('width', this.options.inputWidth);
        }

        this.select.addEvent('change', this.fireChange);
    },

    openManage: function() {
        var url = jarves.normalizeObjectKey(this.options.object) + '/' + jarves.urlEncode(this.select.getValue());
        var win = jarves.wm.open(this.definition.editEntryPoint, {type: 'edit', selected: url}, null, true);
        win.addEvent('close', function() {
            this.select.reload();
        }.bind(this));
    },

    openAdd: function() {
        var win = jarves.wm.open(this.definition.addEntryPoint, {type: 'add'}, null, true);
        win.addEvent('close', function() {
            this.select.reload();
        }.bind(this));
    },

    toElement: function() {
        return this.select.toElement();
    },

    getObject: function () {
        return this.select;
    },

    setValue: function (value, internal) {
        this.select.setValue(value, internal);
    },

    getValue: function () {
        var value = this.select.getValue();
        if (value && this.options.object && !this.options.objectIdAsUrlId) {
            value = jarves.getObjectPkFromUrlId(this.options.object, value);
        }
        return value;
    },

    setDisabled: function(disabled) {
        this.select.setEnabled(!disabled);
    },

    isDisabled: function() {
        return !this.select.isEnabled();
    }
});