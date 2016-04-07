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
            style: 'color: gray',
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

        var backend = [];
        Array.each(value.backend, function(value) {
            backend.unshift(value.toFixed(3));
        });

        var frontend = [];
        Array.each(value.frontend, function(value) {
            frontend.unshift(value.toFixed(3));
        });

        var ctx = this.canvas.getContext("2d");
        this.chart = new Chart(ctx).Line({
            labels: labels,
            datasets: [
                {
                    fillColor: "rgba(200,200,200,0.5)",
                    strokeColor: "rgba(200,200,200,1)",
                    pointColor: "rgba(200,200,200,1)",
                    pointStrokeColor: "#fff",
                    data: backend
                },
                {
                    fillColor: "rgba(151,187,205,0.3)",
                    strokeColor: "rgba(151,187,205,0.8)",
                    pointColor: "rgba(151,187,205,0.7)",
                    pointStrokeColor: "#fff",
                    data: frontend
                }
            ]
        }, {
            animation: false
        });
    }
});