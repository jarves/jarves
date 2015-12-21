import {Component, Parent} from 'angular2/core';
import Jarves from "../../services/Jarves";
import Translator from "../../services/Translator";
import Backend from "../../services/Backend";
import JarvesSession from "../../services/JarvesSession";
import JarvesTextComponent from "../../fields/JarvesTextComponent";
import JarvesPasswordComponent from "../../fields/JarvesPasswordComponent";
import JarvesAdminComponent from "./JarvesAdminComponent";

@Component({
    selector: 'jarves-login',
    directives: [JarvesTextComponent, JarvesPasswordComponent],
    template: `
<div class="jarves-login">
    <div class="jarves-login-middle">
        <div class="jarves-login-middle-top">
            <img class="jarves-login-logo" src="{{jarvesSession.baseUrl}}/bundles/jarves/images/logo.png" />
        </div>
        <form id="loginForm" onsubmit="return false;" class="jarves-login-middle-form" autocomplete="off">

            <jarves-text translate [(model)]="credentials.username" placeholder="Username"></jarves-text>
            <jarves-password translate [(model)]="credentials.password" placeholder="Password"></jarves-password>

            <jarves-language (modelChange)="loadLanguage(language)"></jarves-language>

            <button (click)="login()" translate>Login</button>

            <div class="jarves-login-loader-top" [class.active]="inputBlocked">
                <div class="jarves-login-loadingBarInside" style.width="{{progress}}%"></div>
            </div>
            <div class="jarves-login-loader-bottom" [class.active]="inputBlocked"></div>
        </form>
        <div class="loginMessage" [class.red]="loginStatus==2" [ngSwitch]="loginStatus">
            <span *ngSwitchWhen="1">Log in ...</span>
            <span *ngSwitchWhen="2">Login failed</span>
            <span *ngSwitchWhen="3">Loading interface ...</span>
            <span *ngSwitchWhen="4">Entering.</span>
            <span *ngSwitchWhen="5">Logged out.</span>
        </div>
    </div>
</div>
    `
})
export default class JarvesLoginComponent {
    public loginStatus:number = 0;
    public inputBlocked:boolean = false;
    public progress:number = 0;
    public credentials:{username:string, password: string} = {
        username: '',
        password: ''
    };

    constructor(private backend:Backend, private translator:Translator, private jarves:Jarves, public jarvesSession:JarvesSession) {
        if (this.jarvesSession.isLoggedIn()) {
            this.blockInput();
            this.loadInterface();
        }
    }

    public loadLanguage(language:string) {
        //Cookie.write('jarves_language', language);
        this.jarvesSession.setLanguage(language);
        this.translator.loadTranslations();
    }

    public logout() {
        this.loginStatus = 5;
        setTimeout(() => {
            this.loginStatus = 0;
        }, 2000);

        this.jarvesSession.setInterfaceVisible(false);
        setTimeout(() => {
            this.inputBlocked = false;
        }, 10);
    }

    public login() {
        this.blockInput();
        this.loginStatus = 1;

        this.backend.post('jarves/admin/login', this.credentials)
            .on('success', response => this.loginSuccess(response))
            .on('error', response => this.loginError(response))
    }

    protected loginSuccess(response) {
        this.credentials.password = '';
        this.jarvesSession.setSession(response.data);

        this.loadInterface();
    }

    protected loginError(response) {
        this.credentials.password = '';
        this.loginStatus = 2;
        this.unblockInput();
    }

    protected loadInterface() {
        this.loginStatus = 3;
        this.progress = 0;
        this.jarves.loadInterface()
            .on('progress', (progress) => {
                this.progress = progress;
            })
            .then(() => {
                this.loginStatus = 4;
                setTimeout(() => {
                    this.jarvesSession.setInterfaceVisible(true);
                }, 500);
            });
    }

    protected blockInput() {
        this.inputBlocked = true;
    }

    protected unblockInput() {
        this.inputBlocked = false;
    }
}