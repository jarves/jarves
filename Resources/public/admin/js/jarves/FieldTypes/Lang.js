jarves.FieldTypes.Lang = new Class({

    Extends: jarves.FieldTypes.Select,

    Statics: {
        asModel: true
    },

    initialize: function (fieldInstance, options) {
        options.object = 'jarves/language';
        this.parent(fieldInstance, options);

        var hasSessionLang = false;
        Object.each(jarves.settings.langs, function (lang, id) {

            if (id == window._session.lang) {
                hasSessionLang = true;
            }

        }.bind(this));

        if (hasSessionLang) {
            this.select.setValue(window._session.lang);
        }
    }

});