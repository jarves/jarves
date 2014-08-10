/**
 *
 * Uses the $rootScope.
 *
 * @service jarves
 * @type {Class}
 * @scope {
 *  '_menus': 'Administration main menu items',
 *  '_session': 'Current session information',
 *  '_settings': 'Current system settings'
 * }
 */
jarves.Services.Jarves = new Class({
    Statics: {
        $inject: ['$rootScope', '$http', '$q', 'translator']
    },
    JarvesService: 'jarves',

    /**
     * @constructor
     *
     * @param $rootScope
     * @param $http
     * @param $q
     * @param translator
     */
    initialize: function($rootScope, $http, $q, translator) {
        this.rootScope = $rootScope;
        this.http = $http;
        this.q = $q;
        this.translator = translator;
        this.rootScope._session = window._session;
        this.rootScope._settings = {};

        console.log('new Service Jarves');
    },

    /**
     * Sets current session.
     *
     * @param session
     */
    setSession: function(session) {
        this.rootScope._session = session;
    },

    /**
     * Checks if user is logged in.
     *
     * @returns {Boolean}
     */
    isLoggedIn: function() {
        return this.rootScope._session && this.rootScope._session.userId > 0;
    },

    /**
     * Loads all menu items from the backend.
     *
     * @returns {promise}
     */
    loadMenu: function() {
        var deferred = this.q.defer();

        this.http.get(_pathAdmin + 'admin/backend/menus')
            .success(function(response) {
                this.setMenus(response.data);
                deferred.resolve();
            }.bind(this))
            .error(function(){
                deferred.reject();
            });

        return deferred.promise;
    },

    /**
     * Sets menus
     *
     * @param {Array} menus
     */
    setMenus: function(menus) {
        var categorized = {};

        var lastKey = '';
        var lastBundle = '';
        Object.each(menus, function(menu){
            lastBundle = menu.fullPath.split('/')[0];

            if (!categorized[lastBundle]) {
                //changed bundle
                categorized[lastBundle] = {label: this.getBundleTitle(lastBundle), items: []};
                lastKey = lastBundle;
            }

            if ('acl' === menu.type) {
                lastKey = menu.fullPath;
            }

            if (!categorized[lastKey]) {
                menu.items = [];
                categorized[lastKey] = menu;
                return;
            }

            categorized[lastKey].items.push(menu);
        }.bind(this));

        this.rootScope._menus = categorized;
    },

    /**
     * Sets settings
     *
     * @param {Object} settings
     */
    setSettings: function(settings) {
        Object.each(settings, function(val, key) {
            this.rootScope._settings[key] = val;
        }.bind(this));

        this.rootScope._settings['images'] = ['jpg', 'jpeg', 'bmp', 'png', 'gif', 'psd'];

        if (!this.rootScope._settings) {
            this.rootScope._settings = {};
        }

        if (typeOf(this.rootScope._settings) != 'object') {
            this.rootScope._settings = {};
        }

        if (!this.rootScope._settings['user']['windows']) {
            this.rootScope._settings['user']['windows'] = {};
        }

//        if (!this.options.frontPage && this.rootScope._settings.system && this.rootScope._settings.system.systemTitle) {
//            document.title = this.rootScope._settings.system.systemTitle + t(' | Jarves cms Administration');
//        }

        this.rootScope._settings.configsAlias = {};
        Object.each(this.rootScope._settings.configs, function(config, key){
            this.rootScope._settings.configsAlias[key.toLowerCase()] = this.rootScope._settings.configs[key];
            this.rootScope._settings.configsAlias[key.toLowerCase().replace(/bundle$/, '')] = this.rootScope._settings.configs[key];
        }.bind(this));
    },

    /**
     * Loads settings from the backend to application.
     *
     * @param {Array} keyLimitation
     * @returns {promise}
     */
    loadSettings: function(keyLimitation){
        var deferred = this.q.defer();

        var query = {lang: this.translator.getLanguage(), keys: keyLimitation};

        this.http.get(_pathAdmin + 'admin/backend/settings', {params: query})
            .success(function(response) {
                this.setSettings(response.data);
                deferred.resolve();
            }.bind(this))
            .error(function(){
                deferred.reject();
            });

        return deferred.promise;
    },


    /**
     * Returns the module title of the given module key.
     *
     * @param {String} key
     *
     * @return {String|null} Null if the module does not exist/its not activated.
     */
    getBundleTitle: function(key) {
        var config = this.getConfig(key);
        if (!config) {
            return key;
        }

        return config.label || config.name;
    },


    /**
     * Returns the bundle configuration array.
     *
     * @param {String} bundleName
     * @returns {Object|undefined}
     */
    getConfig: function(bundleName) {
        if (!bundleName) return;

        return this.getSettings().configs[bundleName]
            || this.getSettings().configs[bundleName.toLowerCase()]
            || this.getSettings().configsAlias[bundleName]
            || this.getSettings().configsAlias[bundleName.toLowerCase()];
    },

    /**
     *
     * @returns {Object}
     */
    getSettings: function() {
        return this.rootScope._settings;
    },

    /**
     * Returns the
     *
     * @param current
     * @param entryPoint
     * @returns {*}
     */
    getRelativeEntryPointPath: function(current, entryPoint) {
        if (typeOf(entryPoint) != 'string' || !entryPoint) {
            return current;
        }

        if (entryPoint.substr(0, 1) == '/') {
            return entryPoint;
        }

        current = current + '';
        if (current.substr(current.length - 1, 1) != '/') {
            current += '/';
        }

        return current + entryPoint;
    },

    /**
     * Returns the definition of a entry point.
     *
     * @param {String} path
     * @returns {Object}
     */
    getEntryPoint: function(path) {
        if (typeOf(path) != 'string') {
            return;
        }

        var splitted = path.split('/');
        var bundleName = splitted[0];

        splitted.shift();

        var code = splitted.join('/');

        var config, notFound = false, item;
        path = [];

        config = this.getConfig(bundleName);

        if (!config) {
            throw 'Config not found for bundleName: ' + bundleName;
        }

        var tempEntry = config.entryPoints[splitted.shift()]
        if (!tempEntry) {
            return null;
        }
        path.push(tempEntry['label']);

        while (item = splitted.shift()) {
            if (tempEntry.children && tempEntry.children[item]) {
                tempEntry = tempEntry.children[item];
                path.push(tempEntry['label']);
            } else {
                notFound = true;
                break;
            }
        }

        if (notFound) {
            return null;
        }

        tempEntry._path = path;
        tempEntry._module = bundleName;
        tempEntry._code = code;

        return tempEntry;
    },

    /**
     * executes a entry point from type function
     * @param {Object} entryPoint
     * @param {Object} options
     */
    execEntryPoint: function(entryPoint, options) {
        if (entryPoint.functionType == 'global') {
            if (window[entryPoint.functionName]) {
                window[entryPoint.functionName](options);
            }
        } else if (entryPoint.functionType == 'code') {
            eval(entryPoint.functionCode);
        }
    },


    /**
     * Returns the object definition properties.
     *
     * @param {String} objectKey
     * @returns {Object}
     */
    getObjectDefinition: function(objectKey) {
        if (typeOf(objectKey) != 'string') {
            throw 'objectKey is not a string: ' + objectKey;
        }

        objectKey = jarves.normalizeObjectKey(objectKey);

        var bundleName = ("" + objectKey.split('/')[0]).toLowerCase();
        var name = objectKey.split('/')[1].lcfirst();

        if (this.getConfig(bundleName) && this.getConfig(bundleName)['objects'][name]) {
            var config = this.getConfig(bundleName)['objects'][name];
            config._key = objectKey;
            return config;
        }
    },

    getObjectFieldLabel: function(value, field, fieldId, objectKey, relationsAsArray) {

        var oriFields = this.getObjectDefinition(objectKey);
        if (!oriFields) {
            throw 'Object not found ' + objectKey;
        }

        var oriFieldId = fieldId;
        if (typeOf(fieldId) == 'string' && fieldId.indexOf('.') > 0) {
            oriFieldId = fieldId.split('.')[0];
        }

        oriFields = oriFields['fields'];
        var oriField = oriFields[oriFieldId];

        var showAsField = Object.clone(field || oriField);
        if (!showAsField.type) {
            Object.each(oriField, function(v, i) {
                if (!showAsField[i]) {
                    showAsField[i] = v;
                }
            });
        }

        value = Object.clone(value);

        if (showAsField.type == 'predefined') {
            if (this.getObjectDefinition(showAsField.object)) {
                showAsField = this.getObjectDefinition(showAsField.object).fields[showAsField.field];
            }
        }

        showAsField.type = showAsField.type || 'text';
        if (oriField) {
            oriField.type = oriField.type || 'text';
        }

        var clazz = showAsField.type.ucfirst();
        if (!jarves.LabelTypes[clazz]) {
            clazz = 'Text';
        }

        if (relationsAsArray) {
            showAsField.options = showAsField.options || {};
            showAsField.options.relationsAsArray = true;
        }

        var labelType = new jarves.LabelTypes[clazz](oriField, showAsField, fieldId, objectKey);

        return labelType.render(value);
    }

});