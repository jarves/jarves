jarves.Fields.Select = new Class({
    Extends: jarves.AbstractFieldType,

    Statics: {
        $inject: ['$scope', '$element', '$attrs', '$compile', '$http', '$templateCache', '$q', '$interpolate', 'objectRepository', 'jarves']
    },

    JarvesField: 'select',

    template: 'bundles/jarves/admin/js/views/field.select.html',

    chooserOpen: false,
    items: {},
    selected: null,
    selectedItem: {
        icon: null,
        label: '',
        id: null
    },

    objectRepository: null,

    link: function(scope, element, attr) {
        this.parent(scope, element, attr);

        this.renderTemplateUrl(
            this.template,
            this.beforeCompile.bind(this)
        );

        this.setupItems();
    },

    setupItems: function() {
        if (this.getOption('object')) {
            this.objectRepository.getItems(this.getOption('object')).then(this.prepareItems.bind(this));
        } else {
            this.$scope.$parent.$watch(this.$attrs.items, this.prepareItems.bind(this));
        }
    },

    prepareItems: function(items) {
        var newItems = [], id;

        if ('array' === typeOf(items)) {
            Array.each(items, function(item) {

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
            }.bind(this));
            this.items = newItems;
        }

        if ('object' === typeOf(items)) {
            Object.each(items, function(value, id) {
                newItems[id] = {label: this.toLabel(value), id: id};
            }, this);

            this.items = newItems;
        }
    },

    /**
     *
     * @param {*} id
     */
    select: function(id) {
        this.chooserOpen = false;
        if ('null' === this.items[id]) {
            return;
        }
        this.selected = id;
        this.selectedItem = this.items[id];
    },

    /**
     * @param {Object|String} item
     * @return {String}
     */
    toLabel: function(item) {
        if ('object' === typeOf(item) && this.getOption('object')) {
            return this.jarves.getObjectLabelByItem(this.getOption('object'), item);
        }

        if ('string' === typeOf(item)) {
            return item;
        }
    },

    addOption: function(values) {
        this.items[values.id] = values;
    },

    setOption: function(oldId, values) {
        delete this.items[oldId];
        this.addOption(values);
    },

    beforeCompile: function(contents) {

    },

    openChooser: function() {
        this.chooserOpen = true;
    },

    toggle: function() {
        this.chooserOpen = !this.chooserOpen;
    }
});