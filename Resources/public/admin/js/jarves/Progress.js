jarves.Progress = new Class({

    value: 0,
    autoTitle: false,

    initialize: function (pTitle, pUnlimited) {

        this.main = new Element('div', {
            'class': 'jarves-progress'
        });

        if (pUnlimited) {
            this.main.addClass('jarves-progress-unlimited');
        }

        this.progress = new Element('div', {
            'class': 'jarves-progress-bar'
        }).inject(this.main);

        this.text = new Element('div', {
            'class': 'jarves-progress-text',
            html: pTitle
        }).inject(this.main);

        if (!pTitle) {
            this.autoTitle = true;
        }
    },

    destroy: function() {
        this.main.destroy();
    },

    setValue: function (pValue) {
        if (!pValue) {
            pValue = 0;
        }
        if (pValue > 100) {
            pValue = 100;
        }

        this.value = pValue;
        this.progress.setStyle('width', pValue + '%');

        if (this.autoTitle) {
            this.setText(pValue + '%');
        }
    },

    inject: function (pTo, pWhere) {
        this.main.inject(pTo, pWhere);
    },

    setUnlimited: function (pActivated) {

        if (pActivated) {
            this.main.addClass('jarves-progress-unlimited');
        } else {
            this.main.removeClass('jarves-progress-unlimited');
            this.main.removeClass('jarves-progress-unlimited-stopped');
        }

    },

    stop: function () {
        this.main.removeClass('jarves-progress-unlimited');
        this.main.addClass('jarves-progress-unlimited-stopped');
    },

    start: function () {
        this.main.addClass('jarves-progress-unlimited');
        this.main.removeClass('jarves-progress-unlimited-stopped');
    },

    getValue: function () {
        return this.value;
    },

    setText: function (pTitle) {
        this.text.set('html', pTitle);
    },

    hide: function () {
        this.main.setStyle('display', 'none');
    },

    show: function () {
        this.main.setStyle('display', 'block');
    },

    toElement: function () {
        return this.main;
    }

});