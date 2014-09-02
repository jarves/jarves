jarves.Fields.Select = new Class({
    Extends: jarves.AbstractFieldType,

    JarvesField: 'select',

    template: 'bundles/jarves/admin/js/views/field.select.html',

    chooserOpen: false,
    items: {},
    attr: {},
    selected: null,
    selectedItem: {},

    link: function(scope, element, attr) {
        this.attr = attr;
        this.renderTemplateUrl(
            this.template,
            this.beforeCompile.bind(this)
        );

        this.watchOption('items', this.prepareItems.bind(this));
    },

    prepareItems: function(items) {
        var newItems = [], id;

        if ('array' === typeOf(items)) {
            Array.each(items, function(item) {

                id = this.getOption('idField') && 'object' === typeOf(item)
                    ? item[this.getOption('idField')]
                    : item;

                newItems[id] = {label: this.toLabel(item), id: id};
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
     *
     * @param {Object|String} item
     * @return {String}
     */
    toLabel: function(item) {
        if ('string' === typeOf(item)) {
            return item;
        }

        //if ('object' === typeOf(item)) {
        //    var template = this.getOption('template');
        //    if (template) {
        //
        //    } else if (this.getOption('object')) {
        //
        //    }
        //}
    },

    addOption: function(values) {
        console.log('addOption', values);
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