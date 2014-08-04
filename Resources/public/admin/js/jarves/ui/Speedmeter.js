jarves.ui = jarves.ui || {};

jarves.ui.Speedmeter = new Class({

    Implements: [Events, Options],

    container: null,

    options: {
    },

    initialize: function (container, options) {
        this.container = container;
        this.setOptions(options);
        this.create();
    },

    create: function () {
        this.id = 'gauge_' + ((Math.random()) + '').substr(2);
        this.main = new Element('div', {
            id: this.id,
            'class': 'jarves-ui-Speedmeter'
        }).inject(this.container);
        this.gauge = new JustGage(Object.merge({
            id: this.id,
            value: 0,
            min: 0,
            max: 100,
            titleFontColor: '#bbb',
            valueFontColor: '#bbb',
            showInnerShadow: false,
            title: "Title",
            levelColors: ["#114754"]
        }, this.options));
    },

    destroy: function () {
        delete this.gauge;
        this.main.destroy();
        delete this.main;
    },

    setValue: function (value) {
        return this.gauge.refresh(parseFloat(value).toFixed(0));
    }

});