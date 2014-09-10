import {Directive, Inject} from '../annotations';
import {each} from '../utils';

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