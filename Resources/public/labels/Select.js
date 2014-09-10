import AbstractLabel from './AbstractLabel';
import {Label} from '../annotations';
import {each} from '../utils';
import angular from '../angular';

@Label('select')
export default class Select extends AbstractLabel {

// jarves.LabelTypes.Select = new Class({
//     Extends: jarves.LabelTypes.AbstractLabelType,

//     Statics: {
//         $inject: ['$scope', '$element', '$attrs', '$compile', '$parse', '$timeout', '$http', '$templateCache', '$q', '$interpolate', 'objectRepository']
//     },

//     objectRepository: null,
//     //options: {
//     //    relationsAsArray: false
//     //},

//     JarvesLabel: 'select',

//     template: 'bundles/jarves/admin/js/views/label.select.html',

//     selectedItem: {},
//     data: {},
//     value: null,
//     items: {},
//     
    constructor(...deps) {
        super(...deps);
        this.template = 'bundles/jarves/views/label.select.html';
        this.objectRepository = null;
        this.selectedItem = {};
        this.data = {};
        this.value = null;
        this.items = {};
        console.info('new Select label');
    }

    link(scope, element, attributes) {
        this.renderTemplateUrl(
            this.template
        );

        scope.$parent.$watch(this.getModelName(), function(id) {
            this.value = id;
            this.updateSelected();
        }.bind(this));

        this.setupItems();
    }

    updateSelected() {
        this.selectedItem = this.items[this.value];
    }

    setupItems() {
        if (this.getOption('object')) {
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