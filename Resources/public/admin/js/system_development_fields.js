var jarves_system_development_fields = new Class({

    /**
     *
     */
    win: null,

    initialize: function (pWin) {
        this.win = pWin;
        this.createLayout();
    },

    createLayout: function () {
        this.layout = new jarves.Layout(this.win.content, {
            layout: [
                {
                    columns: ['400px', null]
                },
                {
                    height: '50px',
                    columns: [null, null]
                }
            ],
            splitter: [
                [1, 1, 'right']
            ]
        });

        this.leftSide = this.layout.getCell(1, 1);
        this.container = this.layout.getCell(1, 2);

        this.code = new jarves.Field({
            noWrapper: true,
            type: 'codemirror',
            inputHeight: '100%',
            inputWidth: '100%',
            options: {
                mode: 'javascript'
            }
        }, this.leftSide);

        var val = '';
        if (!window.localStorage || !(val = window.localStorage.getItem('jarvesbundle_system_dev_fields'))) {
            val = '{\n\
    "label": "Test field",\n\
    "type": "text",\n\
    "desc": "This is a test field."\n\
}';
        }

        this.bottom = this.layout.getCell(2, 1);
        this.bottom.setStyle('padding-top', 10);
        this.bottom.setStyle('padding-left', 5);

        new jarves.Button('Apply Field')
            .setButtonStyle('blue')
            .addEvent('click', function(){
                this.apply();
            }.bind(this))
            .inject(this.bottom);

        new jarves.Button('Apply FieldForm')
            .setButtonStyle('blue')
            .addEvent('click', function(){
                this.apply(true);
            }.bind(this))
            .inject(this.bottom);

        new jarves.Button('GetValue')
            .setButtonStyle('blue')
            .addEvent('click', function(){
                this.showValue(this.getValue());
            }.bind(this))
            .inject(this.bottom);

        new jarves.Button('SetValue')
            .setButtonStyle('blue')
            .addEvent('click', function(){
                var value = prompt('Value');
                this.setValue(value);
            }.bind(this))
            .inject(this.bottom);

        this.code.setValue(val);
    },

    getValue: function() {
        if (this.field) {
            return this.field.getValue();
        }
    },

    setValue: function(value) {
        if (this.field) {
            return this.field.setValue(value);
        }
    },

    showValue: function(value) {
        if (!this.lastValueViewer) {
            this.lastValueViewer = new Element('pre', {
                'class': 'selectable',
                style: 'margin: 15px; background-color: white; padding: 5px;'
            }).inject(this.container);
        }

        this.lastValueViewer.set('text', JSON.stringify(value));
    },

    apply: function(form) {
        var code = this.code.getValue(), value = {};

        if (this.lastScript) {
            this.lastScript.destroy();
        }

        var script = this.lastScript = new Element('script');
        script.type = 'text/javascript';
        window._devFieldsDone = function() {
            value = window._devFields();

            if (window.localStorage) {
                window.localStorage.setItem('jarvesbundle_system_dev_fields', code);
            }

            delete this.lastValueViewer;
            this.container.empty();
            if (form) {
                this.field = new jarves.FieldForm(this.container, value);
            } else {
                this.field = new jarves.Field(value, this.container);
            }
        }.bind(this);

        var fn = 'window._devFields = function() {\nreturn ' + code + '; \n};window._devFieldsDone();';
        script.src  = 'data:text/javascript;charset=utf-8,'+escape(fn);
        script.inject(document.body);

    }

});