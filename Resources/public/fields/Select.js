import AbstractFieldType from './AbstractFieldType';
import {Field, InjectAsProperty} from '../annotations';
import {each} from '../utils';

@Field('select')
@InjectAsProperty('objectRepository')
export default class Select extends AbstractFieldType {
    constructor(...deps) {
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
        super(...deps);
    }

    link(scope, element, attr) {
        super(scope, element, attr);

        this.renderTemplateUrl(
            this.template,
            () => this.beforeCompile()
        );

        scope.$parent.$watch(this.getModelName(), (value) => function(value) {
            this.value = value;
            this.updateSelected();
        });

        this.setupItems();
    }

    setupItems() {
        if (this.getOption('object')) {
            this.objectRepository.getItems(this.getOption('object')).then(() => this.prepareItems(...arguments));
        } else {
            this.prepareItems(this.getOption('items'));
        }
    }

    prepareItems(items) {
        var newItems = [], id;

        console.log('prepareItems', this.$attrs.items, items);

        if ('array' === typeOf(items)) {
            for (let [idx, item] of each(items)) {
                id = this.getOption('idField') && 'object' === typeOf(item)
                    ? item[this.getOption('idField')]
                    : item;

                if (!this.getOption('idField') && false === this.getOption('itemsLabelAsValue')) {
                    id = idx;
                }

                if ('array' === typeOf(item)) {
                    newItems[id] = {label: this.toLabel(item[0]), icon: item[1], id: id};
                } else {
                    newItems[id] = {label: this.toLabel(item), id: id};
                }
            }

            this.items = newItems;
        }

        if ('object' === typeOf(items)) {
            for (let [id, value] of each(items)){
                newItems[id] = {label: this.toLabel(value), id: id};
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
        this.selected = id;
        this.selectedItem = this.items[id];
    }

    /**
     * @param {Object|String} item
     * @return {String}
     */
    toLabel(item) {
        if ('object' === typeOf(item) && this.getOption('object')) {
            return this.jarves.getObjectLabelByItem(this.getOption('object'), item);
        }

        if ('string' === typeOf(item)) {
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