import {Directive} from '../angular.ts';
import {baseUrl, baseRestUrl} from '../config.js';

@Directive('icon', {
    restrict: 'A'
})
export default class Icon {
    link(scope, element, attributes) {
        this.element = element;
        this.attributes = attributes;
        attributes.$observe('icon', (value)  => {
            this.value = value;
            this.update();
        });

        scope.$watch(() => this.element.text(), () => {
            this.update();
        })
    }

    update() {
        if (this.oldClass) {
            this.element.removeClass(this.oldClass);
        }
        if (this.oldImg) {
            this.oldImg.destroy();
        }

        if (!this.value) return;
        if ('#' === this.value.substr(0, 1)) {
            this.element.addClass(this.value.substr(1));
            this.oldClass = this.value.substr(1);
        } else {
            this.oldImg = new Element('img', {
                src: baseUrl + this.value
            }).inject(this.element[0], 'top');
        }

        if (!this.attributes.ngBind && !this.element.text()) {
            this.element.addClass('icon-no-text');
        } else {
            this.element.removeClass('icon-no-text');
        }
    }
}