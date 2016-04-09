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

jarves.FieldTypes.Label = new Class({

    Extends: jarves.FieldAbstract,

    container: null,

    Statics: {
        options: {
            label: {
                label: 'Label',
                type: 'text'
            }
        }
    },

    createLayout: function () {
        //remove main if jarves.Field is a table item
        if (this.fieldInstance.main.get('tag') == 'td') {
            this.fieldInstance.main.destroy();

            this.fieldInstance.title.set('colspan', 2);
            this.fieldInstance.title.set('width');
        }

        this.setValue(this.options.label);
    },

    setValue: function (pValue) {

        if (typeOf(pValue) == 'null') {
            return;
        }

        this.fieldInstance.titleText.set('text', pValue);
    },

    getValue: function () {
        return this.fieldInstance.titleText.get('text');
    }
});