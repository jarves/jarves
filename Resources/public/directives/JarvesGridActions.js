import {Directive} from '../angular.ts';

@Directive('jarvesGridActions', {
    restrict: 'A',
    require: '^jarvesGrid'
})
export default class JarvesGridActions {

    link(scope, element, attributes, gridController, transclude) {

        gridController.transclude(scope, (clone) => {
            element.prepend(clone);
        });
    }

}