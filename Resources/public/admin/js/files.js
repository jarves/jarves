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

    /**
     *
     * @param {jarves.Window} pWindow
     */
    initialize: function (pWindow) {
        this.win = pWindow;

        this.files = new jarves.Files(this.win.content, {
            withSidebar: false,
            selection: false,
            standalone: true,
            useWindowHeader: true
        }, this.win);

        if (pWindow.getParameter('selected')) {
            var path = jarves.getObjectIdFromUrl(pWindow.getParameter('selected'));
            console.log('files', pWindow.getParameter('selected'), path);

            this.files.load(path);
        } else {
            this.files.loadRoot();
        }
    }
});