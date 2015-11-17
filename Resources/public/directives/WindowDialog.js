import {Directive} from '../angular.ts';

@Directive('windowDialog', {
    restrict: 'E',
    require: '^jarvesWindow',
    transclude: true,
    scope: true,
    template: '<div class="jarves-WindowDialog-overlay"></div><div class="jarves-WindowDialog-container"></div>'
})
export default class WindowDialog {

    constructor($scope) {
        this.isOpen = false;
        $scope.windowDialog = this;
    }

    link(scope, element, attributes, windowController, transclude) {
        if (attributes.show) {
            scope.$parent.$watch(attributes.show, (shouldOpen) => {
                if (shouldOpen)  {
                    this.open();
                } else {
                    this.close();
                }
            });
        }

        transclude(scope, (clone) => {
            angular.element(element.contents()[1]).append(clone);
        });

        this.element = element;
        this.dialogContainer = windowController.getDialogContainer();
        this.element.detach();
    }

    open(){ 
        if (!this.element.parent().length) {
            this.dialogContainer.append(this.element);
            this.isOpen = true; 
        }
    }

    close() {
        if (this.element.parent().length) {
            this.isOpen = false;
            this.element.detach();
        }
    }

}