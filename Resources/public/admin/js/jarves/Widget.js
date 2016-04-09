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

jarves.Widget = new Class({
    Implements: Events,

    initialize: function (pOpts, pContainer, pAsOverview) {

        this.opts = pOpts;
        this.opts.refresh = this.opts.refresh ? this.opts.refresh : 20000;
        this.container = pContainer;
        this.asOverview = pAsOverview;

        this.loadWindow();
        this.load();

        this.addEvent('close', function () {
            if (this.lastDelayId) {
                clearTimeout(this.lastDelayId);
            }
            if (this.lastrq) {
                this.lastrq.cancel();
            }
            this.closed = true;
            this.main.destroy();
        }.bind(this));

    },

    loadWindow: function () {

        this.main = new Element('div', {
            'class': 'jarves-widget-main' + ((this.asOverview) ? ' jarves-widget-overview' : ''),
            style: 'height: 150px;'
        }).inject(this.container);

        if (this.opts.height) {
            this.main.setStyle('height', this.opts.height);
        }

        if (this.opts.width) {
            this.main.setStyle('width', this.opts.width);
        }

        if (this.opts.defaultHeight) {
            this.main.setStyle('height', this.opts.defaultHeight);
        }

        this.title = new Element('div', {
            'class': 'jarves-widget-title',
            html: _(this.opts.title)
        }).inject(this.main);

        //navi
        this.navi = new Element('div', {
            style: 'position: absolute; top: 4px; right: 22px;'
        }).inject(this.main);

        var myPath = _path + 'bundles/jarves/admin/images/icons/';

        this.ctrlPrevious = new Element('img', {
            src: myPath + 'control_back.png'
        }).addEvent('click', function () {
                this.go2Page(parseInt(this.currentPage) - 1);
            }.bind(this)).inject(this.navi);

        this.ctrlText = new Element('span', {
            text: 1,
            style: 'padding: 0px 3px 5px 3px; position: relative; top: -4px;'
        }).inject(this.navi);

        this.ctrlNext = new Element('img', {
            src: myPath + 'control_play.png'
        }).addEvent('click', function () {
                this.go2Page(parseInt(this.currentPage) + 1);
            }.bind(this)).inject(this.navi);

        this.content = new Element('div', {
            'class': 'jarves-widget-content',
            html: '<center><img src="' + _path + 'bundles/jarves/admin/images/jarves-tooltip-loading.gif" /></center>'
        }).inject(this.main);

        this.bottom = new Element('div', {
            'class': 'jarves-widget-bottom'
        }).inject(this.main);

    },

    getValue: function () {

        var size = this.main.getSize();
        this.opts.width = size.x;
        this.opts.height = size.y;

        var pos = this.main.getPosition($('desktop'));
        this.opts.left = pos.x;
        this.opts.top = pos.y;

        return this.opts;
    },

    setPosition: function () {
        this.main.setStyle('position', 'absolute');
        //set x y
        return this;
    },

    load: function () {

        if (this.opts.type == 'custom') {

            this.className = this.opts.extension + '_' + this.opts.code; //code is the hash index of "widgets"

            if (this.opts['class']) {
                this.className = this.opts['class'];
            }

            if (window[this.className]) {
                //new blabla
                this.obj = new window[this.className];
            }
        } else {

            this.content.empty();
            var columns = [];
            this.opts.columns.each(function (col) {
                columns.include([ _(col[0]), col[1], col[2] ]);
            });

            this.table = new jarves.Table(columns).inject(this.content);
            this.table.safe = true;

            this.go2Page(1);

        }

        if (!this.opts.desktop) {
            this.initNoneDesktop();
        } else {
            this.initDesktop();
        }

    },

    initDesktop: function () {

        this.main.setStyle('position', 'absolute');

        new Element('a', {
            'class': 'jarves-widget-knoptodesktop',
            'text': 'x',
            style: 'font-weight: bold;',
            title: _('Remove this widget')
        }).addEvent('click', function () {
                this.fireEvent('close');
            }.bind(this)).inject(this.main);

        this.main.set('tween', {transition: Fx.Transitions.Cubic.easeOut});
        this.main.tween('opacity', 0.7);

        this.main.addEvent('mouseover', function () {
            this.tween('opacity', 1);
        });

        this.main.addEvent('mouseout', function () {
            this.tween('opacity', 0.7);
        });

        var width = this.opts.defaultWidth ? this.opts.defaultWidth : 400;
        var height = this.opts.defaultHeight ? this.opts.defaultHeight : 150;

        if (this.opts.width) {
            width = this.opts.width;
        }
        if (this.opts.height) {
            height = this.opts.height;
        }

        this.main.setStyle('height', height);
        this.main.setStyle('width', width);

        var ptop = 50; //todo calculate free space
        var left = 50; //todo calculate free space

        if (typeOf(this.opts.left) == 'number') {
            left = this.opts.left;
        }

        if (typeOf(this.opts.top) == 'number') {
            ptop = this.opts.top;
        }

        var desktopSize = $('desktop').getSize();
        if ((left + width) > desktopSize.x) {
            left = desktopSize.x - width;
        }

        if ((ptop + height) > desktopSize.y) {
            ptop = desktopSize.y - height;
        }

        left = (left < 0 ) ? 20 : left;
        ptop = (ptop < 0 ) ? 20 : ptop;

        this.main.setStyle('left', left);
        this.main.setStyle('top', ptop);

        this.main.makeDraggable({
            handle: [this.title],
            //presentDefault: true,
            //stopPropagation: true,
            container: $('desktop'),
            onComplete: function () {
                this.fireEvent('change');
            }.bind(this)
        });

        //make resizeable

        this.resizeBottomRight = new Element('div', {
            styles: {
                position: 'absolute',
                right: -1,
                bottom: -1,
                width: 13,
                height: 13,
                cursor: 'se-resize'
            }
        }).inject(this.main);

        var minWidth = ( this.opts.minWidth > 0 ) ? this.opts.minWidth : 200;
        var minHeight = ( this.opts.minHeight > 0 ) ? this.opts.minHeight : 100;

        this.main.makeResizable({
            grid: 1,
            limit: {x: [minWidth, 2000], y: [minHeight, 2000]},
            handle: this.resizeBottomRight,
            onComplete: function () {
                this.fireEvent('change');
            }.bind(this)
        });

    },

    initNoneDesktop: function () {

        new Element('img', {
            'class': 'jarves-widget-knoptodesktop',
            'src': _path + 'bundles/jarves/admin/images/win-top-bar-link.png',
            title: _('Display this widget at desktop')
        }).addEvent('click', function () {
                jarves.desktop.addWidget(this.opts);
            }.bind(this)).inject(this.main);

    },

    renderCtrls: function () {
        this.ctrlPrevious.setStyle('opacity', 1);
        this.ctrlNext.setStyle('opacity', 1);

        if (this.currentPage == 1) {
            this.ctrlPrevious.setStyle('opacity', 0.3);
        }

        if (this.currentPage == this.maxPages) {
            this.ctrlNext.setStyle('opacity', 0.3);
        }

    },

    go2Page: function (pPage) {

        if (pPage > this.maxPages) {
            return;
        }

        if (pPage <= 0) {
            return;
        }

        if (this.lastrq) {
            this.lastrq.cancel();
        }
        this.table.loading(true);

        if (this.opts.url) {
            url = _path + this.opts.url;
        } else {
            url = _pathAdmin + 'admin/widgets/getPage';
        }

        this.lastrq = new Request.JSON({url: url, noCache: 1, onComplete: function (pRes) {

            this.currentPage = pPage;
            if (pRes.maxPages) {
                this.maxPages = pRes.maxPages;
            }
            this.renderCtrls();

            this.ctrlText.set('text', this.currentPage);

            if (pRes.title && pRes.title != "" && pRes.title != this.title.get('html')) {
                this.title.set('html', pRes.title);
            }

            this.table.loading(false);
            this.table.setValues(pRes.items);

            if (this.lastDelayId) {
                clearTimeout(this.lastDelayId);
            }
            if (this.closed) {
                return;
            }

            this.lastDelayId = this.reload.delay(this.opts.refresh, this);

        }.bind(this)}).post({page: pPage, extension: this.opts.extension, widget: this.opts.code});

    },

    reload: function () {
        if (this.opts.type == 'custom') {
            this.obj.reload();
        } else {
            this.go2Page(this.currentPage);
        }
    }





});