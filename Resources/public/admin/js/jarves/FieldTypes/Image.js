jarves.FieldTypes.Image = new Class({

    Extends: jarves.FieldAbstract,

    Statics: {
        asModel: true,
        options: {
            returnPath: {
                label: 'Return the path',
                desc: 'Instead of the object id',
                type: 'checkbox',
                'default': false
            },
            onlyLocal: {
                label: 'Only local files',
                type: 'checkbox',
                'default': false
            },
            imageWidth: {
                label: t('Image preview width in px'),
                type: 'number',
                'default': '150'
            }
        }
    },

    options: {
        returnPath: true,
        onlyLocal: false,
        imageWidth: '150'
    },

    createLayout: function (container) {

        this.table = new Element('table', {
            width: '100%'
        });
        this.tr = new Element('tr').inject(this.table);
        this.imageContainer = new Element('td').inject(this.tr);
        this.buttonContainer = new Element('td').inject(this.tr);

        this.chooserButton = new jarves.Button(t('Choose')).inject(this.buttonContainer);
        this.chooserButton.addEvent('click', function(){
            var chooserParams = {
                onSelect: function (value) {
                    this.setValue(value);
                }.bind(this),
                value: this.value,
                objects: ['jarves/file']
            };

            jarves.wm.openWindow('jarvesbundle/backend/chooser', null, -1, chooserParams, true);
        }.bind(this));

        this.table.inject(container);
    },

    setValue: function(value) {
        this.value = value;

        if (this.image) {
            this.image.destroy();
        }
        this.imageContainer.set('html');

        if (!value) {
            this.imageContainer.set('text', t('No image chosen'));
            return;
        }

        var path = _pathAdmin + 'admin/file/preview?' + Object.toQueryString({
            path: value,
            width: this.options.imageWidth
        });

        this.image = new Element('img', {
            width: this.options.imageWidth,
            src: path
        }).inject(this.imageContainer);
    },

    getValue: function() {
        return this.value;
    }

});
