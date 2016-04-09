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

var jarves_help = new Class({

    initialize: function (pWin) {
        this.win = pWin;

        this._createLayout();
        this.loadTree();

        if (this.win.params && this.win.params.id) {
            this.loadHelp(this.win.params.id);
        }
    },

    _createLayout: function () {

        this.left = new Element('div', {
            'class': 'jarves-help-left'
        }).inject(this.win.content);

        this.main = new Element('div', {
            'class': 'jarves-help-main'
        }).inject(this.win.content);

        this.content = new Element('div', {
            'class': 'jarves-help-main-content'
        }).inject(this.main);

    },

    loadTree: function () {
        this.left.empty();
        this.leftLoader = new jarves.Loader().inject(this.left);

        new Request.JSON({url: _pathAdmin + 'admin/backend/help/loadTree', noCache: 1, onComplete: function (res) {

            this.renderTree(res);
            this.leftLoader.hide();

        }.bind(this)}).post({lang: window._session.lang});

    },

    renderTree: function (pItems) {

        $H(pItems).each(function (faqs, key) {
            var h3 = new Element('h4', {
                html: key,
                style: 'margin: 0px;'
            }).inject(this.left);

            var container = new Element('div', {
                style: 'display: none; padding: 2px; padding-left: 9px;'
            }).inject(this.left);

            var img = new Element('img', {
                src: _path + 'bundles/jarves/admin/images/icons/tree_plus.png',
                style: 'position: relative; top: 1px; margin-right: 3px;',
                lang: 0
            }).addEvent('click',
                function (e) {
                    if (this.lang == 0) {
                        this.src = _path + 'bundles/jarves/admin/images/icons/tree_minus.png';
                        this.lang = 1;
                    } else {
                        this.src = _path + 'bundles/jarves/admin/images/icons/tree_plus.png';
                        this.lang = 0;
                    }
                    container.setStyle('display', (this.lang == 0) ? 'none' : 'block');
                    if (e) {
                        e.stop();
                    }

                }).fireEvent('click').inject(h3, 'top');

            faqs.each(function (faq) {

                new Element('a', {

                    text: '» ' + faq.title,
                    href: 'javascript:;',
                    style: 'display: block; text-decoration: none;'

                }).addEvent('click', function () {
                        this.loadHelp(faq.open);
                    }.bind(this)).inject(container);

            }.bind(this));

        }.bind(this));

    },

    softOpen: function (pParams) {
        this.loadHelp(pParams.id);
        this.params = {id: pParams.id};
    },

    loadHelp: function (pId) {
        this.content.set('html', _('Loading ...'));

        new Request.JSON({url: _pathAdmin + 'admin/backend/help/load', noCache: 1, onComplete: function (res) {
            this.content.set('html', '');

            this.win.setTitle(_('Help') + ' - ' + res.title);

            new Element('h2', {
                html: res.title,
                style: 'margin: 4px 0px;'
            }).inject(this.content);

            new Element('h4', {
                html: _('Tags: ') + res.tags,
                style: 'color: gray; margin: 3px 0px; border-bottom: 1px solid #ddd;'
            }).inject(this.content);

            new Element('div', {
                html: res.help,
                style: 'padding: 4px 0px; white-space: pre-wrap; font-size: 11px; color: #333;'
            }).inject(this.content);

        }.bind(this)}).post({id: pId, lang: window._session.lang});
    }
});
