jarves.Directives.WindowFrame = new Class({
    Extends: jarves.Directives.AbstractDirective,
    JarvesDirective: {
        name: 'windowFrame',
        options: {
            restrict: 'E',
            require: '^jarvesWindow',
            /**
             * @param $scope
             * @param $element
             * @param $attributes
             * @param {jarves.Controller.WindowController} controller
             */
            link: function($scope, $element, $attributes, controller) {
                controller.setFrame($element);
            }
        }
    }
});