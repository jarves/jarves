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

jarves.AutoTable = new Class({

    initialize: function (pOpts) {
        this.opts = pOpts;
        this._createLayout();
    },

    _createLayout: function () {
        this.box = new Element('div', {
            'class': 'jarves-autotable-box'
        });
        this.boxBorder = new Element('div', {
            'class': 'jarves-autotable-box-border'
        }).inject(this.box);
        ;

        this.boxTitle = new Element('div', {
            'class': 'jarves-autotable-box-container',
            html: this.opts.title
        }).inject(this.boxBorder);

        this.boxMain = new Element('div', {
            'class': 'jarves-autotable-box-main'
        }).inject(this.boxBorder);
    },

    inject: function (p1, p2) {
        this.box.inject(p1, p2);
    }


});
