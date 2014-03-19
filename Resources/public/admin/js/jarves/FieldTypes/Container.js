jarves.FieldTypes.Container = new Class({
    Extends: jarves.FieldAbstract,

    createLayout: function (container) {
        //deactivate auto-hiding of the childrenContainer.
        this.fieldInstance.handleChildsMySelf = true;

        this.fieldInstance.prepareChildContainer = function() {
            this.fieldInstance.childContainer = new Element('div', {
                'class': 'jarves-field-container'
            }).inject(container);
        }.bind(this);
    }
});