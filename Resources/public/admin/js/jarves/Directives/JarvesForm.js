jarves.Directives.JarvesForm = new Class({
    JarvesDirective: {
        name: 'jarvesForm',
        options: {
            restrict: 'E',
            scope: {
                'fields': '=',
                'model': '='
            },
            templateUrl: 'bundles/jarves/admin/js/views/form.html',
            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
                return new jarves.Directives.JarvesForm($scope, $element, $attrs);
            }]
        }
    },

    initialize: function(scope, element, attributes) {

    }
});