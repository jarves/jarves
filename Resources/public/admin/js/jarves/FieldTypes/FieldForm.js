jarves.FieldTypes.FieldForm = new Class({
    Extends: jarves.FieldAbstract,

    Statics: {
        label: 'Field form',
        options: {
            fields: {
                label: 'Fields',
                type: 'fieldTable'
            }
        }
    },

    options: {
        fields: {}
    },

    createLayout: function() {
        if (this.fieldInstance.title && 'td' === this.fieldInstance.title.get('tag')) {
            this.fieldInstance.title.setStyle('display', 'none');
            this.fieldInstance.main.set('colspan', 2);
        }

        this.fieldForm = new jarves.FieldForm(this.fieldInstance.fieldPanel, this.options.fields, this.options);
    },

    show: function() {
        Object.each(this.fieldForm.getFields(), function(field) {
            field.show();
        });
    },

    hide: function() {
        Object.each(this.fieldForm.getFields(), function(field) {
            field.hide();
        });
    },

    setValue: function(value) {
        this.fieldForm.setValue(value);
    },

    getValue: function(value) {
        return this.fieldForm.getValue();
    }

});