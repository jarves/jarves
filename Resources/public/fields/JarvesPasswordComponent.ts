import {Component, Input, Output, EventEmitter} from 'angular2/core';

@Component({
    selector: 'jarves-password',
    template: '<input type="text" class="jarves-Input-text" [ngModel]="model" (ngModelChange)="modelChange.next($event)" [placeholder]="placeholder" />'
})
export default class JarvesPasswordComponent {
    @Input() public placeholder = '';
    @Input() public model;
    @Output() public modelChange:EventEmitter = new EventEmitter();
}