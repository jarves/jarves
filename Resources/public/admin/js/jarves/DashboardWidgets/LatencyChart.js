jarves.DashboardWidgets.LatencyChart = new Class({
    Extends: jarves.DashboardWidgets.Base,

    streamPath: 'JarvesBundle/latencies',

    create: function () {
        this.header = new Element('h3', {
            text: jarves.tc('dashboardWidget.latency', 'Latency')
        })
            .inject(this.main);

        this.div = new Element('div', {
            style: 'padding: 5px; text-align: center;'
        }).inject(this.main);

        new Element('span', {
            style: 'color: rgb(220,220,220)',
            text: 'Backend'
        }).inject(this.div);

        new Element('span', {
            text: ' / '
        }).inject(this.div);

        new Element('span', {
            style: 'color: rgb(151,187,205)',
            text: 'Frontend'
        }).inject(this.div);

        this.canvas = new Element('canvas', {
            width: 240,
            height: 165
        }).inject(this.main);
    },

    update: function (value) {
        var i = 0, length = 0, labels = [];

        //this.deRegisterStream();
        length = Math.max(value.backend.length, value.frontend.length);

        for (; i < length; i++) {
            labels.push('');
        }

        var ctx = this.canvas.getContext("2d");
        this.chart = new Chart(ctx).Line({
            labels: labels,
            datasets: [
                {
                    fillColor: "rgba(220,220,220,0.5)",
                    strokeColor: "rgba(220,220,220,1)",
                    pointColor: "rgba(220,220,220,1)",
                    pointStrokeColor: "#fff",
                    data: value.backend.reverse()
                },
                {
                    fillColor: "rgba(151,187,205,0.3)",
                    strokeColor: "rgba(151,187,205,0.8)",
                    pointColor: "rgba(151,187,205,0.7)",
                    pointStrokeColor: "#fff",
                    data: value.frontend.reverse()
                }
            ]
        }, {
            animation: false
        });
    }
});