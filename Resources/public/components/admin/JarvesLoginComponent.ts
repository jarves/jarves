import {Component} from 'angular2/core';
import Jarves from "../../services/Jarves";
import Translator from "../../services/Translator";
import Backend from "../../services/Backend";

@Component({
    selector: 'jarves-login',
    templateUrl: 'bundles/jarves/views/login.html',
    //controllerAs: 'loginController',
    //require: '^jarvesAdmin'
})
export default class JarvesLoginComponent {
    public loginStatus:number = 0;
    public inputBlocked:boolean = false;
    public progress:number = 0;
    public loginVisible:boolean = true;
    public credentials:Object = {
        username: '',
        password: ''
    };

    constructor(private backend:Backend, private translator:Translator, private jarves:Jarves) {
        //this.jarves.loginController = this;

        //jarves.language = 'en';
        //$rootScope.$watch('language', (v) => this.loadLanguage(v));
    }

    link(scope, element, attributes, controller) {
        this.jarvesAdmin = controller;

        if (this.jarves.isLoggedIn()) {
            this.blockInput();
            this.loadInterface();
        }
    }

    loadLanguage(language:string) {
        window._session.lang = language;
        //Cookie.write('jarves_language', language);
        this.translator.setLanguage(language);
    }

    logout() {
        this.loginStatus = 5;
        this.$timeout(() => {
            this.loginStatus = 0;
        }, 2000);

        this.loginVisible = true;
        this.$timeout(() => {
            this.inputBlocked = false;
        }, 10);
    }

    /**
     * @returns {jarves.AdminController}
     */
    getAdminController() {
        return this.$parent;
    }

    doLogin() {
        this.blockInput();
        this.loginStatus = 1;
        this.backend.post('jarves/admin/login', this.credentials)
            .success((response) => this.success(response))
            .error((response) => this.error(response));
    }

    success(response) {
        this.credentials.password = '';
        this.jarves.setSession(response.data);

        this.loadInterface();
    }

    loadInterface() {
        this.loginStatus = 3;
        this.progress = 0;
        this.jarvesAdmin.loadInterface()
            .then(function() {
                this.loginStatus = 4;
                this.loginVisible = false;
            }.bind(this), null, function(progress){
                this.progress = progress;
            }.bind(this));
    }

    error(response) {
        this.credentials.password = '';
        this.loginStatus = 2;
        this.unblockInput();
    }

    blockInput() {
        this.inputBlocked = true;
    }

    unblockInput() {
        this.inputBlocked = false;
    }
}