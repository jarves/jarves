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

jarves.Tooltip = new Class({

    direction: false,
    icon: '',
    container: false,
    text: '',
    target: false,

    initialize: function (pTarget, pText, pDirection, pContainer, pIcon) {
        this.target = document.id(pTarget);
        this.text = pText;
        this.icon = pIcon;

        if (!this.icon) {
            this.icon = _path + 'bundles/jarves/admin/images/loading.gif';
        }

        if (pDirection) {
            this.direction = pDirection;
        }

        this.container = pContainer;
        this.start();
    },

    toElement: function () {
        return this.main;
    },

    start: function () {

        var tparent = this.target.getParent('div.jarves-Window-border');

        if (!tparent) {
            if (this.target.hasClass('jarves-Button')) {
                tparent = this.target.getParent();
            } else {
                tparent = this.target.getParent('.jarves-admin');
            }
        }

        if (this.container) {
            tparent = this.container;
        }

        this.container = tparent;

        this.main = new Element('div', {
            'class': 'jarves-tooltip',
            styles: {
                opacity: 0
            }
        });

        this.bg = new Element('div', {
            'class': 'jarves-tooltip-bg',
            styles: {
                opacity: 0.7
            }
        }).inject(this.main).set('tween', {duration: 400});

        this.corner = new Element('div', {
            'class': 'jarves-tooltip-corner' + ((this.direction == false) ? '' : '-' + this.direction)
        }).inject(this.bg);

        this.textDiv = new Element('div', {
            'class': 'jarves-tooltip-text',
            html: this.text
        }).inject(this.main);

        this.createIcon();

        return this;
    },

    createIcon: function () {
        this.loader = new Element('img', {
            'class': 'jarves-tooltip-loader',
            align: 'left',
            src: this.icon
        }).inject(this.textDiv, 'top');
    },

    stop: function (pText) {

        if (this.stopped) {
            return;
        }
        if (pText) {
            this.setText(pText);
            this.destroyTimer = (function () {
                this.hide();
            }.bind(this)).delay(800);
        } else {
            this.hide();
        }
        this.stopped = true;
        return this;
    },

    setText: function (pText) {
        this.text = pText;
        this.textDiv.set('html', pText);
        this.createIcon();
    },

    hide: function () {
        new Fx.Tween(this.main).start('opacity', 0).chain(function () {
            this.main.dispose();
        }.bind(this));
    },

    show: function () {

        this.main.inject(this.container);

        this.stopped = false;
        if (this.destroyTimer) {
            clearTimeout(this.destroyTimer);
            if (this.main) {
                this.main.set('tween', {onComplete: function () {
                }});
            }
        }
        if (!this.main) {
            this.start();
        }
        this.main.tween('opacity', 1);
        this.updatePosition();
        this.blink();
    },

    updatePosition: function () {
        var yOffset = 0;
        var yOffset = this.main.getSize().y;

        if (this.direction == 'top') {
            yOffset = 14 + this.target.getSize().y + 33;
        }

        var position = 'leftTop';
        var edge = 'bottomLeft';
        var offset = {y: -7, x: -3};

        if (this.direction == 'top') {
            position = 'leftBottom';
            edge = 'topLeft';
            offset = {y: 7, x: -3};
        }

        if (this.direction == 'left') {
            position = 'rightCenter';
            edge = 'centerLeft';
            offset = {y: 0, x: 7};
        }

        this.main.position({
            relativeTo: this.target,
            position: position,
            edge: edge,
            offset: offset
            //           edge: 'centerLeft',
            //           offset: {y: yOffset, x:+1 +(this.target.getSize().x/4)-10}
        });
    },

    blink: function () {
        this.bg.tween('opacity', 0.7);
        (function () {
            this.bg.tween('opacity', 1);
        }.bind(this)).delay(400);
        this.blink.delay(1400, this);
    }

});
