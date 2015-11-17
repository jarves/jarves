import {Inject} from '../angular.ts';

export default class LoginController {
    public loginStatus:number = 0;
    public inputBlocked:boolean = false;
    public progress:number = 0;
    public loginVisible:boolean = true;
    public credentials:Object = {
        username: '',
        password: ''
    };

    constructor(private $rootScope, private backend, private translator, private jarves, private $timeout) {
        this.jarves.loginController = this;

        $rootScope.language = 'en';
        $rootScope.$watch('language', (v) => this.loadLanguage(v));

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
        this.backend.post('admin/login', this.credentials)
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
        this.getAdminController().loadInterface()
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