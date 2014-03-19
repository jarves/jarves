jarves.Combobox = new Class({

    Extends: jarves.Select,

    createLayout: function () {

        this.parent();

    },

    getValue: function () {
        return this.value || this.input.value;
    }

});