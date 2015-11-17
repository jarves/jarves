import {Directive} from '../angular.ts';

@Directive('jarvesLogin', {
    restrict: 'E',
    templateUrl: 'bundles/jarves/views/login.html'
})
export default class JarvesLogin {
    constructor() {
    }
}