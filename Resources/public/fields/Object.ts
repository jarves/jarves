import AbstractFieldType from './AbstractFieldType.ts';
import {Field, Inject} from '../angular.ts';
import WindowManagement from "../services/WindowManagement";
import ObjectRepository from "../services/ObjectRepository";
import ObjectCollection from "../ObjectCollection";

@Field('object', {
    templateUrl: 'bundles/jarves/views/fields/object.html'
})
@Inject('$compile, $parse, $timeout, $http, $templateCache, $q, $interpolate, objectRepository, windowManagement')
export default class Object extends AbstractFieldType {
    public path = '';
    public value;

    constructor(protected $compile, protected $parse, protected $timeout, protected $http, protected $templateCache,
                protected $q, protected $interpolate, protected objectRepository:ObjectRepository, protected windowManagement:WindowManagement) {
        super(...arguments);
    }

    protected collection:ObjectCollection;
    protected items:Array = [];
    protected item:Array = [];
    protected modelWatcherUnregister;

    link(scope, element, attr, controller, transclude) {
        super.link(scope, element, attr, controller, transclude);

        if (!this.getOption('object')) {
            throw 'object not defined for object field';
        }

        this.collection = this.objectRepository.newCollection(this.getOption('object'));
        this.collection.onChange((items) => {
            this.items = items;
            this.item = items[0];
        });

        this.modelWatcherUnregister = scope.$parent.$watch(this.getModelName(), (value) => {
            this.value = value;
            console.log('object value changed', value);

            if (this.isMultiple()) {
                //this.value is an array
                this.collection.setPrimaryKeys(value);
                this.collection.load();
            }
        });

        console.log('link Object', this.getOption('type'), this.definition);
    }

    public getTemplate():string {
        return this.getOption('labelTemplate');
    }

    public getLabelField():string {
        return this.getOption('labelField');
    }

    public getObject():string {
        return this.getOption('object');
    }

    destructor(){
        this.modelWatcherUnregister();
    }

    isMultiple():boolean {
        return this.getOption('objectRelation') !== 'nTo1';
    }

    openChooser() {
        this.windowManagement.openDialog('jarves/backend/chooser', {
            onChoose: function(value) {
                console.log('chosen value', value);
            }
        });
    }

    updateSelected() {

    }
}