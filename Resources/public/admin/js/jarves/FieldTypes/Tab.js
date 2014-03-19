jarves.FieldTypes.Tab = new Class({
    Extends: jarves.FieldAbstract,

    Statics: {
        options: {
            fullPage: {
                label: t('Full page'),
                type: 'checkbox'
            }
        }
    },

    options: {
        fullPage: false
    },

    createLayout: function () {
        //this.tab = new jarves.TabPane(this.fieldInstance.fieldPanel, this.options.fullPage);

        //FieldForm does the magic already.
        //Maybe we should move that part into this.
    }

});