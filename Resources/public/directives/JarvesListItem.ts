import {Directive, Inject} from '../angular.ts';
import {each} from '../utils.ts';

@Directive('jarvesListItem', {
    restrict: 'E',
    require: ['^jarvesList']
})
export default class JarvesListItem {

    link(scope, element, attributes, jarvesListController, translcude) {
       // var template = jarvesListController.getItemTemplateElement();
        // console.log('jarvesListItem', template);
        // if (template) {
        //     element.append(template);
        //     console.log('jarvesListItem done', element);
        // } else {
        //     throw 'No <jarves-list-template></jarves-list-template> specified.';
        // }
    }
}