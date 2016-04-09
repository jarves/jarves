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

jarves.FieldTypes.ImageGroup = new Class({
    Extends: jarves.FieldAbstract,

    Statics: {
        asModel: true,
        options: {
            items: {
                label: 'Items',
                type: 'array',
                columns: [
                    'Value', 'Label', 'Image'
                ],
                fields: {
                    value: {
                        type: 'text'
                    },
                    label: {
                        type: 'text'
                    },
                    src: {
                        type: 'text'
                    }
                }
            }
        }
    },

    createLayout: function () {
        this.main = new Element('div', {
            style: 'padding: 5px;',
            'class': 'jarves-field-imageGroup'
        }).inject(this.fieldInstance.fieldPanel);

        this.imageGroup = new jarves.ImageGroup(this.main);

        this.imageGroupImages = {};

        var useOwnKey = 'array' === typeOf(this.options.items);

        Object.each(this.options.items, function (image, value) {
            this.imageGroupImages[useOwnKey ? image.value : value] = this.imageGroup.addButton(image.label, image.src);
        }.bind(this));

        this.imageGroup.addEvent('change', this.fieldInstance.fireChange);
    },

    setValue: function (pValue) {
        Object.each(this.imageGroupImages, function (button, tvalue) {
            button.removeClass('jarves-buttonGroup-item');
            if (pValue == tvalue) {
                button.addClass('jarves-buttonGroup-item');
            }
        });
    },

    getValue: function () {
        var value = null;
        Object.each(this.imageGroupImages, function (button, tvalue) {
            if (button.hasClass('jarves-buttonGroup-item')) {
                value = tvalue;
            }
        });

        return value;
    }
});