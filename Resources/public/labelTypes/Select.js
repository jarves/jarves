jarves.LabelTypes.Select = new Class({
    Extends: jarves.LabelTypes.AbstractLabelType,

    Statics: {
        $inject: ['$scope', '$element', '$attrs', '$compile', '$parse', '$timeout', '$http', '$templateCache', '$q', '$interpolate', 'objectRepository']
    },

    objectRepository: null,
    //options: {
    //    relationsAsArray: false
    //},

    JarvesLabel: 'select',

    template: 'bundles/jarves/admin/js/views/label.select.html',

    selectedItem: {},
    data: {},
    value: null,
    items: {},

    link: function(scope, element, attributes) {
        this.renderTemplateUrl(
            this.template
        );

        scope.$parent.$watch(this.getModelName(), function(id) {
            this.value = id;
            this.updateSelected();
        }.bind(this));

        this.setupItems();
    },

    updateSelected: function() {
        this.selectedItem = this.items[this.value];
    },

    setupItems: function() {
        if (this.getOption('object')) {
            this.objectRepository.getItems(this.getOption('object')).then(this.prepareItems.bind(this));
        } else {
            this.prepareItems(this.getOption('items'));
        }
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

    prepareItems: function(items) {
        var newItems = [], id;

        if ('array' === typeOf(items)) {
            Array.each(items, function(item, idx) {

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

        this.updateSelected();
    }
});