import {Directive} from '../angular.ts';

@Directive('fixed', {
    restrict: 'A',
    priority: -100,
})
export default class ThFixed {
}