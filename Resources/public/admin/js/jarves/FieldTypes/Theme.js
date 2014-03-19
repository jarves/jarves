jarves.FieldTypes.Theme = new Class({

    Extends: jarves.FieldTypes.Select,

    Statics: {
        label: 'Theme',
        asModel: true
    },

    createLayout: function () {
        this.parent();

        Object.each(jarves.settings.configs, function(config, key) {
            if (config.themes) {
                Object.each(config.themes, function(theme){
                    this.select.add(theme.id, theme.label);
                }.bind(this))
            }
        }.bind(this));

        if (this.select.options.selectFirst) {
            this.select.selectFirst();
        }
    }
});