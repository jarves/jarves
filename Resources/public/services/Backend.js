export default class Backend {
    constructor($rootScope, $http) {
        this.$rootScope = $rootScope;
        this.$http = $http;
    }

    /**
     *
     * @param {String} url relative url
     * @returns {String}
     */
    getUrl(url) {
        return _pathAdmin + url;
    }

    preparePromise(httpPromise) {
        httpPromise.error(this.handleError);

        return httpPromise;
    }

    handleError(response) {
        //todo, show shiny box right bottom with information at the UI.
        console.error('request failed', response);
    }

    get(url, config) {
        return this.preparePromise(this.$http.get(this.getUrl(url), config));
    }

    delete(url, config) {
        return this.preparePromise(this.$http.delete(this.getUrl(url), config));
    }

    head(url, config) {
        return this.preparePromise(this.$http.head(this.getUrl(url), config));
    }

    post(url, data, config) {
        return this.preparePromise(this.$http.post(this.getUrl(url), data, config));
    }

    put(url, data, config) {
        return this.preparePromise(this.$http.put(this.getUrl(url), data, config));
    }

    patch(url, data, config) {
        return this.preparePromise(this.$http.patch(this.getUrl(url), data, config));
    }

    options(url, config) {
        var data = {_method: 'options'};
        return this.preparePromise(this.$http.post(this.getUrl(url), data, config));
    }
}