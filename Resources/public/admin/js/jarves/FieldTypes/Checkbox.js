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

jarves.FieldTypes.Checkbox = new Class({

    Extends: jarves.FieldAbstract,

    Statics: {
        asModel: true
    },

    createLayout: function () {
        this.checkbox = new jarves.Checkbox(this.fieldInstance.fieldPanel);

        this.checkbox.addEvent('change', this.fireChange);
    },

    setValue: function (pValue) {
        this.checkbox.setValue(pValue);
    },

    getValue: function () {
        return this.checkbox.getValue();
    }
});