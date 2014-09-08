export default class ObjectRepository {

    //Statics: {
    //    $inject: ['$rootScope', '$q', '$injector', '$timeout', 'backend', 'jarves']
    //},
    //JarvesService: 'objectRepository',
    //
    //instancePool: {
    //},
    //
    //
    //changesCallback: {},

    /**
     *
     * @param {Scope} $rootScope
     * @param $q
     * @param $injector
     * @param $timeout
     * @param {jarves.Services.Backend} backend
     * @param {jarves.Services.Jarves} jarvesService
     */
    constructor($rootScope, $q, $injector, $timeout, backend, jarvesService) {
        this.$rootScope = $rootScope;
        this.$q = $q;
        this.$timeout = $timeout;
        this.$injector = $injector;
        this.backend = backend;
        this.jarves = jarvesService;
        jarves.fireObjectChange = function(objectKey) {
            this.fireObjectChange(jarves.normalizeObjectKey(objectKey));
        }.bind(this);
    }

    onObjectChange(objectKey, cb) {
        if (!this.changesCallback[objectKey]) {
            this.changesCallback[objectKey] = [];
        }
        this.changesCallback[objectKey].push(cb);
    }

    offObjectChange(cb) {
        Object.each(this.changesCallback, function(cbs, objectKey) {
            Array.each(cbs, function(cb, idx) {
                if (cb === cb) {
                    cbs.splice(idx, 1);
                }
            });
        });
    }

    fireObjectChange(objectKey) {
        if (this.changesCallback[objectKey]) {
            Array.each(this.changesCallback[objectKey], function(cb) {
                cb();
            });
        }
    }

    newCollection(objectKey) {
        var collection = this.$injector.instantiate(jarves.ObjectCollection);
        collection.setObjectKey(objectKey);

        return collection;
    }

    //getItems: function(objectKey, options) {
    //    var deferred = this.$q.defer();
    //
    //    if (!this.instancePool[objectKey]) {
    //        this.instancePool[objectKey] = {};
    //    }
    //
    //    options = options || {};
    //
    //    var queryString = Object.toQueryString(options);
    //
    //    this.backend.get('object/' + jarves.normalizeObjectKey(objectKey) + '/?' + queryString).success(function(response) {
    //        this.mapData(objectKey, response.data);
    //        deferred.resolve(this.instancePool[objectKey]);
    //    }.bind(this));
    //
    //    return deferred.promise;
    //},

    loadItems(objectKey, entryPoint, queryOptions) {
        var deferred = this.$q.defer();

        this.backend.get(entryPoint + '/?' + Object.toQueryString(queryOptions))
            .success(function(response) {
                //this.mapData(objectKey, response.data);
                //deferred.resolve(this.instancePool[objectKey]);
                deferred.resolve(this.response.data);
            });

        return deferred.promise;
    }

    //mapData: function(objectKey, items, asArray) {
    //    var changes = false;
    //
    //    if (!this.instancePool[objectKey]) {
    //        this.instancePool[objectKey] = {};
    //    }
    //
    //    if (items.length > Object.getLength(this.instancePool[objectKey])) {
    //        changes = true;
    //    }
    //
    //    var mappedData = asArray ? [] : {};
    //
    //    Object.each(items, function(item) {
    //        var id = this.jarves.getObjectId(objectKey, item);
    //
    //        if (this.mapItem(objectKey, item)) {
    //            changes = true;
    //        }
    //
    //        if (asArray) {
    //            mappedData.push(this.instancePool[objectKey][id]);
    //        } else {
    //            mappedData[id] = this.instancePool[objectKey][id];
    //        }
    //    }, this);
    //
    //    if (changes) {
    //        this.$timeout(function(){
    //            this.$rootScope.$apply();
    //        }.bind(this));
    //    }
    //
    //    return mappedData;
    //},
    //
    //mapItem: function(objectKey, item) {
    //    var changes = false;
    //    var id = this.jarves.getObjectId(objectKey, item);
    //    if (!this.instancePool[objectKey]) {
    //        this.instancePool[objectKey] = {};
    //    }
    //
    //    if (!this.instancePool[objectKey][id]) {
    //        changes = true;
    //        this.instancePool[objectKey][id] = item;
    //    } else {
    //        Object.each(item, function(value, fieldKey) {
    //            if (!(fieldKey in this.instancePool[objectKey][id])) {
    //                this.instancePool[objectKey][id][fieldKey] = value;
    //                changes = true;
    //            } else if (this.instancePool[objectKey][id][fieldKey] != value) {
    //                this.instancePool[objectKey][id][fieldKey] = value;
    //                changes = true;
    //            }
    //        }, this);
    //    }
    //
    //    if (changes) {
    //        this.fireObjectChange(objectKey, item);
    //    }
    //
    //    return changes;
    //}

}