jarves.TabGroup = new Class({
    Implements: [Events],

    'className': 'jarves-tabGroup',

    initialize: function (container) {
        this.box = new Element('div', {
            'class': this.className
        }).inject(container);

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

    rerender: function (first) {

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

    addButton: function (title, onClick, icon) {

        var button = new Element('a', {
            'class': 'jarves-tabGroup-item',
            title: title,
            text: title
        }).inject(this.box);

        if ('function' === typeOf(icon)) {
            var oldOnClick = onClick;
            onClick = icon;
            icon = oldOnClick;
        }

        if ('string' === typeOf(icon) && icon) {
            if (icon.substr(0, 1) == '#') {
                button.addClass(icon.substr(1));
            } else {
                new Element('img', {
                    src: jarves.mediaPath(icon),
                    height: 14
                }).inject(button, 'top');
            }
            button.addClass('jarves-tabGroup-item-with-image');
        }

        this.setMethods(button, onClick);
        this.fireEvent('addButton');

        return button;
    },

    setPressed: function (isPressed) {

        this.box.getChildren().each(function (button) {
            button.setPressed(isPressed);
        });

    },

    setMethods: function (buttonElement, onClick) {
        if (onClick) {
            buttonElement.addEvent('click', onClick);
        }

        buttonElement.hide = function () {
            if (buttonElement.isHidden()) return;
            buttonElement.store('visible', false);
            buttonElement.setStyle('display', 'none');
            this.rerender();

            if (buttonElement.tabPane && buttonElement.isPressed()) {
                var items = this.box.getChildren('a');
                var index = items.indexOf(buttonElement);
                if (items[index + 1]) {
                    buttonElement.tabPane.to(index + 1);
                }
                if (items[index - 1]) {
                    buttonElement.tabPane.to(index - 1);
                }
            }
        }.bind(this);

        buttonElement.show = function () {
            if (!buttonElement.isHidden()) return;
            buttonElement.store('visible', true);
            buttonElement.setStyle('display');
            this.rerender();
        }.bind(this);

        buttonElement.isHidden = function () {
            return buttonElement.getStyle('display') == 'none';
        };

        buttonElement.startTip = function (pText) {
            if (!this.toolTip) {
                this.toolTip = new jarves.Tooltip(buttonElement, pText);
            }
            this.toolTip.setText(pText);
            this.toolTip.show();
        }

        buttonElement.stopTip = function (pText) {
            if (this.toolTip) {
                this.toolTip.stop(pText);
            }
        }

        buttonElement.setPressed = function (pPressed) {
            if (pPressed) {
                buttonElement.addClass('jarves-tabGroup-item-active');
                buttonElement.fireEvent('show');
            } else {
                buttonElement.removeClass('jarves-tabGroup-item-active');
                buttonElement.fireEvent('hide');
            }
        }

        buttonElement.isPressed = function () {
            return buttonElement.hasClass('jarves-tabGroup-item-active');
        }

        buttonElement.store('visible', true);
        this.rerender(true);
    }
});
