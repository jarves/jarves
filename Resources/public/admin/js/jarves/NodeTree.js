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

jarves.NodeTree = new Class({
    Extends: jarves.ObjectTree,

    addRootIcon: function (pItem, pA) {
        pA.icon = new Element('span', {
            'class': 'jarves-objectTree-item-masks icon-globe-3'
        }).inject(pA, 'top');
    },

    addItemIcon: function (pItem, pA) {
        var icon = 'icon-newspaper';

        if (pItem.type == 1) {
            icon = 'icon-link-5';
        } //link
        if (pItem.type == 2) {
            icon = 'icon-folder-4';
        } //folder
        if (pItem.type == 3) {
            icon = 'icon-clipboard-2';
        } //deposit

        pA.icon = new Element('span', {
            'class': 'jarves-objectTree-item-masks ' + icon
        }).inject(pA, 'top');

        if ((pItem.type == 0 || pItem.type == 1) && pItem.visible == 0) {
            //pA.icon.setStyle('color', 'silver');
            pA.setStyle('color', '#999');
        }

        if (pItem.accessDenied == 1) {
            pA.icon.setStyle('color', 'red');
        }

        if (pItem.type == 0 && pItem.accessFromGroups != "" && typeOf(pItem.accessFromGroups) == 'string') {
            new Element('span', {
                'class': 'jarves-objectTree-item-masks icon-users-2',
                style: 'font-size: 12px;position: absolute; left: -3px; bottom: -3px; color: green; text-shadow: 1px -1px 1px white;'
            }).inject(pA.icon, 'top');
        }
    }

});