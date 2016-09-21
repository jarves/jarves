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

jarves.LabelTypes.Image = new Class({
    Extends: jarves.LabelAbstract,

    options: {
        width: '100%'
    },

    Statics: {
        options: {
            width: {
                label: t('Width in px'),
                type: 'number',
                description: t('Default is 100%')
            }
        }
    },

    render: function(values) {
        var value = values[this.fieldId] || '';

        if (!value) {
            return '';
        }

        var width = this.options.width;
        var path = _pathAdmin + 'admin/file/preview?' + Object.toQueryString({
            path: value,
            width: '100%' === width ? null : width
        });
        return '<img src="%s" width="%s" />'.sprintf(path, width);
    }
});