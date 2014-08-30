jarves.LabelTypes.Text = new Class({
    Extends: jarves.AbstractFieldType,

    render: function(values) {
        var value = values[this.fieldId] || '';

//        var clazz = this.originField.type.charAt(0).toUpperCase() + this.originField.type.slice(1);
//        if ('Text' !== clazz && jarves.LabelTypes[clazz]) {
//            var obj = new jarves.LabelTypes[clazz](this.originField, this.definition, this.fieldId, this.objectKey);
//            return obj.render(values);
//        }

        return jarves.htmlEntities(value);
    }
});