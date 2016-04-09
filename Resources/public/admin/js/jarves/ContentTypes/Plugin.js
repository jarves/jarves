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

jarves.ContentTypes = jarves.ContentTypes || {};

jarves.ContentTypes.Plugin = new Class({

    Extends: jarves.ContentAbstract,

    Statics: {
        icon: 'icon-cube-2',
        label: 'Plugin'
    },

    options: {

    },

    createLayout: function() {
        this.main = new Element('div', {
            'class': 'jarves-contentType-plugin'
        }).inject(this.getContentInstance().getContentContainer());

        this.inner = new Element('div', {
            'class': 'jarves-content-inner jarves-normalize',
            text: t('Choose a plugin.')
        }).inject(this.main);
        this.inner.addEvent('click', function(e) {
            e.stop();
            this.getContentInstance().openInspector();
        }.bind(this));
    },

    /**
     * since old jarves version stores the value as string
     * we need to convert it to the new object def.
     * @param {String|Object} value
     * @return {Object}
     */
    normalizeValue: function (value) {
        if (typeOf(value) == 'object') {
            return value;
        }

        if (typeOf(value) == 'string' && JSON.validate(value)) {
            return this.normalizeValue(JSON.decode(value));
        }

        if (typeOf(value) != 'string') {
            return {};
        }

        var bundle = value.substr(0, value.indexOf('::'));
        var plugin = value.substr(bundle.length + 2, value.substr(bundle.length + 2).indexOf('::'));
        var options = value.substr(bundle.length + plugin.length + 4);

        options = JSON.validate(options) ? JSON.decode(options) : {};

        return this.normalizeValue({
            bundle: bundle,
            plugin: plugin,
            options: options
        });
    },

    isPreviewPossible: function() {
        return 'object' === typeOf(this.value) && this.value.bundle && this.value.plugin;
    },

    openInspectorOnAdd: function() {
        return true;
    },

    /**
     * adds/loads all additional fields to the inspector.
     */
    initInspector: function(inspectorContainer) {
        this.pluginChoser = new jarves.Field({
            type: 'plugin',
            noWrapper: true
        }, inspectorContainer);

        this.pluginChoser.setValue(this.value);

        this.pluginChoser.addEvent('change', function () {
            this.value = this.pluginChoser.getValue();
            this.value = this.normalizeValue(this.value);

            this.fireChange();
        }.bind(this));
    },

    setValue: function (value) {
        if (!value) {
            this.value = null;
            return;
        }
        this.value = this.normalizeValue(value);
    },

    getValue: function () {
        return typeOf(this.value) === 'string' ? this.value : JSON.encode(this.value);
    }

});
