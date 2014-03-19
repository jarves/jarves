jarves.FieldTypes.ChildrenSwitcher = new Class({

    Extends: jarves.FieldAbstract,

    createLayout: function () {
        this.fieldInstance.title.empty();

        this.toggler = new Element('a', {
            text: this.options.label,
            'class': 'icon-arrow-19',
            style: 'display: block; padding: 2px; cursor: pointer; position: relative; left: -5px;'
        }).inject(this.fieldInstance.title);

        this.fieldInstance.handleChildsMySelf = true;

        this.toggler.addEvent('click', function () {
            this.setValue(!this.getValue());
            this.fieldInstance.fireChange();
        }.bind(this));

        this.value = this.options.value || this.options['default'] || false;

        this.fieldInstance.addEvent('check-depends', function () {
            this.setValue(this.value);
        }.bind(this));

        this.fieldInstance.addEvent('childrenPrepared', function () {
            this.setValue(this.value);
        }.bind(this));
    },

    setValue: function (pValue) {
        if (typeOf(pValue) == 'null') {
            return;
        }

        this.value = pValue ? true : false;

        if (!this.fieldInstance.getChildrenContainer()) {
            return;
        }

        if (!this.value) {
            this.fieldInstance.getChildrenContainer().setStyle('display', 'none');
            this.toggler.set('class', 'icon-arrow-19');
        } else {
            this.fieldInstance.getChildrenContainer().setStyle('display', 'block');
            this.toggler.set('class', 'icon-arrow-17');
        }
    },

    getValue: function () {
        return this.value;
    }
});