jarves.FieldTypes.Checkbox = new Class({

    Extends: jarves.FieldAbstract,

    Statics: {
        asModel: true
    },

    createLayout: function () {
        this.checkbox = new jarves.Checkbox(this.fieldInstance.fieldPanel);

        this.checkbox.addEvent('change', this.fireChange);
    },

    setValue: function (pValue) {
        this.checkbox.setValue(pValue);
    },

    getValue: function () {
        return this.checkbox.getValue();
    }
});