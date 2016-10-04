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

jarves.LabelTypes.Datetime = new Class({
    Extends: jarves.LabelTypes.Date,

    render: function(values) {
        var value = values[this.fieldId] || '';

        if (value != 0 && value) {
            var format = ( !this.definition.format ) ? '%d.%m.%Y %H:%M' : this.definition.format;
            if (typeof value == 'number') {
                return new Date(value * 1000).format(format);
            }
            if (typeof value == 'object') {
                return new Date(value['date'] + ' ' +value['timezone']).format(format);
            }

            return new Date(value).format(format);
        }

        return '';
    }
});