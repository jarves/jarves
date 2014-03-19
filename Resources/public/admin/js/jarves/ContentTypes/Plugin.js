jarves.ContentTypes = jarves.ContentTypes || {};

jarves.ContentTypes.Plugin = new Class({

    Extends: jarves.ContentAbstract,

    Statics: {
        icon: 'icon-cube-2',
        label: 'Plugin'
    },

    options: {

    },

    createLayout: function () {
        this.main = new Element('div', {
            'class': 'jarves-normalize jarves-content-plugin'
        }).inject(this.getContentInstance().getContentContainer());

        this.iconDiv = new Element('div', {
            'class': 'jarves-content-inner-icon icon-cube-2'
        }).inject(this.main);

        this.inner = new Element('div', {
            'class': 'jarves-content-inner jarves-normalize'
        }).inject(this.main);

    },

    /**
     * since old jarves version stores the value as string
     * we need to convert it to the new object def.
     * @param {String|Object} pValue
     * @return {Object}
     */
    normalizeValue: function (pValue) {
        if (typeOf(pValue) == 'object') {
            return pValue;
        }

        if (typeOf(pValue) == 'string' && JSON.validate(pValue)) {
            return this.normalizeValue(JSON.decode(pValue));
        }
        if (typeOf(pValue) != 'string') {
            return {};
        }

        var bundle = pValue.substr(0, pValue.indexOf('::'));
        var plugin = pValue.substr(bundle.length + 2, pValue.substr(bundle.length + 2).indexOf('::'));
        var options = pValue.substr(bundle.length + plugin.length + 4);

        options = JSON.validate(options) ? JSON.decode(options) : {};

        return this.normalizeValue({
            bundle: bundle,
            plugin: plugin,
            options: options
        });
    },

    renderValue: function () {
        this.inner.empty();

        var bundle = this.value.bundle;
        var plugin = this.value.plugin;
        var options = this.value.options;

        if (jarves.getConfig(bundle) &&jarves.getConfig(bundle).plugins &&
            jarves.getConfig(bundle).plugins[plugin]) {
            var pluginConfig = jarves.getConfig(bundle).plugins[plugin];

            new Element('div', {
                'class': 'jarves-content-inner-title',
                text: jarves.getConfig(bundle).label || jarves.getConfig(bundle).name
            }).inject(this.inner);

            new Element('div', {
                'class': 'jarves-content-inner-subtitle',
                text: pluginConfig.label
            }).inject(this.inner);

        } else {
            if (!jarves.getConfig(bundle)) {
                this.inner.set('text', tf('Bundle `%s` not found', bundle));
            } else if (!jarves.getConfig(bundle).plugins || jarves.getConfig(bundle).plugins[plugin]) {
                this.inner.set('text', tf('Plugin `%s` in bundle `%s` not found', plugin, bundle));
            }
        }

    },

    /**
     * adds/loads all additional fields to the inspector.
     */
    selected: function(inspectorContainer) {
        var toolbarContainer = new Element('div', {
            'class': 'jarves-content-plugin-toolbarContainer'
        }).inject(inspectorContainer);

        this.pluginChoser = new jarves.Field({
            type: 'plugin',
            noWrapper: true
        }, toolbarContainer);

        this.pluginChoser.setValue(this.value);

        this.pluginChoser.addEvent('change', function () {
            this.value = this.pluginChoser.getValue();
            this.value = this.normalizeValue(this.value);

            this.renderValue();
            this.fireEvent('change');
        }.bind(this));
    },

    setValue: function (pValue) {
        if (!pValue) {
            this.value = null;
            return;
        }
        this.value = this.normalizeValue(pValue);
        this.renderValue();
    },

    getValue: function () {
        return typeOf(this.value) == 'string' ? this.value : JSON.encode(this.value);
    }

});
