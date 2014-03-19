jarves.DashboardWidgets = jarves.DashboardWidgets || {};

jarves.DashboardWidgets.Base = new Class({

    Binds: ['update'],
    Implements: [Options, Events],

    /**
     * @var {Element}
     */
    container: null,

    streamPath: null,

    initialize: function (container, options) {
        this.container = container;
        this.setOptions(options);

        this.main = new Element('div', {
            'class': 'jarves-Dashboard-widget'
        }).inject(this.container);

        this.create();

        this.registerStream();

    },

    toElement: function () {
        return this.main;
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