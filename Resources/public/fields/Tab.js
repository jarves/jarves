import AbstractFieldType from './AbstractFieldType';
import {Field, InjectAsProperty} from '../annotations';
import angular from '../angular';

@Field('Tab', {
    transclude: true
})
@InjectAsProperty('$compile')
export default class Tab extends AbstractFieldType {
	
    link(scope, element, attributes, controller, transclude) {
        if ('jarves-tabs' !== element.parent().children()[0].tagName.toLowerCase()) {
            //create a new <jarves-tabs> element
            this.jarvesTabsElement = angular.element('<jarves-tabs></jarves-tabs>');
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