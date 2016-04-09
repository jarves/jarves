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

jarves.FieldTypes.Container = new Class({
    Extends: jarves.FieldAbstract,

    createLayout: function (container) {
        //deactivate auto-hiding of the childrenContainer.
        this.fieldInstance.handleChildsMySelf = true;

        this.fieldInstance.prepareChildContainer = function() {
            this.fieldInstance.childContainer = new Element('div', {
                'class': 'jarves-field-container'
            }).inject(container);
        }.bind(this);
    }
});