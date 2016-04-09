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

jarves.LabelTypes.Checkbox = new Class({
    Extends: jarves.LabelAbstract,

    render: function(values) {
        var value = values[this.fieldId] || '';
        var clazz = value ? 'icon-checkmark-2' : 'icon-cross';
        return '<span class="' + clazz + '"></span>';
    }
});