import AbstractFieldType from './AbstractFieldType.ts';
import {Field} from '../angular.ts';
import {each} from '../utils.ts';
import angular from '../angular.ts'
import JarvesSelectChooser from "../directives/fields/JarvesSelectChooser";

@Field('select', {
    templateUrl: 'bundles/jarves/views/fields/select.html',
    controllerAs: 'selectController'
})
export default class Select extends AbstractFieldType {
    protected chooserOpen = false;
    protected items = {};

    public selected = {};
    public selectedItem = {
        icon: null,
        label: '',
        id: null
    };

    public value = null;

    protected jarvesSelectChooser:JarvesSelectChooser;

    constructor(protected $compile, protected $parse, protected $timeout, protected $http,
                protected $templateCache, protected $q, protected $interpolate, protected objectRepository) {
        super(...arguments);
    }

    public setJarvesSelectChooser(jarvesSelectChooser:JarvesSelectChooser) {
        this.jarvesSelectChooser = jarvesSelectChooser;
    }

    link(scope, element, attr, controller, transclude) {
        super.link(...arguments);

        this.onModelValueChange((value) => {
            this.value = value;
            this.updateSelected();
        });

        this.setupItems();
    }

    setupItems() {
        if (this.getOption('object')) {
            //todo change to objectcollection
            this.objectRepository.getItems(this.getOption('object')).then((...args) => this.prepareItems(...args));
        } else {
            this.scope.$watch(this.attributes['items'], (items) => {
                this.prepareItems(items);
            });
        }
    }

    prepareItems(items) {
        var newItems = [], id;

        console.log('prepareItems', items);
        if (angular.isArray(items)) {
            for (let [idx, item] of each(items)) {
                id = this.getOption('idField') && angular.isObject(item)
                    ? item[this.getOption('idField')]
                    : item;

                if (!this.getOption('idField') && false === this.getOption('itemsLabelAsValue')) {
                    id = idx;
                }

                if (angular.isArray(item)) {
                    newItems[id] = {label: this.toLabel(item[0]), icon: item[1], id: id};
                } else {
                    newItems[id] = {label: this.toLabel(item), id: id};
                }
            }
            this.items = newItems;
        }

        if (angular.isObject(items)) {
            for (let [id, item] of each(items)) {
                if (angular.isArray(item)) {
                    newItems[id] = {label: this.toLabel(item[0]), icon: item[1], id: id};
                } else {
                    newItems[id] = {label: this.toLabel(item), id: id};
                }
            }

            this.items = newItems;
        }

        this.updateSelected();
    }

    updateSelected() {
        this.selectedItem = this.items[this.value];
    }

    /**
     *
     * @param {*} id
     */
    select(id) {
        this.closeChooser();
        if ('null' === this.items[id]) {
            return;
        }
        this.value = id;
        this.selectedItem = this.items[id];
        this.setModelValue(id);
    }
    /**
     * @param {Object|String} item
     * @return {String}
     */
    toLabel(item) {
        if (angular.isObject(item) && this.getOption('object')) {
            return this.jarves.getObjectLabelByItem(this.getOption('object'), item);
        }

        if (angular.isString(item)) {
            return item;
        }
    }

    addOption(values) {
        this.items[values.id] = values;
    }

    setOption(oldId, values) {
        delete this.items[oldId];
        this.addOption(values);
    }

    beforeCompile(contents) {

    }

    public getOffset():Object {
        return this.element.offset();
    }

    public getHeight():Number {
        return this.element.height();
    }

    public openChooser() {
        this.chooserOpen = true;
        this.jarvesSelectChooser.show();
    }

    public closeChooser() {
        this.chooserOpen = false;
        this.jarvesSelectChooser.hide();
    }

    public toggle() {
        this.chooserOpen = !this.chooserOpen;
        this.chooserOpen ? this.openChooser() : this.closeChooser();
    }
}