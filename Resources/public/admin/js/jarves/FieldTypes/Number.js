jarves.FieldTypes.Number = new Class({

    Extends: jarves.FieldTypes.Text,

    Statics: {
        asModel: true
    },

    createLayout: function () {
        this.parent();

        this.input.type = 'number';

        this.input.addEvent('keyup', function () {
            this.value = this.value.replace(/[^0-9\-,\.]/g, '');
        });

    },

    getValue: function () {
        if (this.input.value === '') {
            return '';
        }
        return parseFloat(this.input.value);
    }
});