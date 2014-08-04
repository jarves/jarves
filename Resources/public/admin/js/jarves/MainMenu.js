jarves.MainMenu = new Class({
    Implements: [Events],

    items: {},

    initialize: function(container, validMenuItems) {
        this.container = container;
        this.menuItems = validMenuItems;
        this.createLayout();
    },

    createLayout: function() {
        this.addSection('JarvesBundle');
        Object.each(jarves.settings.configs, function(config, key) {
            if ('JarvesBundle' !== key) {
                this.addSection(key);
            }
        }, this);
    },

    addSection: function(bundleName) {
        var config = jarves.getConfig(bundleName);
        bundleName = jarves.getShortBundleName(bundleName);
        var container, subContainer;

        if (config.entryPoints) {
            var systemEntryPoints = this.collectEntryPoints(config.entryPoints);
            if (0 < Object.getLength(systemEntryPoints)) {

                container = new Element('div', {
                    'class': 'jarves-mainMenu-cat'
                }).inject(this.container);


//                if ('JarvesBundle' !== bundleName) {
                    new Element('h2', {
                        text: config.label || config.name
                    }).inject(container);
//                }
                this.prepareCat(container, bundleName);

                Object.each(systemEntryPoints, function(entryPoint) {
                    if (!entryPoint.type) {
                        subContainer = new Element('div', {
                            'class': 'jarves-mainMenu-cat'
                        }).inject(this.container);

                        new Element('h2', {
                            text: entryPoint.label
                        }).inject(subContainer);
                        this.prepareCat(subContainer);

                        Object.each(entryPoint.children, function(subEntryPoint) {
                            this.addLink(bundleName, subEntryPoint, subContainer);
                        }, this);

                    } else {
                        this.addLink(bundleName, entryPoint, container);
                    }
                }, this);
            }
        }
    },

    prepareCat: function(cat, bundleName) {

        var toggle = new Element('span', {
            'class': 'jarves-mainMenu-cat-toggle icon-arrow-down-3',
            title: t('Hide')
        }).inject(cat);

        cat.getElement('h2').addEvent('click', function() {
            if (cat.hasClass('jarves-mainMenu-cat-hidden')) {
                //show it
                cat.removeClass('jarves-mainMenu-cat-hidden');
                toggle.addClass('icon-arrow-down-3');
                toggle.removeClass('icon-arrow-left-3');
                toggle.set('title', t('Hide'));
            } else {
                cat.addClass('jarves-mainMenu-cat-hidden');
                toggle.removeClass('icon-arrow-down-3');
                toggle.addClass('icon-arrow-left-3');
                toggle.set('title', t('Show'));
            }
        });

    },

    addLink: function(bundleName, entryPoint, container) {
        var fullPath = bundleName + '/' + entryPoint.fullPath;
        if (this.items[fullPath]) {
            this.items[fullPath].destroy();
            delete this.items[fullPath];
        }
        if (!this.menuItems[fullPath]) {
            return;
        }

        var item = new Element('a', {
            'class': 'jarves-mainMenu-link ' + (entryPoint.icon && entryPoint.icon.indexOf('#') === 0 ?  entryPoint.icon.substr(1) : ''),
            text: entryPoint.label
        })
            .addEvent('click', function() {
                this.fireEvent('click', entryPoint)
                jarves.wm.open(bundleName + '/' + entryPoint.fullPath);
            }.bind(this))
            .inject(container);

        if (entryPoint.icon) {
            if (-1 === entryPoint.icon.indexOf('#')) {
                new Element('img', {
                    src: jarves.mediaPath(entryPoint.icon)
                }).inject(item, top);
            }
        }

        this.items[fullPath] = item;
    },

    collectEntryPoints: function(entryPoints) {
        var result = {};

        Object.each(entryPoints, function(entryPoint, key) {
            if (entryPoint.children) {
                result = Object.merge(result, this.collectEntryPoints(entryPoint.children));
            }

            if (!entryPoint.link) return;

//            if (entryPoint.system) {
                result[key] = entryPoint;
//            }

        }, this);

        return result
    }
});