import {Directive, Inject} from '../angular.ts';

@Directive('jarvesTabs', {
    restrict: 'E',
    scope: true
})
@Inject('$scope, $compile')
export default class JarvesTabs {

    constructor($scope, $compile) {
        this.$scope = $scope;
        this.$compile = $compile;
        this.$scope.jarvesTabsController = this;
        this.selected = 0;
    }
	
	link(scope, element, attributes) {
        this.buttons = angular.element('<button-group></button-group>');
        element.append(this.buttons);
        this.panes = angular.element('<div class="jarves-Tabs-panes"></div>');
        element.append(this.panes);

        if ('fullsize' === attributes) {
            element.addClass('jarves-Tabs-fullsize');
        }
    }

    addTab(label, transclude) {
        var scope = this.$scope.$new();
        scope.buttonLabel = label;
        scope.tabId = this.panes.children().length;

        var button = angular.element('<button pressed="jarvesTabsController.selected == tabId" ng-click="jarvesTabsController.selected = tabId">{{buttonLabel}}</button>');
        this.buttons.append(button);

        var pane = angular.element('<div class="jarvesTabs-pane" ng-class="{\'visible\': jarvesTabsController.selected == tabId}"></div>');
        this.panes.append(pane);

        this.$compile(button)(scope);
        this.$compile(pane)(scope);

        this.transcluded = transclude(scope, (clone) => {
            pane.append(clone);
        });
    }

}