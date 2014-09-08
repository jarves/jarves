jarves.Fields.Language = new Class({
    Extends: jarves.Fields.Select,

    JarvesField: 'language',

    setupItems: function() {
        console.log(jarves.possibleLangs);
        var newItems = {};
        Object.each(jarves.possibleLangs, function(item) {
            newItems[item.code] = {label: '%s (%s, %s)'.sprintf(item.title, item.code, item.langtitle)};
        });

        this.items = newItems;
    }
});