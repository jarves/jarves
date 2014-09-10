import {Directive} from '../annotations';

@Directive('fixed', {
    restrict: 'A',
    priority: -100,
})
export default class ThFixed {
}