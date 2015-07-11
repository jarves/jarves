import {Inject} from './angular.js';
import {normalizeObjectKey, toQueryString} from './utils.js';
import angular from './angular.js';

@Inject('$q, backend, objectRepository')
export default class ObjectCollection {
    constructor($q, backend, objectRepository) {
        this.objectKey = '';
        this.selection = [];
        this.order = '';
        this.orderDirection = 'asc';
        this.entryPoint = '';
        this.customEntryPoint = false;
        this.repositoryMapping = true;

        this.queryOptions = {};
        this.callbacks = [];

        this.$q = $q;
        this.backend = backend;
        this.objectRepository = objectRepository;
    }

    setObjectKey(objectKey) {
        this.objectKey = objectKey;
        if (!this.customEntryPoint) {
            this.entryPoint = 'object/' + normalizeObjectKey(objectKey);
        }
        this.objectRepository.offObjectChange(() => this.reload());
        this.objectRepository.onObjectChange(this.objectKey, () => this.reload());
    }

    setOrder(field) {
        this.order = field;
    }

    setEntryPoint(entryPoint) {
        this.entryPoint = entryPoint;
        this.customEntryPoint = !!entryPoint;
        if (!entryPoint && this.objectKey) {
            this.entryPoint = 'object/' + normalizeObjectKey(this.objectKey);
        }
    }

    setSelection(selection) {
        this.selection = selection;
    }

    setQueryOption(key, value) {
        this.queryOptions[key] = value;
    }

    setRepositoryMapping(active) {
        this.setRepositoryMapping = active;
    }

    change(fn) {
        this.callbacks.push(fn);
    }

    load(queryOptions) {
        this.lastQueryOptions = angular.copy(queryOptions);
        queryOptions = queryOptions || {};
        queryOptions = angular.extend(this.queryOptions, queryOptions);

        queryOptions.fields = this.selection.join(',');
        queryOptions.order = {};
        queryOptions.order[this.order] = this.orderDirection;

        this.backend.get(this.entryPoint + '/?' + toQueryString(queryOptions))
            .success((response) => this.handleLoadResponse(response));
    }

    reload() {
        this.load(this.lastQueryOptions);
    }

    handleLoadResponse(response) {
        //if (this.repositoryMapping) {
        //    this.items = this.objectRepository.mapData(this.objectKey, response.data, true);
        //} else {
            this.items = response.data;
        //}

        this.fireChanges();
    }

    fireChanges() {
        for (let callback of this.callbacks) {
            callback(this.items);
        }
    }

}