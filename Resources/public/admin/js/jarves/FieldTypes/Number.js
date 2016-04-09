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

jarves.FieldTypes.Number = new Class({

    Extends: jarves.FieldTypes.Text,

    Statics: {
        asModel: true
    },

    createLayout: function () {
        this.parent();

        this.input.type = 'number';

        this.input.addEvent('keyup', function () {
            this.value = this.value.replace(/[^0-9\-,\.]/g, '');
        });

    },

    getValue: function () {
        if (this.input.value === '') {
            return '';
        }
        return parseFloat(this.input.value);
    }
});