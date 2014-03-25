jarves.ContentTypes = jarves.ContentTypes || {};

jarves.ContentTypes.Image = new Class({

    Extends: jarves.ContentAbstract,

    Statics: {
        icon: 'icon-images',
        label: 'Image',
        mimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif']
    },

    value: {},

    options: {

    },

    createLayout: function() {
        this.main = new Element('div', {
            'class': 'jarves-contentType-image'
        }).inject(this.getContentInstance().getContentContainer());

        if (this.getContentInstance().drop && jarves.ContentTypes.Image.mimeTypes.contains(this.getContentInstance().drop.type)) {
            this.renderDrop(this.getContentInstance().drop);
        } else {
            this.renderChooser();
        }

        this.main.addEventListener('dragover', function(event) {
            var validDrop = true;
            if (validDrop) {
                event.stopPropagation();
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
            }
        }.bind(this));

        this.main.addEventListener('drop', function(event) {
            var items = event.dataTransfer.files.length > 0 ? event.dataTransfer.files : null;

            if (!items && event.dataTransfer.types) {
                items = [];
                Array.each(event.dataTransfer.types, function(type) {
                    var dataType = event.dataTransfer.getData(type);
                    items.push({
                        type: type,
                        getAsString: function(cb) {
                            cb(dataType);
                        }
                    });
                });
            }

            if (0 < items.length) {
                event.stopPropagation();
                event.preventDefault();
                this.renderDrop(items[0]);
            }
        }.bind(this));
    },

    renderDrop: function(file) {
        this.file = file;
        var reader = new FileReader();

        reader.onload = function(e) {
            this.main.empty();
            this.image = new Element('img', {
                src: e.target.result,
                styles: {
                    'width': this.value.width || '100%'
                }
            }).inject(this.main);
            this.value.image = e.target.result;
            delete this.currentImageFile;
        }.bind(this);

        this.main.set('text', t('Reading ...'));

        this.progressBar = new Element('div', {
            text: '0%',
            styles: {
                textAlign: 'center'
            }
        }).inject(this.main);

        reader.onprogress = function(e) {
            var percentLoaded = Math.round((e.loaded / e.total) * 100);
            this.progressBar.set('text', percentLoaded + '%');
        }.bind(this);

        reader.readAsDataURL(this.file);
    },

    renderValue: function() {
        if (this.value.file || this.value.image) {
            if (this.currentImageFile !== this.value.file) {
                this.main.empty();
                var url = _pathAdmin + 'admin/file/image?' + Object.toQueryString({
                    path: this.value.file
                });
                this.image = new Element('img', {
                    src: this.value.image || url
                }).inject(this.main);
            }
            this.image.set('width', this.value.width || '100%');
            this.main.set('class', 'jarves-contentType-image align-' + (this.value.align || 'center'));
            this.currentImageFile = this.value.file;
        } else {
            this.renderChooser();
        }
    },

    setValue: function(value) {
        if ('string' === typeOf(value)) {
            try {
                value = JSON.decode(value);
            } catch(e) {
                value = {};
            }
        }
        if ('object' !== typeOf(value)) {
            value = {};
        }

        this.value = value || {};
        this.renderValue();
    },

    getValue: function() {
        return this.value;
    },

    /**
     *
     * @param {jarves.ProgressWatch} progressWatch
     */
    save: function(progressWatch) {
        progressWatch.setProgressRange(100);

        if (!this.value.width) {
            this.value.width = '100%';
        }

        if (this.file && !this.fileWatcher) {
            this.file.target = '/Unclassified/';
            this.file.autoRename = true;
            this.file.html5 = true;
            var newPath = '';

            delete this.value.image;
            this.fileWatcher = jarves.getAdminInterface().getFileUploader().newFileUpload(this.file);
            this.fileWatcher.addEvent('done', function() {
                this.value.file = newPath;
                this.fireChange();
                progressWatch.done(JSON.encode(this.value));
            }.bind(this));
            this.fileWatcher.addEvent('progress', function(progress) {
                progressWatch.progress(progress);
            });
            this.fileWatcher.addEvent('cancel', function() {
                progressWatch.cancel();
            });
            this.fileWatcher.addEvent('rename', function(name) {
                newPath = this.file.target + name;
            });
            this.fileWatcher.addEvent('error', function() {
                progressWatch.error();
            });
        } else {
            progressWatch.done(JSON.encode(this.value));
        }
    },

    stopSaving: function() {
        if (this.fileWatcher) {
            this.fileWatcher.cancel();
        }
    },

    renderChooser: function() {
        this.main.empty();
        this.iconDiv = new Element('div', {
            'class': 'jarves-content-inner-icon icon-images'
        }).inject(this.main);

        this.inner = new Element('div', {
            'class': 'jarves-content-inner jarves-normalize',
            text: t('Choose or drop a image.')
        }).inject(this.main);
    },

    initInspector: function(inspectorContainer) {
        var toolbarContainer = new Element('div', {
            'class': 'jarves-content-image-toolbarContainer'
        }).inject(inspectorContainer);

        var form = new jarves.FieldForm(toolbarContainer, {
            file: {
                label: 'Image',
                type: 'object',
                object: 'jarvesbundle:file',
                width: 'auto',
                browserOptions: {
                    selectionOnlyFiles: true
                }
            },

            align: {
                label: 'Align',
                type: 'select',
                items: {
                    left: tc('Align', 'Left'),
                    center: tc('Align', 'Center'),
                    right: tc('Align', 'Right')
                },
                width: 'auto',
                'default': 'center'
            },

            width: {
                label: 'Width',
                type: 'text',
                width: 'auto',
                'default': '100%'
            },

            link: {
                label: 'Link',
                type: 'object',
                width: 'auto',
                options: {
                    combobox: true
                }
            }
        }, {
            onChange: function(values) {
                if (values.file != this.value.file) {
                    this.value.file = values.file;
                }
                this.value.width = values.width;
                this.value.align = values.align;
                this.fireChange();
                this.renderValue();
            }.bind(this)
        });

        form.setValue(this.value);
    }
});