jarves.ContentTypes = jarves.ContentTypes || {};

jarves.ContentTypes.Plugin = new Class({

    Extends: jarves.ContentAbstract,

    Statics: {
        icon: 'icon-cube-2',
        label: 'Plugin'
    },

    options: {

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

    /**
     * adds/loads all additional fields to the inspector.
     */
    initInspector: function(inspectorContainer) {
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
