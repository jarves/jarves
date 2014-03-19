jarves.System = new Class({
    Implements: [Events],

    items: {},

    initialize: function(pContainer, pMenuItems) {
        this.container = pContainer;
        this.menuItems = pMenuItems;
        this.createLayout();
    },

    createLayout: function() {
        new Element('h1', {
            text: t('System')
        }).inject(this.container);

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
            var systemEntryPoints = this.collectSystemEntryPoints(config.entryPoints);
            if (0 < Object.getLength(systemEntryPoints)) {

                container = new Element('div', {
                    'class': 'jarves-system-cat'
                }).inject(this.container);

//                if ('JarvesBundle' !== bundleName) {
                    new Element('h2', {
                        'class': 'light',
                        text: config.label || config.name
                    }).inject(container);
//                }

                Object.each(systemEntryPoints, function(entryPoint) {
                    if (!entryPoint.type) {
                        subContainer = new Element('div', {
                            'class': 'jarves-system-cat'
                        }).inject(this.container);

                        new Element('h2', {
                            'class': 'light',
                            text: entryPoint.label
                        }).inject(subContainer);

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
            'class': 'jarves-system-settings-link',
            text: entryPoint.label
        })
            .addEvent('click', function() {
                this.fireEvent('click', entryPoint)
                jarves.wm.open(bundleName + '/' + entryPoint.fullPath);
            }.bind(this))
            .inject(container);

        if (entryPoint.icon) {
            var span = new Element('span', {
                'class': entryPoint.icon.indexOf('#') === 0 ?  entryPoint.icon.substr(1) : null
            }).inject(item, 'top');

            if (-1 === entryPoint.icon.indexOf('#')) {
                new Element('img', {
                    src: jarves.mediaPath(entryPoint.icon)
                }).inject(span);
            }
        }

        this.items[fullPath] = item;
    },

    collectSystemEntryPoints: function(entryPoints) {
        var result = {};

        Object.each(entryPoints, function(entryPoint, key) {
            if (entryPoint.children) {
                result = Object.merge(result, this.collectSystemEntryPoints(entryPoint.children));
            }

            if (!entryPoint.link) return;

            if (entryPoint.system) {
                result[key] = entryPoint;
            }

        }, this);

        return result
    }
});