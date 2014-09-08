jarves.Directives.WindowSidebar = new Class({
    Extends: jarves.Directives.AbstractDirective,
    JarvesDirective: {
        name: 'windowSidebar',
        options: {
            restrict: 'E',
            priority: -1,
            require: '^jarvesWindow',
            transclude: true,
            scope: {
                label: '='
            },
            template: '<window-sidebar-container><div class="jarves-Window-sidebar-title">{{label}}</div><div ng-transclude></div></window-sidebar-container>',
            /**
             * @param $scope
             * @param $element
             * @param $attributes
             * @param {jarves.Controller.WindowController} controller
             */
            link: function($scope, $element, $attributes, controller) {
                controller.setSidebar($element);
            }
        }
    }
});