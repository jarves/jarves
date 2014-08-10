jarves.Directives.Button = new Class({
    JarvesDirective: {
        name: 'button',
        options: {
            restrict: 'E',
            controller: ['$scope', '$element', '$attrs', '$compile', function($scope, $element, $attrs, $compile) {
                return new jarves.Directives.Button($scope, $element, $attrs, $compile);
            }]
        }
    },

    initialize: function(scope, element, attributes, $compile) {
        element.addClass('jarves-Button');
        if (attributes['pressed']) {
            scope.$watch(attributes['pressed'], function(pressed){
                if (pressed) {
                    element.addClass('jarves-Button-pressed');
                } else {
                    element.removeClass('jarves-Button-pressed');
                }
            });
        }
    }

});