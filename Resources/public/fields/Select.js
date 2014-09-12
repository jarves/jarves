import AbstractFieldType from './AbstractFieldType';
import {Field, InjectAsProperty} from '../annotations';
import {each} from '../utils';
import angular from '../angular'

@Field('select')
@InjectAsProperty('objectRepository')
export default class Select extends AbstractFieldType {
    constructor(...args) {
        this.additionalOptionsReferences = ['items'];
        this.chooserOpen = false;
        this.items = {};
        this.selected = {};
        this.selectedItem = {
            icon: null,
            label: '',
            id: null
        };
        this.objectRepository = null;
        this.template = 'bundles/jarves/views/field.select.html';
        super(...args);
    }

    link(scope, element, attr, controller, transclude) {
        super(scope, element, attr, controller, transclude);

        this.renderTemplateUrl(
            this.template,
            () => this.beforeCompile()
        );

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
            this.prepareItems(this.getOption('items'));
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

    updateSelected() {
        this.selectedItem = this.items[this.value];
    }

    /**
     *
     * @param {*} id
     */
    select(id) {
        this.chooserOpen = false;
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

    openChooser() {
        this.chooserOpen = true;
    }

    toggle() {
        this.chooserOpen = !this.chooserOpen;
    }
}