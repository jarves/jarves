jarves.Dashboard = new Class({

    Implements: [Events],

    options: {

    },

    container: null,

    widgets: [],

    initialize: function (container, options) {
        this.container = container;
        this.createLayout(container);
        this.container.getDocument().body.addClass('jarves-Dashboard-active');
    },

    createLayout: function () {
        this.main = new Element('div', {
            'class': 'jarves-Dashboard'
        }).inject(this.container);

        this.mainLayout = new jarves.Layout(this.main, {
            layout: [
                {columns: ['50%', 11, '50%']}
            ],
            fixed: false
        });

        this.main.setStyle('opacity', 0);

        this.leftSide = this.mainLayout.getCell(1, 1);
        this.middle = this.mainLayout.getCell(1, 2);
        this.rightSide = this.mainLayout.getCell(1, 3);

        this.loadWidgets();
        this.fireEvent('load');
    },

    loadWidgets: function () {
        this.leftSide.empty();
        this.rightSide.empty();

        [
            'jarves.DashboardWidgets.LiveVisitor',
            'jarves.DashboardWidgets.Latency',
            'jarves.DashboardWidgets.LatencyChart',
            'jarves.DashboardWidgets.Uptime',
            'jarves.DashboardWidgets.Load',
            'jarves.DashboardWidgets.Space',
            'jarves.DashboardWidgets.Apc'
        ].each(function (clazz) {
            clazz = jarves.getClass(clazz);
            this.widgets.push(new clazz(this.leftSide));
        }.bind(this));

        [
            'jarves.DashboardWidgets.NewsFeed'
        ].each(function (clazz) {
            clazz = jarves.getClass(clazz);
            this.widgets.push(new clazz(this.rightSide));
        }.bind(this));



        this.main.tween('opacity', 1);
    },

    destroy: function () {
        Array.each(this.widgets, function (widget) {
            widget.destroy();
        });
        this.container.getDocument().body.removeClass('jarves-Dashboard-active');
        this.main.destroy();
    }


});