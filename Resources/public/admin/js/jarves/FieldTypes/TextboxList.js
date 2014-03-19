jarves.FieldTypes.TextboxList = new Class({

    Extends: jarves.FieldAbstract,

    Statics: {
        asModel: true,
        options: {
            'doubles': {
                label: t('Allow double entries'),
                type: 'checkbox'
            }
        }
    },

    options: {
        items: false, //array or object
        store: false, //string
        object: false, //for object chooser
        customValue: false //boolean
    },

    createLayout: function () {

        this.select = new jarves.TextboxList(this.fieldInstance.fieldPanel, this.options);

        document.id(this.select).setStyle('width', this.options.inputWidth ?
            this.options.inputWidth : '100%');

        this.select.addEvent('change', this.fieldInstance.fireChange);

    },

    setValue: function (pValue) {
        this.select.setValue(pValue);
    },

    getValue: function () {
        return this.select.getValue();
    }
});