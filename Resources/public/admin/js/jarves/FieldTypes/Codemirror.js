jarves.FieldTypes.Codemirror = new Class({

    Extends: jarves.FieldAbstract,

    Statics: {
        isModel: true
    },

    options: {
        inputHeight: 'auto',
        mode: null
    },

    createLayout: function () {

        this.editorPanel = new Element('div', {
            'class': 'jarves-Field-Codemirror'
        }).inject(this.fieldInstance.fieldPanel);

        if (this.options.inputWidth) {
            this.editorPanel.setStyle('width', this.options.inputWidth);
        }

        if (this.options.inputHeight) {

            var cssClassName = 'codemirror_' + (new Date()).getTime() + '_' + Number.random(0, 10000) + '_' +
                Number.random(0, 10000);

            if (typeOf(this.options.inputHeight) == 'number' || !this.options.inputHeight.match('[^0-9]')) {
                this.options.inputHeight += 'px';
            }

            new Stylesheet().addRule('.' + cssClassName + ' .CodeMirror-scroll, .' + cssClassName + ' .CodeMirror', {
                height: this.options.inputHeight
            });

            this.editorPanel.addClass(cssClassName);
            this.editorPanel.setStyle('height', this.options.inputHeight);

        }

        var options = {
            lineNumbers: true,
            mode: this.options.mode || 'htmlmixed',
            value: '',
            styleActiveLine: true
            //onChange: this.fieldInstance.fireChange
        };

        if (this.options.codemirrorOptions) {
            Object.each(this.options.codemirrorOptions, function (value, key) {
                options[key] = value;
            });
        }
        this.editor = new CodeMirror(this.editorPanel, options);

        CodeMirror.modeURL = _path + 'bundles/jarves/codemirror/mode/%N/%N.js';
        this.editor.setOption("mode", options.mode);
        CodeMirror.autoLoadMode(this.editor, options.mode);

        var refresh = function () {
            this.editor.refresh();
        }.bind(this);

        var windowInstance = this.fieldInstance.fieldPanel.getParent('.kwindow-border');
        if (this.win) {
            this.win.addEvent('resize', refresh);
        } else if (windowInstance) {
            this.win.windowInstance.addEvent('resize', refresh);
        }

        var tabPane = this.fieldInstance.fieldPanel.getParent('.jarves-tabPane-pane');
        if (tabPane) {
            tabPane.button.addEvent('show', refresh);
        }

        this.addEvent('show', refresh);
    },

    setValue: function (pValue) {
        this.editor.setValue(pValue ? pValue : "");
    },

    getValue: function () {
        return this.editor.getValue();
    }
});