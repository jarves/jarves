jarves.App = new Class({
    initialize: function(container) {
        this.container = container || document;
        this.bootstrap();
    },

    bootstrap: function() {
        angular.bootstrap(this.container, ['jarves']);
    }
});

var AngularController = new Class({
    scopeBlackList: ['Binds', 'scopeBlackList', 'initialize', 'caller', 'scope', 'bindToScope', 'publishScope'],

    /**
     * Publish all given properties to this.scope and bind all methods to `this`.
     *
     * @param {Array} [properties] empty to bind all methods.
     */
    bindToScope: function(properties) {
        this.publishScope(properties, true);
    },

    /**
     * Publish all given properties to this.scope.
     *
     * @param {Array} [properties] empty to bind all methods.
     * @param {Boolean} [withBind] If function should be automatic bind to `this`.
     */
    publishScope: function(properties, withBind) {
        var blacklist = {}, propertiesToUse,
            key, val;

        if ('array' === typeOf(properties) && properties.length) {
            propertiesToUse = {};
            Array.each(properties, function(key) {
                propertiesToUse[key] = this[key];
            }.bind(this));
        } else {
            propertiesToUse = this;
        }

        Array.each(this.scopeBlackList, function(item) {
            blacklist[item] = true;
        });

        for (key in propertiesToUse) {
            val = propertiesToUse[key];
            if (key in blacklist) {
                continue;
            }
            if (withBind) {
                this.scope[key] = 'function' === typeOf(val) ? val.bind(this) : val;
            } else {
                this.scope[key] = val;
            }
        }
    }
});

jarves.AdminController = new Class({
    Extends: AngularController,
    Statics: {
        $inject: ['$scope', '$q', '$http', 'jarves', 'windowService']
    },
    JarvesController: 'AdminController',

    options: {
        frontPage: false
    },

    jarves: null,

    initialize: function($scope, $q, $http, jarves, windowService) {
        this.scope = $scope;
        this.q = $q;
        this.http = $http;
        this.jarves = jarves;
        this.windowService = windowService;

        this.scope._path = _path;
        this.scope._pathadmin = _pathAdmin;
        this.scope.windowService = windowService;
        this.scope.menuHidden = {};
        this.bindToScope(['loadInterface', 'openEntryPoint']);

        this.scope.interfaceVisible = false;
        this.scope._session = window._session;
    },

    showInterface: function() {
        this.scope.interfaceVisible = true;
    },

    loadInterface: function() {
        var deferred = this.q.defer();

        deferred.notify(25);
        this.jarves.loadSettings()
            .then(function() {
                deferred.notify(60);
                return this.jarves.loadMenu();
            }.bind(this))
            .then(function() {
                deferred.notify(100);
                deferred.resolve();
                this.showInterface();
            }.bind(this));

        return deferred.promise;
    },

    /**
     * @returns {jarves.Window}
     */
    getActiveWindow: function() {
        return this.scope.lastWindow;
    },

    setFrontWindow: function (pWindow) {
        Object.each(this.scopes.windows, function (win, winId) {
            if (win && pWindow.id != winId) {
                win.toBack();
            }
        });
        this.scope.lastWindow = pWindow;
    },

    loadWindow: function (entryPoint, options, parentWindowId, isInline) {

        if (!isInline && window.event && window.event.which === 2) {
            //open new tab.
            top.open(location.pathname + '#' + entryPointPath, '_blank');
            return;
        }

        this.windowService.newWindow(entryPoint, options, parentWindowId, isInline);

//        if ((win = this.checkOpen(entryPointPath, null, options)) && !isInline) {
//            return win.toFront();
//        }

//        var instance = ++jarves.wm.instanceIdx;

//        if (parentWindowId == -1 || (isInline && !parentWindowId)) {
//            parentWindowId = jarves.wm.lastWindow ? jarves.wm.lastWindow.id : false;
//        }
//
//        if (false === parentWindowId || (parentWindowId && !jarves.wm.getWindow(parentWindowId))) {
//            throw tf('Parent `%d` window not found.', parentWindowId);
//        }
//        console.log(entryPoint);
//        this.scope._windows[newWindowId] = new jarves.Window(entryPoint, newWindowId, options, isInline, parentWindowId, this);

//        var entryPointPath = jarves.normalizeEntryPointPath(entryPoint._path);
//        this.scope._windows[newWindowId] = new jarves.Window(entryPoint, newWindowId, options, isInline, parentWindowId, this);
//        jarves.wm.windows[instance] = new jarves.Window(entryPointPath, entryPoint, instance, pParams, isInline, pParentWindowId);
//        jarves.wm.windows[instance].toFront();
//        jarves.wm.updateWindowBar();
//        jarves.wm.reloadHashtag();
//        return jarves.wm.windows[instance];
    },

    /**
     *
     * @returns {jarves.Services.Jarves}
     */
    getJarves: function() {
        return this.jarves;
    },

    /**
     * Opens a entry point. Entry points are REST entry points as well as mapped paths to views in the administration and
     * mapped paths to general functions in the administration. The actual behavior is defined in its `type`.
     * Views can be automatically created CRUD views or custom views. A entry point can also be a function call or a placeholder
     * for grouping.
     *
     * Views will be loaded into a jarves.Window object which are basically just tabs of the main application.
     *
     * @param {String|Object} entryPoint path or entryPoint object
     * @param {Object} [options]
     * @param {Boolean} [inline]
     * @param {Number} [dependWindowId]
     *
     *
     * @return {undefined|Number|*} Number when a new View has been loaded or mixed when custom function has been called
     * @throws Error when entryPoint is not found
     */
    openEntryPoint: function(entryPoint, options, inline, dependWindowId) {

        entryPoint = 'object' === typeOf(entryPoint) ? entryPoint : this.getJarves().getEntryPoint(entryPoint);

        if (!entryPoint) {
            throw new Error('Can not be found entryPoint: ' + entryPoint);
        }

        if (['custom', 'iframe', 'list', 'edit', 'add', 'combine'].contains(entryPoint.type)) {
            return this.loadWindow(entryPoint, options, dependWindowId, inline);
        } else if (entryPoint.type == 'function') {
            return jarves.entrypoint.exec(entryPoint, options);
        }
    }
});
//
//jarves.AdminLoginController = new Class({
//    Extends: AngularController,
////    Binds: ['success', 'error', 'loadLanguage'],
//    Statics: {
//        $inject: ['$rootScope', '$scope', '$http']
//    },
//    JarvesController: 'AdminInterfaceController',
//
//    initialize: function($rootScope, $scope, $http) {
//
//    }
//});

