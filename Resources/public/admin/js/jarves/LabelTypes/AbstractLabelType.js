jarves.LabelTypes.AbstractLabelType = new Class({
    Extends: jarves.AbstractFieldType,
    interpolate: ['id', 'object', 'type'],

    getModelName: function() {
        return this.$attrs.data + '.' + this.getOption('id');
    },

    getParentModelName: function() {
        return '$parent.' + this.getModelName();
    },

    link: function(scope, element, attributes) {

    }

});