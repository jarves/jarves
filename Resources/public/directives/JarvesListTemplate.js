import {Directive, Inject} from '../angular.js';
import {each} from '../utils.js';

@Directive('jarvesListTemplate', {
    restrict: 'E',
    require: ['^jarvesList'],
    terminal: true,
    priority: 2000
})
export default class JarvesListTemplate {

    link(scope, element, attributes, jarvesListController, translcude) {
        // console.log('jarvesListTemplate');
        // var contents = translcude(scope, (clone) => {
        //     element.append(clone);
        // });

        jarvesListController.setItemTemplateElement(element.contents());
    }
}