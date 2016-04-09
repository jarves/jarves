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

jarves.DashboardWidgets.LiveVisitor = new Class({
    Extends: jarves.DashboardWidgets.Base,

    streamPath: 'JarvesBundle/uptime',

    create: function () {
        this.header = new Element('h3', {
            text: jarves.tc('dashboardWidget.liveVisitor', 'Live Visitor')
        })
            .inject(this.main);

        this.visitor = new Element('div', {
            style: 'padding-top: 25px; text-align: center; font-size: 62px;',
            text: '4'
        }).inject(this.main);

        this.visitorDay = new Element('div', {
            style: 'padding-top: 25px; text-align: center; font-size: 32px;',
            text: '53 / day'
        }).inject(this.main);
    },

    update: function (value) {
    }
});