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

var jarves_files = new Class({

    initialize: function (pWindow) {
        this.win = pWindow;
        this.kaFiles = new jarves.Files(this.win.content, {
            withSidebar: false,
            selection: false,
            useWindowHeader: true
        }, this.win);
    }
});
