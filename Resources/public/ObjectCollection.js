jarves.ObjectCollection = new Class({
    Binds: ['handleLoadResponse', 'reload'],
    Statics: {
        $inject: ['$q', 'backend', 'objectRepository']
    },

    objectKey: '',
    selection: [],

    order: '',
    orderDirection: 'asc',
    entryPoint: '',
    customEntryPoint: false,
    repositoryMapping: true,

    queryOptions: {},

    callbacks: [],

    initialize: function($q, backend, objectRepository) {
        this.$q = $q;
        this.backend = backend;
        this.objectRepository = objectRepository;
    },

    setObjectKey: function(objectKey) {
        this.objectKey = objectKey;
        if (!this.customEntryPoint) {
            this.entryPoint = 'object/' + jarves.normalizeObjectKey(objectKey);
        }
        this.objectRepository.offObjectChange(this.reload);
        this.objectRepository.onObjectChange(this.objectKey, this.reload);
    },

    setOrder: function(field) {
        this.order = field;
    },

    setEntryPoint: function(entryPoint) {
        this.entryPoint = entryPoint;
        this.customEntryPoint = !!entryPoint;
        if (!entryPoint && this.objectKey) {
            this.entryPoint = 'object/' + jarves.normalizeObjectKey(this.objectKey);
        }
    },

    setSelection: function(selection) {
        this.selection = selection;
    },

    setQueryOption: function(key, value) {
        this.queryOptions[key] = value;
    },

    setRepositoryMapping: function(active) {
        this.setRepositoryMapping = active;
    },

    change: function(fn) {
        this.callbacks.push(fn);
    },

    load: function(queryOptions) {
        this.lastQueryOptions = angular.copy(queryOptions);
        queryOptions = queryOptions || {};
        queryOptions = Object.merge(this.queryOptions, queryOptions);

        queryOptions.fields = this.selection.join(',');
        queryOptions.order = {};
        queryOptions.order[this.order] = this.orderDirection;

        this.backend.get(this.entryPoint + '/?' + Object.toQueryString(queryOptions))
            .success(this.handleLoadResponse);
    },

    reload: function() {
        this.load(this.lastQueryOptions);
    },

    handleLoadResponse: function(response) {
        //if (this.repositoryMapping) {
        //    this.items = this.objectRepository.mapData(this.objectKey, response.data, true);
        //} else {
            this.items = response.data;
        //}

        this.fireChanges();
    },

    fireChanges: function() {
        Array.each(this.callbacks, function(callback) {
            callback(this.items);
        }.bind(this));
    }

});