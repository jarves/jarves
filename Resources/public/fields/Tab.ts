import AbstractFieldType from './AbstractFieldType.ts';
import {Field, InjectAsProperty} from '../angular.ts';
import angular from '../angular.ts';

@Field('Tab', {
    transclude: true
})
export default class Tab extends AbstractFieldType {

    link(scope, element, attributes, controller, transclude) {
        this.baseLink(scope, element, attributes);

        if ('jarves-tabs' !== element.parent().children()[0].tagName.toLowerCase()) {
            //create a new <jarves-tabs> element
            this.jarvesTabsElement = angular.element('<jarves-tabs></jarves-tabs>');
            if (this.getOption('full')) {
                this.jarvesTabsElement.addClass('jarves-Tabs-fullsize');
            }
            element.parent().prepend(this.jarvesTabsElement);
            this.$compile(this.jarvesTabsElement)(scope.$parent);
        } else {
            this.jarvesTabsElement = angular.element(element.parent().children()[0]);
        }

        var jarvesTabsController = this.jarvesTabsElement.controller('jarvesTabs');
        jarvesTabsController.addTab(this.getOption('label'), transclude);
        element.detach();
    }

}