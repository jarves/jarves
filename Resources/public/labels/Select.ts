import AbstractLabel from './AbstractLabel.ts';
import {Label} from '../angular.ts';
import {each} from '../utils.ts';
import angular from '../angular.ts';

@Label('select')
export default class Select extends AbstractLabel {

    protected template = 'bundles/jarves/views/label.select.html';

    public selectedItem = {};
    public data = {};
    public value = null;
    public items = {};

    constructor(protected $compile, protected $parse, protected $timeout, protected $http, protected $templateCache,
                protected $q, protected $interpolate, private objectRepository, private jarves) {
        super(...arguments);
    }

    link(scope, element, attributes) {
        super.link(...arguments);
        this.renderTemplateUrl(
            this.template
        );

        this.setupItems();

        this.onModelValueChange((value) => {
            this.value = value;
            this.updateSelected();
        });
    }

    updateSelected() {
        this.selectedItem = this.items[this.value];
    }

    setupItems() {
        if (this.getOption('object')) {
            //todo change to objectcollection
            this.objectRepository.getItems(this.getOption('object')).then(this.prepareItems.bind(this));
        } else {
            this.prepareItems(this.getOption('items'));
        }
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

    prepareItems(items) {
        var newItems = [], id;

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
}