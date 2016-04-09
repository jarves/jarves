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

jarves.FileTree = new Class({
    Extends: jarves.ObjectTree,

    initialize: function(pContainer, pOptions, pRefs) {
        this.dndOnlyInside = true;
        this.parent(pContainer, pOptions, pRefs);
    },

    addItem: function(pItem, pParent) {
        var a = this.parent(pItem, pParent);
        a.addClass('jarves-files-item');
        a.fileItem = pItem;
    }
});