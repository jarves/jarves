jarves.FieldTypes.Predefined = new Class({
    Extends: jarves.FieldAbstract,

    Statics: {
        options: {
            object: {
                label: t('Object key'),
                type: 'objectKey',
                required: true
            },
            field: {
                label: t('Field key'),
                type: 'text',
                required: true
            }
        }
    },

    createLayout: function () {
        //jarves.Field makes the magic
    }

});