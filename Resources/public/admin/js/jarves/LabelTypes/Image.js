jarves.LabelTypes.Image = new Class({
    Extends: jarves.AbstractFieldType,

    options: {
        width: '100%'
    },

    Statics: {
        options: {
            width: {
                label: t('Width in px'),
                type: 'number',
                desc: t('Default is 100%')
            }
        }
    },

    render: function(values) {
        var value = values[this.fieldId] || '';

        if (!value) {
            return '';
        }

        var width = this.options.width;
        var path = _pathAdmin + 'admin/file/preview?' + Object.toQueryString({
            path: value,
            width: '100%' === width ? null : width
        });
        return '<img src="%s" width="%s" />'.sprintf(path, width);
    }
});