jarves.Loader = new Class({

    Binds: ['initAnimation', 'startAnimation', 'continueAnimation'],
    Implements: [Events, Options],

    options: {
        loader: 'bundles/jarves/admin/images/loader-sprites-18.png',
        spriteWidth: 18,
        absolute: false,
        big: false,
        overlay: false
    },

    src: '',

    index: 0,
    posX: 0,

    initialize: function (pContainer, pOptions) {
        this.setOptions(pOptions);

        if (this.options.big) {
            this.options.loader = 'bundles/jarves/admin/images/loader-sprites-64.png';
            this.options.spriteWidth = 64;
        }

        this.src = _path + this.options.loader;

        if (this.options.absolute) {
            this.main = new Element('div', {
                'class': 'jarves-loader-main-absolute'
            });
        }

        if (this.options.overlay) {
            this.transBg = new Element('div', {
                style: 'position: absolute; left: 0px; right: 0px; top: 0px; bottom: 0px; background-color: #eee;',
                styles: {
                    opacity: 0.8
                }
            }).inject(this.main ? this.main : pContainer);
        }

        this.loadingTable = new Element('table', {
            cellpadding: 0, cellspacing: 0,
            styles: {
                width: '100%', height: '100%'
            }
        }).inject(this.main ? this.main : pContainer);

        var tr = new Element('tr').inject(this.loadingTable);
        this.td = new Element('td', {
            align: 'center',
            valign: 'center',
            width: '100%',
            height: '100%',
            styles: {
                'vertical-align': 'middle',
                'line-height': 1
            }
        }).inject(tr);

        this.loader = new Element('div', {
            style: 'display: inline-block;'
        }).inject(this.td);

        this.assetImage = Asset.image(this.src, {
            onLoad: this.initAnimation
        });

        if (typeOf(pContainer) == 'element') {
            this.inject(pContainer);
        }
    },

    initAnimation: function () {
        this.loader.setStyles({
            width: this.options.spriteWidth,
            height: this.assetImage.height
        });

        this.loader.setStyle('background-image', 'url(' + this.src + ')');

        this.fps = Math.round(100 / 8);
        this.delay = (1 / this.fps);

        this.startAnimation();
    },

    startAnimation: function () {
        this.posX = 0;
        this.index = 0;
        this.continueAnimation();
    },

    getLoader: function () {
        return this.loader;
    },

    continueAnimation: function () {
        if (this.lastAnimationTimer) {
            clearTimeout(this.lastAnimationTimer);
        }
        if (!this.toElement()) {
            return;
        }

        if (this.toElement().getStyle('display') == 'none') {
            return;
        }

        this.posX += this.options.spriteWidth;
        this.index += 1;

        if (this.index >= 8) {
            this.posX = 0;
            this.index = 0;
        }

        this.loader.setStyle('background-position', (-this.posX) + 'px 0');

        this.lastAnimationTimer = this.continueAnimation.delay(this.delay * 1000);
    },

    setStyle: function (p, p2) {
        this.toElement().setStyle(p, p2);
    },

    toElement: function () {
        return this.main ? this.main : this.loadingTable;
    },

    destroy: function () {

        this.hide();

        if (this.toElement()) {
            this.toElement().destroy();
        }
        if (this.transBg) {
            this.transBg.destroy();
        }
    },

    destroyOverlay: function() {
        if (this.transBg) {
            this.transBg.destroy();
        }
        if (this.toElement()) {
            this.toElement().setStyle('pointer-events', 'none');
        }
    },

    inject: function (pTarget, pWhere) {
        this.toElement().inject(pTarget, pWhere);

        if (this.transBg) {
            this.transBg.inject(this.main, 'before');
        }

        return this;
    },

    show: function () {
        this.toElement().setStyle('display', this.toElement().get('tag') == 'table' ? 'table' : 'block');

        if (this.transBg) {
            this.transBg.setStyle('display', 'block');
        }

        this.startAnimation();
        return this;
    },

    hide: function () {
        if (this.lastAnimationTimer) {
            clearTimeout(this.lastAnimationTimer);
        }

        this.toElement().setStyle('display', 'none');

        if (this.transBg) {
            this.transBg.setStyle('display', 'none');
        }

        return this;
    }
});
