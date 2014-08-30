jarves.LabelTypes.Checkbox = new Class({
    Extends: jarves.AbstractFieldType,

    render: function(values) {
        var value = values[this.fieldId] || '';
        var clazz = value ? 'icon-checkmark-2' : 'icon-cross';
        return '<span class="' + clazz + '"></span>';
    }
});