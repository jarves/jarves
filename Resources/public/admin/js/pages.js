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

var jarves_pages = new Class({

    /**
     * @var {jarves.Window}
     */
    win: null,

    initialize: function (pWin) {
        this.win = pWin;
        this.createLayout();
    },

    createLayout: function () {
        this.win.content.setStyle('overflow', 'hidden');
        document.id(this.win.getMainLayout()).addClass('jarves-pages-main-layout');

        new jarves.Field({
            noWrapper: true,
            type: 'PageContents',
            options: {
                standalone: true
            }
        }, this.win.content);
    }

});