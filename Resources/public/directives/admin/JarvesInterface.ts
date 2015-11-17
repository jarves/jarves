import {baseUrl, baseRestUrl} from '../../config.js';
import {Directive} from '../../angular.ts';

@Directive('jarvesInterface', {
    restrict: 'E',
    templateUrl: 'bundles/jarves/views/interface.html'
})
export default class JarvesInterfaceController {
    constructor() {
    }
}