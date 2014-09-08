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

    initInspector: function(inspectorContainer) {
        this.input = new jarves.Field({
            type: 'textarea',
            inputHeight: 'auto',
            label: 'Markdown',
            onChange: function(value) {
                this.value = value;
                this.fireChange();
            }.bind(this)
        }, inspectorContainer);
    },

    setValue: function(value) {
        this.value = value;
        if (this.input) {
            this.input.setValue(value);
        }
    },

    openInspectorOnAdd: function() {
        return true;
    },

    getValue: function() {
        return this.value;
    }
});
