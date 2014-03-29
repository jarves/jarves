jarves.ContentTypes = jarves.ContentTypes || {};

jarves.ContentTypes.Tray = new Class({

    Extends: jarves.ContentAbstract,
    Binds: ['applyValue'],

    Statics: {
        icon: 'icon-clipboard-2',
        label: 'Tray'
    },

    options: {

    },

    createLayout: function () {
        this.main = new Element('div', {
            'class': 'jarves-normalize jarves-content-plugin'
        }).inject(this.getContentInstance().getContentContainer());

        this.inner = new Element('div', {
            'class': 'jarves-content-inner jarves-normalize'
        }).inject(this.main);
        this.inner.addEvent('click', function(e) {
            e.stop();
            this.getContentInstance().openInspector();
        }.bind(this));
    },

    renderValue: function () {
        this.inner.empty();
        if ('object' !== typeOf(this.value)) {
            this.value = {};
        }

        if (this.lastRenderedNode !== this.value.node || !this.value.node) {
            this.validNode = false;
            if (!this.value.node) {
                this.inner.set('text', t('Please choose a tray node.'));
                this.fireChange();
            } else {
                this.inner.set('text', 'Loading ...');
                jarves.getObjectLabel('jarves/node/' + this.value.node, function(label, item) {
                    if (false === label) {
                        this.inner.set('text', t('Tray not found.'));
                    } else {
                        if (3 === item.type) {
                            this.validNode = true;
                            this.inner.set('text', '» ' + label);
                        } else {
                            this.inner.set('text', t('Not a depot chosen.'));
                        }
                    }
                    this.fireChange();
                }.bind(this));
            }
        }

        this.lastRenderedNode = this.value.node;
    },

    /**
     * adds/loads all additional fields to the inspector.
     */
    initInspector: function(inspectorContainer) {
        var toolbarContainer = new Element('div', {
            'class': 'jarves-content-deposit-toolbarContainer'
        }).inject(inspectorContainer);

        this.nodeInput = new jarves.Field({
            'label': t('Tray'),
            type: 'page',
            width: 'auto',
            onChange: function(value){
                this.value.node = value;
                this.renderValue();
            }.bind(this)
        }, toolbarContainer);

        if (this.value && this.value.node) {
            this.nodeInput.setValue(this.value.node);
        }
    },

    isPreviewPossible: function() {
        return this.value && this.value.node && this.validNode;
    },

    openInspectorOnAdd: function() {
        return true;
    },

    setValue: function (pValue) {
        this.value = typeOf(pValue) !== 'string' ? pValue : JSON.decode(pValue);
        this.renderValue();
    },

    getValue: function () {
        return typeOf(this.value) == 'string' ? this.value : JSON.encode(this.value);
    }

});
