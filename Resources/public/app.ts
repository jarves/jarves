import {Component} from 'angular2/core';

@Component({
    selector: 'jarves-admin',
    template: `
    <jarves-login></jarves-login>
    <jarves-interface></jarves-interface>
    `
})
export class App {
}