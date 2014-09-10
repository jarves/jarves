import {Inject} from '../annotations';

@Inject('$rootScope, $scope, $q, $http, jarves, windowManagement')
export default class AdminController {
    constructor($rootScope, $scope, $q, $http, jarves, windowManagement) {
        this.scope = $scope;
        $rootScope.jarves = jarves;

        this.q = $q;
        this.http = $http;
        this.jarves = jarves;
        this.windowService = windowManagement;

        this.scope._path = _path;
        this.scope._pathadmin = _pathAdmin;
        this.scope.windowService = windowManagement;
        this.scope.menuHidden = {};
        this.scope.loadInterface = (...args) => this.loadInterface(...args);
        this.scope.openEntryPoint = (...args) => this.openEntryPoint(...args);

        this.scope.interfaceVisible = false;
        this.scope._session = window._session;
    }

    showInterface() {
        this.scope.interfaceVisible = true;
    }

    loadInterface() {
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
    }

    /**
     * @returns {jarves.Window}
     */
    getActiveWindow() {
        return this.scope.lastWindow;
    }

    setFrontWindow(pWindow) {
        Object.each(this.scopes.windows, function (win, winId) {
            if (win && pWindow.id != winId) {
                win.toBack();
            }
        });
        this.scope.lastWindow = pWindow;
    }

    loadWindow(entryPoint, options, parentWindowId, isInline) {

        if (!isInline && window.event && window.event.which === 2) {
            //open new tab.
            top.open(location.pathname + '#' + entryPointPath, '_blank');
            return;
        }

        this.windowService.newWindow(entryPoint, options, parentWindowId, isInline);
    }

    /**
     *
     * @returns {jarves.Services.Jarves}
     */
    getJarves() {
        return this.jarves;
    }

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
    openEntryPoint(entryPoint, options, inline, dependWindowId) {
        entryPoint = 'object' === typeof entryPoint ? entryPoint : this.getJarves().getEntryPoint(entryPoint);

        if (!entryPoint) {
            throw new Error('Can not be found entryPoint: ' + entryPoint);
        }

        if (-1 !== ['custom', 'iframe', 'list', 'edit', 'add', 'combine'].indexOf(entryPoint.type)) {
            return this.loadWindow(entryPoint, options, dependWindowId, inline);
        } else if (entryPoint.type == 'function') {
            //return jarves.entrypoint.exec(entryPoint, options);
        }
    }
}