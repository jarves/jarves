jarves.LabelTypes.Datetime = new Class({
    Extends: jarves.LabelTypes.AbstractLabelType,

    render: function(values) {
        var value = values[this.fieldId] || '';
        if (value != 0 && value) {
            var format = ( !this.definition.format ) ? '%d.%m.%Y %H:%M' : this.definition.format;
            return new Date(value * 1000).format(format);
        }

        return '';
    }
});