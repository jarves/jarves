jarves.DashboardWidgets = jarves.DashboardWidgets || {};

jarves.DashboardWidgets.Base = new Class({

    Binds: ['update'],
    Implements: [Options, Events],

    /**
     * @var {Element}
     */
    container: null,

    streamPath: null,

    size: 1,

    initialize: function (container, options) {
        this.container = container;
        this.setOptions(options);

        this.border = new Element('div', {
            'class': 'jarves-Dashboard-widget jarves-Dashboard-widget-grid-' + this.size
        }).inject(this.container);

        this.main = new Element('div', {
            'class': 'jarves-Dashboard-widget-content'
        }).inject(this.border);

        this.create();

        this.registerStream();

    },

    toElement: function () {
        return this.main;
    },

    getBorder: function() {
        return this.border;
    },

    destroy: function () {
        this.deRegisterStream();
    },

    deRegisterStream: function () {
        if (null !== this.streamPath) {
            jarves.deRegisterStream(this.streamPath, this.update);
        }
    },

    registerStream: function () {
        if (null !== this.streamPath) {
            jarves.registerStream(this.streamPath, this.update);
        }
    },

    update: function (value, stream) {

    },

    /**
     * Overwrite this method.
     * Use `this.main` to inject your stuff.
     */
    create: function () {

    }
});