jarves.AdminLoginController = new Class({
    Extends: AngularController,
    Binds: ['success', 'error', 'loadLanguage'],
    Statics: {
        $inject: ['$rootScope', '$scope', '$http', 'translator', 'jarves']
    },
    JarvesController: 'AdminLoginController',

    initialize: function($rootScope, $scope, $http, translator, jarves) {
        this.rootScope = $rootScope;
        this.scope = $scope;
        this.http = $http;
        this.translator = translator;
        this.jarves = jarves;
        this.bindToScope(['doLogin']);

        this.scope.language = Cookie.read('jarves_language') || 'en';
        this.scope.loginStatus = 0;
        this.scope.inputBlocked = false;
        this.scope.progress = 0;
        this.scope.loginVisible = true;
        this.scope.credentials = {
            username: '',
            password: ''
        };

        this.scope.$watch('language', this.loadLanguage);

        if (this.jarves.isLoggedIn()) {
            this.blockInput();
            this.loadInterface();
        }
    },

    setLanguage: function(language) {
        this.scope.language = language;
        this.loadLanguage();
    },

    loadLanguage: function() {
        window._session.lang = this.scope.language;
        Cookie.write('jarves_language', this.scope.language);
        this.translator.setLanguage(this.scope.language);
    },

    /**
     * @returns {jarves.AdminController}
     */
    getAdminController: function() {
        return this.scope.$parent;
    },

    doLogin: function() {
        this.blockInput();
        this.scope.loginStatus = 1;
        this.http.post(_pathAdmin + 'admin/login', this.scope.credentials)
            .success(this.success)
            .error(this.error);
    },

    success: function(response) {
        this.scope.credentials.password = '';
        this.jarves.setSession(response.data);

        this.loadInterface();
    },

    loadInterface: function() {
        this.scope.loginStatus = 3;
        this.scope.progress = 0;
        this.getAdminController().loadInterface()
            .then(function() {
                this.scope.loginStatus = 4;
                this.scope.loginVisible = false;
            }.bind(this), null, function(progress){
                this.scope.progress = progress;
            }.bind(this));
    },

    error: function(response) {
        this.scope.credentials.password = '';
        this.scope.loginStatus = 2;
        this.unblockInput();
    },

    blockInput: function() {
        this.scope.inputBlocked = true;
    },

    unblockInput: function() {
        this.scope.inputBlocked = false;
    }
});