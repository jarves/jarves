import {Directive} from '../annotations';

@Directive('layoutCell', {
    restrict: 'E'
})
export default class layoutCell {
    constructor($interpolate) {
        this.$interpolate = $interpolate;
    }

    link(scope, element, attributes) {
        if (attributes.width) {
            var width = this.$interpolate(attributes.width)(scope);
            if (width == parseInt(width)+'') {
                width += 'px';
            }
            element.css('width', width);
        }
    }
}