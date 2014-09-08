jarves.LabelTypes.AbstractLabelType = new Class({
    Extends: jarves.AbstractFieldType,

    getModelName: function() {
        return this.getOption('model') || this.$attrs.data + '.' + this.getOption('id');
    },

    getParentModelName: function() {
        return '$parent.' + this.getModelName();
    },

    link: function(scope, element, attributes) {

    }

});