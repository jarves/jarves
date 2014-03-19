jarves.LabelTypes.Date = new Class({
    Extends: jarves.LabelAbstract,

    render: function(values) {
        var value = values[this.fieldId] || '';
        if (value != 0 && value) {
            var format = ( !this.definition.format ) ? '%d.%m.%Y' : this.definition.format;
            return new Date(value * 1000).format(format);
        }

        return '';
    }
});