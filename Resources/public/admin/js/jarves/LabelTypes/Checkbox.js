jarves.LabelTypes.Checkbox = new Class({
    Extends: jarves.LabelTypes.AbstractLabelType,

    render: function(values) {
        var value = values[this.fieldId] || '';
        var clazz = value ? 'icon-checkmark-2' : 'icon-cross';
        return '<span class="' + clazz + '"></span>';
    }
});