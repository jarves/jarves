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

jarves.FieldTypes.Tab = new Class({
    Extends: jarves.FieldAbstract,

    Statics: {
        options: {
            fullPage: {
                label: t('Full page'),
                type: 'checkbox'
            }
        }
    },

    options: {
        fullPage: false
    },

    createLayout: function () {
        //this.tab = new jarves.TabPane(this.fieldInstance.fieldPanel, this.options.fullPage);

        //FieldForm does the magic already.
        //Maybe we should move that part into this.
    }

});