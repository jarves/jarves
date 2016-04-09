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

jarves.DashboardWidgets.Uptime = new Class({
    Extends: jarves.DashboardWidgets.Base,

    streamPath: 'JarvesBundle/uptime',

    create: function () {
        this.header = new Element('h3', {
            text: jarves.tc('dashboardWidget.uptime', 'Uptime')
        })
            .inject(this.main);

        this.uptime = new Element('div', {
            style: 'padding-top: 25px; text-align: center; font-size: 62px;'
        }).inject(this.main);
    },

    update: function (value) {
        this.uptime.set('text', value);
    }
});