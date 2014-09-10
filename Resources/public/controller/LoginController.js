import {Inject} from '../annotations';

@Inject('$rootScope, $scope, backend, translator, jarves')
export default class LoginController {
    constructor($rootScope, $scope, backend, translator, jarves) {
        this.rootScope = $rootScope;
        this.scope = $scope;
        this.backend = backend;
        this.translator = translator;
        this.jarves = jarves;
        this.scope.doLogin = () => this.doLogin();

        //this.scope.language = Cookie.read('jarves_language') || 'en';
        this.scope.language = 'en';
        this.scope.loginStatus = 0;
        this.scope.inputBlocked = false;
        this.scope.progress = 0;
        this.scope.loginVisible = true;
        this.scope.credentials = {
            username: '',
            password: ''
        };

        this.scope.$watch('language', () => this.loadLanguage());

        if (this.jarves.isLoggedIn()) {
            this.blockInput();
            this.loadInterface();
        }
    }

    setLanguage(language) {
        this.scope.language = language;
        this.loadLanguage();
    }

    loadLanguage() {
        window._session.lang = this.scope.language;
        //Cookie.write('jarves_language', this.scope.language);
        this.translator.setLanguage(this.scope.language);
    }

    /**
     * @returns {jarves.AdminController}
     */
    getAdminController() {
        return this.scope.$parent;
    }

    doLogin() {
        this.blockInput();
        this.scope.loginStatus = 1;
        this.backend.post('admin/login', this.scope.credentials)
            .success((response) => this.success(response))
            .error((response) => this.error(response));
    }

    success(response) {
        this.scope.credentials.password = '';
        this.jarves.setSession(response.data);

        this.loadInterface();
    }

    loadInterface() {
        this.scope.loginStatus = 3;
        this.scope.progress = 0;
        this.getAdminController().loadInterface()
            .then(function() {
                this.scope.loginStatus = 4;
                this.scope.loginVisible = false;
            }.bind(this), null, function(progress){
                this.scope.progress = progress;
            }.bind(this));
    }

    error(response) {
        this.scope.credentials.password = '';
        this.scope.loginStatus = 2;
        this.unblockInput();
    }

    blockInput() {
        this.scope.inputBlocked = true;
    }

    unblockInput() {
        this.scope.inputBlocked = false;
    }
}