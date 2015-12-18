import {baseUrl, baseUrlApi} from '../../config';

@Directive('jarvesInterface', {
    restrict: 'E',
    templateUrl: 'bundles/jarves/views/interface.html'
})
export default class JarvesInterfaceController {
    constructor() {
    }

    link(scope, element) {
        this.element = element;
    }

    public getElement(){
        return this.element.children()[0];
    }
}