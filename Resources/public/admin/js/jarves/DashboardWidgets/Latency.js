jarves.DashboardWidgets.Latency = new Class({
    Extends: jarves.DashboardWidgets.Base,

    streamPath: 'JarvesBundle/latency',

    create: function () {
        this.header = new Element('h3', {
            text: jarves.tc('dashboardWidget.latency', 'Latency')
        })
            .inject(this.main);

        new Element('div', {
            style: 'padding: 5px; text-align: center;',
            text: 'Frontend'
        }).inject(this.main);

        this.latency = new Element('div', {
            style: 'padding: 5px; text-align: center; font-size: 52px;',
            text: '23ms'
        }).inject(this.main);

        new Element('div', {
            style: 'padding: 5px; text-align: center;',
            text: t('Backend / DB / Session / Cache')
        }).inject(this.main);

        this.other = new Element('div', {
            style: 'padding: 5px; text-align: center; font-size: 18px;',
            text: ''
        }).inject(this.main);
    },

    update: function (value) {

        this.latency.set('text', value.frontend + 'ms');
        this.other.set('text',
            value.backend + 'ms / ' + value.database + 'ms / ' + value.session + 'ms / ' + value.cache + 'ms');
    }
});