jarves.ContentTypes = jarves.ContentTypes || {};

jarves.ContentTypes.Html = new Class({

    Extends: jarves.ContentAbstract,
    Binds: ['applyValue'],

    Statics: {
        icon: 'icon-html5',
        label: 'HTML'
    },

    options: {

    },

    createLayout: function() {
    },

    initInspector: function(inspectorContainer) {
        this.oldValue = this.value;
        this.input = new jarves.Field({
            noWrapper: true,
            type: 'codemirror',
            onChange: function(value) {
                this.value = value;
                this.getContentInstance().getContentContainer().set('html', value);
            }.bind(this)
        }, inspectorContainer);

        this.input.setValue(this.value);
    },

    applyInspector: function() {
        this.value = this.previewedValue;
    },

    cancelInspector: function() {
        this.value = this.oldValue;
    },

    setValue: function(value) {
        this.value = value;
        if (this.input) {
            this.input.setValue(value);
        }
    },

    getValue: function() {
        return this.value;
    }
});
