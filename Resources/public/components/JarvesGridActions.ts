import {Directive} from '../angular.ts';

@Directive('jarvesGridActions', {
    restrict: 'A',
    require: '^jarvesGrid'
})
export default class JarvesGridActions {

    link(scope, element, attributes, jarvesGrid, transclude) {

        jarvesGrid.transclude(scope, (clone) => {
            element.prepend(clone);
        });
    }

}