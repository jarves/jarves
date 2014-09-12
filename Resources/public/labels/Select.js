import AbstractLabel from './AbstractLabel';
import {Label, InjectAsProperty} from '../annotations';
import {each} from '../utils';
import angular from '../angular';

@Label('select')
@InjectAsProperty('objectRepository')
export default class Select extends AbstractLabel {
    constructor(...deps) {
        super(...deps);
        this.template = 'bundles/jarves/views/label.select.html';
        this.objectRepository = null;
        this.selectedItem = {};
        this.data = {};
        this.value = null;
        this.items = {};
    }

    link(scope, element, attributes) {
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