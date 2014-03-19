jarves.FieldTypes.Html = new Class({

    Extends: jarves.FieldAbstract,

    container: null,

    Statics: {
        options: {
            iframe: {
                label: 'As iFrame',
                'default': false,
                type: 'checkbox'
            }
        }
    },

    createLayout: function () {
        this.infoLabel = new Element(this.options.iframe ? 'iframe' : 'div', {
            'class': 'jarves-Field-info'
        }).inject(this.getContainer());
    },

    setValue: function (pValue) {
        this.infoLabel.empty();
        if (!['string', 'number'].contains(typeOf(pValue))) {
            return;
        }
        console.log(this.infoLabel.contentDocument);
        if (this.options.iframe) {
            this.infoLabel.contentDocument.body.innerHTML = pValue;
        } else {
            this.infoLabel.set('html', pValue);
        }
    },

    getValue: function () {
        if (this.options.iframe) {
            return this.infoLabel.contentDocument.body.innerHTML;
        } else {
            return this.infoLabel.get('html');
        }
    }
});
