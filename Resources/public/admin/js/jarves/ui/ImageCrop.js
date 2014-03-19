jarves.ui = jarves.ui || {};

jarves.ui.ImageCrop = new Class({

    Implements: [Options],

    options: {
        initRelativeTo: null
    },

    initialize: function(container, options) {
        this.setOptions(options);
        this.container = container;
        this.createLayout();
    },

    toElement: function() {
        return this.main;
    },

    createLayout: function() {
        this.main = Element('div', {
            'class': 'jarves-ui-ImageCrop jarves-Full'
        });

        Array.each(['top', 'right', 'bottom', 'left'], function(direction) {
            var name = 'overlay' + direction.ucfirst();
            this[name] = new Element('div', {
                'class': 'jarves-ui-ImageCrop-overlay jarves-ui-ImageCrop-' + name,
                styles: {
                    opacity: 0.9
                }
            }).inject(this.main);
        }.bind(this));

        this.win = new Element('div', {
            'class': 'jarves-ui-ImageCrop-window',
            styles: {
                height: '200px',
                width: '200px'
            }
        }).inject(this.main);
        this.main.inject(this.container);

        this.win.position({
            relativeTo: this.options.initRelativeTo || this.main
        });

        this.setupSizer();

        this.mover = new Drag.Move(this.win, {
            container: this.main,
            onStart: function() {
                this.canvasSize = this.main.getSize();
            }.bind(this),
            onDrag: this.updateOverlay.bind(this)
        });

        this.updateOverlay();
    },

    setupSizer: function() {
        this.sizer = {};

        ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw'].each(function(item) {
            this.sizer[item] = new Element('div', {
                'class': 'jarves-ui-ImageCrop-sizer jarves-ui-ImageCrop-sizer-' + item
            }).inject(this.win);
        }.bind(this));

        this.win.dragX = 0;
        this.win.dragY = 0;

        var canvasSize = this.canvasSize || this.main.getScrollSize();

        var minWidth = 50;
        var minHeight = 50;

        Object.each(this.sizer, function(item, key) {
            var height, width, x, y, newHeight, newWidth, newY, newX, max;

            var options = {
                handle: item,
                style: false,
                preventDefault: true,
                stopPropagation: true,
                modifiers: {
                    x: !['s', 'n'].contains(key) ? 'dragX' : null,
                    y: !['e', 'w'].contains(key) ? 'dragY' : null
                },
                snap: 0,
                onBeforeStart: function(pElement) {
                    pElement.dragX = 0;
                    pElement.dragY = 0;
                    height = pElement.getStyle('height').toInt();
                    width = pElement.getStyle('width').toInt();
                    y = pElement.getStyle('top').toInt();
                    x = pElement.getStyle('left').toInt();

                    newWidth = newHeight = newY = newX = null;

                    max = canvasSize;
                },
                onDrag: function(pElement, pEvent) {
                    if (key === 'n' || key == 'ne' || key == 'nw') {
                        newHeight = height - pElement.dragY;
                        newY = y + pElement.dragY;
                    }

                    if (key === 's' || key == 'se' || key == 'sw') {
                        newHeight = height + pElement.dragY;
                    }

                    if (key === 'e' || key == 'se' || key == 'ne') {
                        newWidth = width + pElement.dragX;
                    }

                    if (key === 'w' || key == 'sw' || key == 'nw') {
                        newWidth = width - pElement.dragX;
                        newX = x + pElement.dragX;
                    }

                    if (newWidth !== null && newWidth < minWidth) {
                        newWidth = newX = null;
                    }

                    if (newX !== null && newX < 0) {
                        newX = 0;
                    }
                    if (newY !== null && newY < 0){
                        newY = 0;
                    }

                    if (newWidth !== null && newWidth+(null !== newX ? newX : 0 || x) > max.x) {
                        newWidth = max.x - (null !== newX ? newX : 0 || x);
                    }

                    if (newHeight !== null && newHeight < minHeight) {
                        newHeight = newY = null;
                    }

                    if (newHeight !== null && newHeight+(null !== newY ? newY : 0 || y) > max.y) {
                        newHeight = max.y - (null !== newY ? newY : 0 || y);
                    }

                    if (newX !== null && newX >= 0) {
                        pElement.setStyle('left', newX);
                    }

                    if (newY !== null && newY >= 0) {
                        pElement.setStyle('top', newY);
                    }

                    if (newWidth !== null) {
                        pElement.setStyle('width', newWidth);
                    }

                    if (newHeight !== null) {
                        pElement.setStyle('height', newHeight);
                    }

                    if (newWidth !== null || newHeight !== null || newX !== null || newY !== null) {
                        this.updateOverlay();
                    }
                }.bind(this)
            };

            new Drag(this.win, options);
        }.bind(this));
    },

    updateOverlay: function() {
        var coordinates = this.win.getCoordinates(this.main);
        var canvasSize = this.canvasSize || (this.canvasSize = this.main.getScrollSize());

        this.overlayTop.setStyle('height', coordinates.top > 0 ? coordinates.top : 0);
        this.overlayBottom.setStyle(
            'height',
            canvasSize.y - coordinates.bottom > 0 ? canvasSize.y - coordinates.bottom : 0
        );

        this.overlayLeft.setStyles({
            width: coordinates.left > 0 ? coordinates.left : 0,
            top: coordinates.top,
            bottom: canvasSize.y - coordinates.bottom
        });
        this.overlayRight.setStyles({
            width: canvasSize.x - coordinates.right > 0 ? canvasSize.x - coordinates.right : 0,
            top: coordinates.top,
            bottom: canvasSize.y - coordinates.bottom
        });
    },

    destroy: function(){
        this.main.destroy();
    },

    getSelection: function() {
        var size = this.win.getSize();
        var pos  = this.win.getPosition(this.main);
        return {
            width: size.x,
            height: size.y,
            left: pos.x,
            top: pos.y
        };
    }
});