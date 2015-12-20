import {Component, Input} from 'angular2/core';
import JarvesTextComponent from "./JarvesTextComponent";

@Component({
    selector: 'jarves-password',
    template: '<input type="password" class="jarves-Input-text" [(ngModel)]="model" [placeholder]="placeholder" />'
})
export default class JarvesPasswordComponent extends JarvesTextComponent {
}