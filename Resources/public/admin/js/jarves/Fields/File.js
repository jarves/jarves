jarves.Fields.File = new Class({
    Extends: jarves.AbstractFieldType,

    Statics: {
        $inject: ['$scope', '$element', '$attrs', '$timeout', '$compile', '$http', '$templateCache', '$q', '$interpolate', 'objectRepository', 'jarves']
    },

    JarvesField: 'file',

    template: 'bundles/jarves/admin/js/views/field.file.html',

    path: '',
    value: '',

    link: function(scope, element, attr) {
        this.parent(scope, element, attr);

        this.renderTemplateUrl(
            this.template
        );

        scope.$parent.$watch(this.getModelName(), function(value) {
            this.value = value;
            this.updateSelected();
        }.bind(this));

    },

    openChooser: function() {

    },

    updateSelected: function() {

    },

    save: function() {
        var deferred = this.$q.defer();

        this.$timeout(function() {
            deferred.resolve();
        }, 1000);

        return deferred.promise;
    }
});