jarves.ContentTypes = jarves.ContentTypes || {};

jarves.ContentTypes.Markdown = new Class({

    Extends: jarves.ContentAbstract,
    Binds: ['applyValue'],

    Statics: {
        icon: 'icon-hash-2',
        label: 'Markdown'
    },

    options: {

    },

    createLayout: function() {
        this.main = new Element('div', {
            'class': 'jarves-normalize jarves-content-markdown'
        }).inject(this.getContentInstance().getContentContainer());

        this.input = new jarves.Field({
            type: 'textarea',
            inputHeight: 'auto',
            noWrapper: true,
            onChange: function(value) {
                this.value = value;
            }.bind(this)
        }, this.main);
    },

    openedInspector: function(inspectorContainer) {
        var toolbarContainer = new Element('div', {
            'class': 'jarves-content-markdown-toolbarContainer'
        }).inject(inspectorContainer);
    },

    setValue: function(pValue) {
        this.value = pValue;
        if (this.input) {
            this.input.setValue(pValue);
        }
    },

    getValue: function() {
        return this.value;
    }
});
