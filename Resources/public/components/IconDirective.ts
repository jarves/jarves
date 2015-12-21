import {Directive, ElementRef, Renderer, Input} from 'angular2/core';

@Directive({
    selector: '[icon]'
})
export default class IconDirective {
    @Input() public icon:string = '';

    constructor(protected el: ElementRef, protected renderer: Renderer) {
    }

    ngAfterContentInit() {
        var cssClass;

        if ('#' === this.icon.substr(0, 1)) {
            cssClass = this.icon.substr(1);
        }

        this.renderer.setElementClass(this.el, cssClass, true);

        if (!$(this.el.nativeElement).text()) {
            this.renderer.setElementClass(this.el, 'icon-no-text', true);
        }
    }
}