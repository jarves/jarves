jarves.DashboardWidgets.Apc = new Class({
    Extends: jarves.DashboardWidgets.Base,

    streamPath: 'JarvesBundle/apc',

    gauges: [],

    create: function () {
        this.header = new Element('h3', {
            text: jarves.tc('dashboardWidget.apc', 'APC Cache')
        })
            .inject(this.main);

        this.load = new Element('div', {
            style: 'padding: 5px; text-align: center',
            text: ' '
        }).inject(this.main);

    },

    update: function (value) {
        if (!value) {
            this.load.set('text', t('PHP APC not supported.'));
        } else {
            if (!this.gauge) {
                this.gauge = new jarves.ui.Speedmeter(this.main, {
                    title: 'Usage',
                    label: 'MB',
                    max: (value.seg_size / 1024 / 1024).toFixed(0),
                    value: ((value.seg_size - value.avail_mem) / 1024 / 1024).toFixed(0)
                })
            } else {
                this.gauge.setValue(((value.seg_size - value.avail_mem) / 1024 / 1024).toFixed(0));
            }
        }
    }
});