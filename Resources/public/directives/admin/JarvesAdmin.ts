import {baseUrl, baseUrlApi} from '../../config.js';
import {Directive} from '../../angular.ts';
import WindowManagement from '../../services/WindowManagement.ts';
import Jarves from '../../services/Jarves.ts';

@Directive('jarvesAdmin', {
    restrict: 'E',
    controllerAs: 'jarvesAdmin'
})
export default class AdminController {
    public menuHidden:Object = {};
    public interfaceVisible:boolean = false;

    constructor(public $rootScope, public $scope, protected $q, public $http, public jarves:Jarves, public windowManagement:WindowManagement) {
        this.$rootScope._baseUrl = baseUrl;
        this.$rootScope._baseUrlApi = baseUrlApi;
        this.$rootScope._session = window._session;
    }

    showInterface() {
        this.windowManagement.restoreWindows();
        this.interfaceVisible = true;

        this.$rootScope.$watch(() => {
            return this.windowManagement.activeWindowList
        }, () => {
            this.windowManagement.updateUrlHash();
        }, true);
    }

    logout() {
        this.interfaceVisible = false;
        this.jarves.logout();
    }

    loadInterface() {
        var deferred = this.$q.defer();

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

    loadWindow(entryPoint, options, parentWindowId, isInline) {

        if (!isInline && window.event && window.event.which === 2) {
            //open new tab.
            top.open(location.pathname + '#' + entryPoint.fullPath, '_blank');
            return;
        }

        this.windowManagement.newWindow(entryPoint, options, parentWindowId, isInline);
    }

    getJarves():Jarves {
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
     * @return {Number|*} Number when a new View has been loaded or mixed when custom function has been called
     * @throws Error when entryPoint is not found
     */
    openEntryPoint(entryPoint, options, inline, dependWindowId) {
        entryPoint = angular.isObject(entryPoint) ? entryPoint : this.getJarves().getEntryPoint(entryPoint);

        console.log('openEntryPoint', entryPoint);
        if (!entryPoint) {
            throw new Error('Can not be found entryPoint: ' + entryPoint);
        }

        if (-1 !== ['custom', 'iframe', 'list', 'edit', 'add', 'combined'].indexOf(entryPoint.type)) {
            return this.loadWindow(entryPoint, options, dependWindowId, inline);
        } else if (entryPoint.type == 'function') {
            //return jarves.entrypoint.exec(entryPoint, options);
        }
    }
}