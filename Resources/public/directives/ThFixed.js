import {Directive} from '../angular.js';

@Directive('fixed', {
    restrict: 'A',
    priority: -100,
})
export default class ThFixed {
}