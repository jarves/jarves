jarves.FieldTypes.Group = new Class({

    Extends: jarves.FieldAbstract,

    createLayout: function () {
        if (this.fieldInstance.title) {
            this.fieldInstance.title.addClass('jarves-Field-group-title');
        }

        this.fieldInstance.childContainer = new Element('div', {
            'class': 'jarves-Field-group'
        }).inject(this.fieldInstance.toElement());
    }
});