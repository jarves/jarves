jarves.Services.ObjectRepository = new Class({

    Statics: {
        $inject: ['$rootScope', '$q', 'backend', 'jarves']
    },
    JarvesService: 'objectRepository',

    cache: {
    },

    /**
     *
     * @param {Scope} $rootScope
     * @param {jarves.Services.Backend} backend
     * @param {jarves.Services.Jarves} jarves
     */
    initialize: function($rootScope, backend, jarves) {
        this.$rootScope = $rootScope;
        this.backend = backend;
        this.jarves = jarves;
    },

    getItems: function(objectKey, options) {
        var deferred = this.$q.defer();

        if (!this.cache[objectKey]) {
            this.cache[objectKey] = {};
        }

        options = options || {};

        var queryString = Object.toQueryString(options);

        this.backend.get('object/' + jarves.normalizeObjectKey(objectKey) + '/?' + queryString).success(function(response) {
            this.mapData(objectKey, response.data);
            deferred.resolve(this.cache[objectKey]);
        }.bind(this));

        return deferred.promise;
    },

    mapData: function(objectKey, items) {
        var removed = [];
        var changes = false;

        if (items.length > Object.getLength(this.cache[objectKey])) {
            changes = true;
        }

        Object.each(items, function(item) {
            var id = this.jarves.getObjectId(objectKey, item);
            if (!this.cache[objectKey][id]) {
                changes = true;
                this.cache[objectKey][id] = item;
            } else {
                Object.each(item, function(value, fieldKey) {
                    if (!(fieldKey in this.cache[objectKey][id])) {
                        this.cache[objectKey][id][fieldKey] = value;
                        changes = true;
                    } else if (this.cache[objectKey][id][fieldKey] != value) {
                        this.cache[objectKey][id][fieldKey] = value;
                        changes = true;
                    }
                }, this);
            }

        }, this);

        if (changes) {
            this.$rootScope.$apply();
        }
    }

});