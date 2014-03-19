jarves.ContentTypes = jarves.ContentTypes || {};

jarves.ContentTypes.Html = new Class({

    Extends: jarves.ContentAbstract,
    Binds: ['applyValue'],

    Statics: {
        icon: 'icon-html5',
        label: 'HTML'
    },

    options: {

    },

    createLayout: function() {
        this.main = new Element('div', {
            'class': 'jarves-normalize jarves-content-plugin'
        }).inject(this.getContentInstance().getContentContainer());

        this.iconDiv = new Element('div', {
            'class': 'jarves-content-inner-icon icon-html5'
        }).inject(this.main);

        this.inner = new Element('div', {
            'class': 'jarves-content-inner jarves-normalize',
            text: 'HTML'
        }).inject(this.main);
    },

    selected: function(inspectorContainer) {
        var toolbarContainer = new Element('div', {
            'class': 'jarves-content-html-toolbarContainer'
        }).inject(inspectorContainer);

        this.openDialogBtn = new jarves.Button(t('Edit HTML')).setButtonStyle('blue').inject(toolbarContainer);

        this.openDialogBtn.addEvent('click', this.openDialog.bind(this));
    },

    openDialog: function() {
        var dialog = new jarves.Dialog(this.getWin(), {
            autoDisplay: true,
            withButtons: true,
            minWidth: '80%',
            mode: 'html',
            minHeight: '80%'
        });

        this.input = new jarves.Field({
            noWrapper: true,
            type: 'codemirror',
            onChange: function(value) {
                this.value = value;
            }.bind(this)
        }, dialog.getContentContainer());

        this.input.setValue(this.value);

        dialog.addEvent('apply', function() {
            this.value = this.input.getValue();
            delete this.input;
        }.bind(this));
    },

    setValue: function(pValue) {
        this.value = pValue;
        if (this.input) {
            this.input.setValue(pValue);
        }
    },

    getValue: function() {
        return this.value;
    }
});
