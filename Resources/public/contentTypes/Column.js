jarves.ContentTypes = jarves.ContentTypes || {};

jarves.ContentTypes.Column = new Class({

    Extends: jarves.ContentAbstract,
    Binds: ['applyValue'],

    Statics: {
        icon: 'icon-columns',
        label: 'Column'
    },

    options: {
        columns: 2,
        gridClassName: 'grid-column-%d',
        additionalLayouts: []
    },

    createLayout: function() {
        this.main = new Element('div', {
            'class': 'jarves-ContentTypes-column'
        }).inject(this.getContentInstance().getContentContainer());

    },

    initInspector: function(inspectorContainer) {
        this.form = new jarves.FieldForm(inspectorContainer, {
            layout: {
                label: t('Layout'),
                type: 'select',
                items: {
                    auto: t('Auto'),
                    '50-50': t('50% / 50%'),
                    '66-33': t('66% / 33%'),
                    '33-66': t('33% / 66%')
                }
            }
        });
    },

    renderValue: function() {
//        this.getContentInstance().getContentContainer().set('html', this.value);
    },

    isPreviewPossible: function() {
        return false;
    },

    setValue: function(value) {

    },

    getValue: function() {
        return this.value;
    }
});
