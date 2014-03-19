jarves.TabGroup = new Class({
    Implements: [Events],

    'className': 'jarves-tabGroup',

    initialize: function (pParent) {
        this.box = new Element('div', {
            'class': this.className
        }).inject(pParent);

        this.addEvent('addButton', this.checkButtons.bind(this));
    },

    checkButtons: function() {

    },

    toElement: function () {
        return this.box;
    },

    destroy: function () {
        this.box.destroy();
    },

    inject: function (pTo, pWhere) {
        this.box.inject(pTo, pWhere);
    },

    hide: function () {
        this.box.setStyle('display', 'none');
    },

    show: function () {
        this.box.setStyle('display', 'inline');
    },

    rerender: function (pFirst) {

        var items = this.box.getElements('a');

        items.removeClass('jarves-tabGroup-item-first');
        items.removeClass('jarves-tabGroup-item-last');

        if (items.length > 0) {

            var lastItem, firstItem;
            Array.each(items, function (item) {
                if (item.getStyle('display') != 'none') {
                    if (!firstItem) {
                        firstItem = item;
                    }
                    lastItem = item;
                }
            });

            if (firstItem) {
                firstItem.addClass('jarves-tabGroup-item-first');
            }

            if (lastItem) {
                lastItem.addClass('jarves-tabGroup-item-last');
            }
        }

    },

    addButton: function (pTitle, pIcon, pOnClick) {

        var button = new Element('a', {
            'class': 'jarves-tabGroup-item',
            title: pTitle,
            text: pTitle
        }).inject(this.box);

        if (typeOf(pIcon) == 'string' && pIcon) {
            if (pIcon.substr(0, 1) == '#') {
                button.addClass(pIcon.substr(1));
            } else {
                new Element('img', {
                    src: jarves.mediaPath(pIcon),
                    height: 14
                }).inject(button, 'top');
            }
            button.addClass('jarves-tabGroup-item-with-image');
        }

        this.setMethods(button, pOnClick);
        this.fireEvent('addButton');

        return button;

    },

    setPressed: function (pPressed) {

        this.box.getChildren().each(function (button) {
            button.setPressed(pPressed);
        });

    },

    setMethods: function (pButton, pOnClick) {
        if (pOnClick) {
            pButton.addEvent('click', pOnClick);
        }

        pButton.hide = function () {
            if (pButton.isHidden()) return;
            pButton.store('visible', false);
            pButton.setStyle('display', 'none');
            this.rerender();

            if (pButton.tabPane && pButton.isPressed()) {
                var items = this.box.getChildren('a');
                var index = items.indexOf(pButton);
                if (items[index + 1]) {
                    pButton.tabPane.to(index + 1);
                }
                if (items[index - 1]) {
                    pButton.tabPane.to(index - 1);
                }
            }
        }.bind(this);

        pButton.show = function () {
            if (!pButton.isHidden()) return;
            pButton.store('visible', true);
            pButton.setStyle('display');
            this.rerender();
        }.bind(this);

        pButton.isHidden = function () {
            return pButton.getStyle('display') == 'none';
        };

        pButton.startTip = function (pText) {
            if (!this.toolTip) {
                this.toolTip = new jarves.Tooltip(pButton, pText);
            }
            this.toolTip.setText(pText);
            this.toolTip.show();
        }

        pButton.stopTip = function (pText) {
            if (this.toolTip) {
                this.toolTip.stop(pText);
            }
        }

        pButton.setPressed = function (pPressed) {
            if (pPressed) {
                pButton.addClass('jarves-tabGroup-item-active');
                pButton.fireEvent('show');
            } else {
                pButton.removeClass('jarves-tabGroup-item-active');
                pButton.fireEvent('hide');
            }
        }

        pButton.isPressed = function () {
            return pButton.hasClass('jarves-tabGroup-item-active');
        }

        pButton.store('visible', true);
        this.rerender(true);
    }
});
