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

jarves.MainMenu = new Class({
    Implements: [Events],

    items: {},

    initialize: function(container, validMenuItems) {
        this.container = container;
        this.menuItems = validMenuItems;
        this.createLayout();
    },

    entryPoints: {},

    setupEntryPoints: function(bundleConfig, key) {
        if (bundleConfig.entryPoints) {
            this.entryPoints[key] = Object.clone(bundleConfig.entryPoints);
            this.clearEntryPoints(this.entryPoints[key]);
        }
    },

    /**
     * Clears entryPoints, so it only contains entry points that appear in this.menuItems
     *
     * @param entryPoints
     */
    clearEntryPoints: function(entryPoints) {
        Object.each(entryPoints, function(entryPoint, key) {
            if (entryPoint.children) {
                this.clearEntryPoints(entryPoint.children);
            }

            if (entryPoint.children && Object.getLength(entryPoint.children) > 0) {
                //we have valid children, so let it in, but dont show it later due to link=false
            } else {
                //no active children
                if (!this.menuItems[entryPoint.fullPath]) {
                    delete entryPoints[key];
                }
            }
        }.bind(this));
    },

    createLayout: function() {
        Object.each(jarves.settings.configs, function(config, key) {
            this.setupEntryPoints(config, key);
        }.bind(this));

        this.addBundleMenus('JarvesBundle');

        Object.each(jarves.settings.configs, function(config, key) {
            if ('JarvesBundle' !== key && this.entryPoints[key]) {
                this.addBundleMenus(key);
            }
        }, this);
    },

    addBundleMenus: function(bundleName) {
        if (!this.entryPoints[bundleName]) {
            return;
        }

        var container = new Element('div', {
            'class': 'jarves-mainMenu-cat jarves-mainMenu-cat-level-0'
        }).inject(this.container);

        var bundleConfig = jarves.getConfig(bundleName);

        new Element('h2', {
            text: bundleConfig.label || bundleConfig.name
        }).inject(container);

        this.prepareCat(container);

        this.addMenus(this.entryPoints[bundleName], container);
    },

    addMenus: function(entryPoints, container) {
        Object.each(entryPoints, function(entryPoint) {

            var linkContainer = container;

            if (entryPoint.link) {
                if (entryPoint.type) {
                    //render normal link
                    this.addLink(entryPoint, container);

                } else if (!entryPoint.type && entryPoint.children && Object.getLength(entryPoint.children)) {
                    //it has children, but is hasn a type, so its a header
                    linkContainer = new Element('div', {
                        'class': 'jarves-mainMenu-cat jarves-mainMenu-cat-level-' + (entryPoint.fullPath.match(/\//g) || []).length
                    }).inject(linkContainer);

                    new Element('h2', {
                        text: entryPoint.label || entryPoint.path
                    }).inject(linkContainer);
                    this.prepareCat(linkContainer);

                    // this.addMenus(entryPoints.children, linkContainer);
                }
            }

            // if (entryPoint.children){
            //     console.log(Object.getLength(entryPoint.children));
            // }
            if (entryPoint.children && Object.getLength(entryPoint.children)) {
                // console.log(entryPoint.fullPath, entryPoint.children, linkContainer);
                this.addMenus(entryPoint.children, linkContainer);
            }

        }.bind(this));
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

    prepareCat: function(cat) {

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

    addLink: function(entryPoint, container) {
        var fullPath = entryPoint.fullPath;
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
                this.fireEvent('click', entryPoint);
                jarves.wm.open(entryPoint.fullPath);
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

            result[key] = entryPoint;

        }, this);

        return result
    }
});