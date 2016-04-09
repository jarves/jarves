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

jarves.FieldTypes.Group = new Class({

    Extends: jarves.FieldAbstract,

    createLayout: function () {
        if (this.fieldInstance.title) {
            this.fieldInstance.title.addClass('jarves-Field-group-title');
        }

        this.fieldInstance.childContainer = new Element('div', {
            'class': 'jarves-Field-group'
        }).inject(this.fieldInstance.toElement());
    }
});