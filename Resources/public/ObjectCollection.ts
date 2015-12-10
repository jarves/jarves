import {Inject} from './angular.ts';
import {normalizeObjectKey, toQueryString} from './utils.ts';
import angular from './angular.ts';
import Jarves from "./services/Jarves";
import ObjectRepository from "./services/ObjectRepository";

@Inject('$q, backend, jarves, objectRepository')
export default class ObjectCollection {

    protected objectKey:string = '';
    protected selection:Array = [];
    protected order:string = '';
    protected orderDirection:string = 'asc';
    protected entryPoint:string = '';
    protected customEntryPoint:boolean = false;
    protected repositoryMapping:boolean = true;
    protected queryOptions:Object = {};
    protected lastQueryOptions:Object = {};
    protected callbacks:Array = [];

    public items:Array = [];

    protected primaryKeys:Array = [];

    constructor(private $q, private backend, private jarves:Jarves, private objectRepository:ObjectRepository) {
        this.objectKey = '';
        this.selection = [];
        this.order = '';
        this.orderDirection = 'asc';
        this.entryPoint = '';
        this.customEntryPoint = false;
        this.repositoryMapping = true;

        this.queryOptions = {};
        this.callbacks = [];
    }

    public setObjectKey(objectKey:string) {
        this.objectKey = objectKey;

        if (!this.customEntryPoint) {
            this.entryPoint = 'jarves/object/' + normalizeObjectKey(objectKey);
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

    /**
     * Filter by primaryKeys.
     */
    setPrimaryKeys(primaryKeys:Array) {
        this.primaryKeys = primaryKeys;
    }

    public onChange(fn:Function) {
        this.callbacks.push(fn);
    }

    load(queryOptions:Object = {}) {
        this.lastQueryOptions = angular.copy(queryOptions);
        queryOptions = queryOptions || {};
        queryOptions = angular.extend(this.queryOptions, queryOptions);

        queryOptions.fields = this.selection.join(',');

        //var primaryKeys = null;
        //if (this.primaryKeys) {
        //    for (let primaryKey in this.primaryKeys) {
        //        jarves.getObjectId()primaryKey
        //    }
        //}

        queryOptions.primaryKeys = this.primaryKeys;
        if (this.order) {
            queryOptions.order = {};
            queryOptions.order[this.order] = this.orderDirection;
        }

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