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

jarves.FieldTypes.Predefined = new Class({
    Extends: jarves.FieldAbstract,

    Statics: {
        options: {
            object: {
                label: t('Object key'),
                type: 'objectKey',
                required: true
            },
            field: {
                label: t('Field key'),
                type: 'text',
                required: true
            }
        }
    },

    createLayout: function () {
        //jarves.Field makes the magic
    }

});