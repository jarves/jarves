jarves.FieldTypes.Layout = new Class({

    Extends: jarves.FieldTypes.Select,

    Statics: {
        label: 'Page Layout',
        asModel: true,
        options: {
            theme: {
                label: 'Theme key',
                type: 'text',
                required: true
            }
        }
    },

    options: {
        theme: null
    },

    createLayout: function () {
        this.parent();

        var defaultKeys = {
            startpage: t('Startpage'),
            default: t('Default'),
            404: t('404 Not Found'),
            accessDenied: t('Access Denied')
        };

        Object.each(jarves.settings.configs, function(config, key) {

            if (config.themes) {
                Object.each(config.themes, function(theme){
                    var layouts = {};
                    if (theme.id !== this.options.theme) {
                        return;
                    }

                    if (theme.layouts) {
                        Array.each(theme.layouts, function(layout){
                            layouts[layout.key] = layout.label || defaultKeys[layout.key] || layout.key;
                        });
                    }

                    if (Object.getLength(layouts) > 0) {
                        this.select.addSplit(theme.label);
                        Object.each(layouts, function(label, id) {
                            this.select.add(id, label);
                        }.bind(this));
                    }
                }.bind(this))
            }
        }.bind(this));

        if (this.select.options.selectFirst) {
            this.select.selectFirst();
        }
    }
});