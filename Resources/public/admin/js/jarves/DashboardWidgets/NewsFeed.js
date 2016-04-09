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

jarves.DashboardWidgets.NewsFeed = new Class({
    Extends: jarves.DashboardWidgets.Base,

    streamPath: 'jarves/newsFeed',

    firstLoad: true,
    loadedItems: false,
    size: 'full',

    create: function () {
        this.header = new Element('h3', {
            text: jarves.tc('dashboardWidget.newsFeed', 'News Feed')
        })
            .inject(this.main);

        this.container = new Element('div', {
            style: ''
        }).inject(this.main);

        jarves.setStreamParam('newsFeed/lastTime', null);
    },

    update: function (value) {
        if (value && value.items && value.items.length) {
            if (!this.loadedItems) {
                this.container.empty();
            }
            this.loadedItems = true;
            Array.each(value.items, function(item, idx) {
                this.addNewsFeed(item);
            }.bind(this));
        } else {
            if (!this.loadedItems && this.firstLoad) {
                this.firstLoad = false;
                new Element('div', {
                    'style': 'text-align: center; padding: 15px;',
                    text: t('No news yet')
                }).inject(this.container);
            }
        }

        jarves.setStreamParam('newsFeed/lastTime', value.time);
    },

    addNewsFeed: function(item) {
        var div = new Element('div', {
            'class': 'jarves-Dashboard-newsFeed-item'
        });

        new Element('a', {
            'class': 'jarves-Dashboard-newsFeed-item-user',
            text: item.username
        }).inject(div);

        new Element('span', {
            'class': 'jarves-Dashboard-newsFeed-item-verb',
            text: item.verb
        }).inject(div);

        if (item.targetObject) {
            var objectDefinition = jarves.getObjectDefinition(item.targetObject);
            if (objectDefinition) {
                var objectLabel = objectDefinition.label || item.targetObject;
                new Element('a', {
                    'class': 'jarves-Dashboard-newsFeed-item-object-label',
                    text: objectLabel
                }).inject(div);
            }
        }

        new Element('a', {
            'class': 'jarves-Dashboard-newsFeed-item-label',
            text: item.targetLabel
        }).inject(div);

        new Element('div', {
            'class': 'jarves-Dashboard-newsFeed-item-date',
            text: new Date(item.created*1000).format('%B %e at %H:%M')
        }).inject(div);

        if (item.message) {
            new Element('div', {
                'style': 'padding: 5px;',
                'class': 'jarves-Dashboard-newsFeed-item-message',
                html: item.message
            }).inject(div);
        }
        div.inject(this.container);
    }
});