jarves.FieldTypes.ContentElements = new Class({

    Extends: jarves.FieldAbstract,

    Statics: {
        asModel: true
    },

    createLayout: function() {
        this.main = new Element('div', {
            'text': 'Todo'
        }).inject(this.getParentInstance());
    },

    setValue: function(value) {
        this.main.set('text', 'Todo: '+JSON.encode(value));
    }
});