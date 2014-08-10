jarves.FieldTypes.Language = new Class({

    Extends: jarves.FieldTypes.Select,

    Statics: {
        asModel: true
    },

    initialize: function (fieldInstance, options) {
        var items = {};
        Object.each(jarves.possibleLangs, function(lang) {
            items[lang.code] = lang.title + ' (' + lang.langtitle + ')';
        }.bind(this));

        items['de'] = 'Deutsch';
        options.items = items;
        this.parent(fieldInstance, options);
    }

});