jarves.Directives.InputText = new Class({
    JarvesDirective: {
        name: 'jarvesText',
        options: {
            restrict: 'A',
            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
                return new jarves.Directives.InputText($scope, $element, $attrs);
            }]
        }
    },
    initialize: function(scope, element, attributes) {
        var allowedTypes = ['text', 'password'];
        if (!attributes.type || -1 !== allowedTypes.indexOf(attributes.type)) {
            element.addClass('jarves-Input-text');
        }
    }
});