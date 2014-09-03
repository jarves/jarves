jarves.Services.Backend = new Class({

    Statics: {
        $inject: ['$rootScope', '$http']
    },

    JarvesService: 'backend',

    cache: {
    },

    initialize: function($rootScope, $http) {
        this.$rootScope = $rootScope;
        this.$http = $http;
    },

    /**
     *
     * @param {String} url relative url
     * @returns {String}
     */
    getUrl: function(url) {
        return _pathAdmin + url;
    },

    preparePromise: function(httpPromise) {
        httpPromise.error(this.handleError);

        return httpPromise;
    },

    handleError: function(response) {
        //todo, show shiny box right bottom with information at the UI.
        console.error('request failed', response);
    },

    get: function(url, config) {
        return this.preparePromise(this.$http.get(this.getUrl(url), config));
    },

    'delete': function(url, config) {
        return this.preparePromise(this.$http.delete(this.getUrl(url), config));
    },

    head: function(url, config) {
        return this.preparePromise(this.$http.head(this.getUrl(url), config));
    },

    post: function(url, data, config) {
        return this.preparePromise(this.$http.post(this.getUrl(url), data, config));
    },

    put: function(url, data, config) {
        return this.preparePromise(this.$http.put(this.getUrl(url), data, config));
    },

    patch: function(url, data, config) {
        return this.preparePromise(this.$http.patch(this.getUrl(url), data, config));
    },

    options: function(url, config) {
        var data = {_method: 'options'};
        return this.preparePromise(this.$http.post(this.getUrl(url), data, config));
    }

});