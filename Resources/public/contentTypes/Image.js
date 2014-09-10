jarves.ContentTypes = jarves.ContentTypes || {};

jarves.ContentTypesImageFiles = {};

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

        this.main.addEvent('click', function(e){
            e.stop();
            this.getContentInstance().openInspector();
        }.bind(this));
    },

    getFile: function() {
        return jarves.ContentTypesImageFiles[this.getId()];
    },

    removeFile: function() {
        jarves.ContentTypesImageFiles[this.getId()] = null;
    },

    renderDrop: function(file) {
        jarves.ContentTypesImageFiles[this.getId()] = file;
        this.renderValue();
    },

    renderValue: function() {
        this.main.setStyle('height', this.main.getSize().y);
        if (this.getFile()) {
            var reader = new FileReader();
            reader.onload = function(e) {
                this.main.empty();
                this.image = new Element('img', {
                    src: e.target.result,
                    styles: {
                        'width': this.value.width || '100%'
                    }
                }).inject(this.main);
                this.main.set('class', 'jarves-contentType-image align-' + (this.value.align || 'center'));
                delete this.currentImageFile;
                this.main.setStyle.delay(50, this.main, ['height']);
            }.bind(this);
//
//            this.progressBar = new Element('div', {
//                text: '0%',
//                styles: {
//                    textAlign: 'center'
//                }
//            }).inject(this.main);

//            reader.onprogress = function(e) {
//                var percentLoaded = Math.round((e.loaded / e.total) * 100);
//                this.progressBar.set('text', percentLoaded + '%');
//            }.bind(this);

            reader.readAsDataURL(this.getFile());
        } else if (this.value.file) {
            if (this.currentImageFile !== this.value.file) {
                this.main.empty();
                var url = baseRestUrl + 'admin/file/image?' + Object.toQueryString({
                    path: this.value.file
                });
                this.image = new Element('img', {
                    src: url
                }).inject(this.main);
            }
            this.image.set('width', this.value.width || '100%');
            this.main.set('class', 'jarves-contentType-image align-' + (this.value.align || 'center'));
            this.currentImageFile = this.value.file;
            this.main.setStyle.delay(50, this.main, ['height']);
        } else {
            this.renderChooser();
            this.main.setStyle('height');
        }
    },

    isPreviewPossible: function() {
        return false;
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

        if (this.value.hasFileAttached) {
            jarves.ContentTypesImageFiles[this.getId()] = jarves.ContentTypesImageFiles[this.value.hasFileAttached];
            delete this.value.hasFileAttached;
        }

        this.renderValue();
    },

    getValue: function() {
        if (this.getFile()) {
            this.value.hasFileAttached = this.getId();
        }

        console.log('iamge get Value', JSON.encode(this.value));
        return JSON.encode(this.value);
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

        var file = this.getFile();

        if (file && !this.fileWatcher) {
            file.target = '/Unclassified/';
            file.autoRename = true;
            file.html5 = true;
            var newPath = file.target + file.name;

            this.fileWatcher = jarves.getAdminInterface().getFileUploader().newFileUpload(file);
            this.fileWatcher.addEvent('done', function() {
                this.value.file = newPath;
                delete this.value.hasFileAttached;
                this.removeFile();
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
                newPath = this.getFile().target + name;
            }.bind(this));
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
        this.inner = new Element('div', {
            'class': 'jarves-content-inner jarves-normalize',
            text: t('Choose or drop a image.')
        }).inject(this.main);
        this.inner.addEvent('click', function(e) {
            e.stop();
            this.getContentInstance().openInspector();
        }.bind(this));
    },

    initInspector: function(inspectorContainer) {
        var toolbarContainer = new Element('div', {
            'class': 'jarves-content-image-toolbarContainer'
        }).inject(inspectorContainer);

        var form = new jarves.FieldForm(toolbarContainer, {
            file: {
                label: 'Image',
                type: 'object',
                object: 'jarves/file',
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
                    console.log('change', values.file);
                    this.value.file = values.file;
                    if (this.value.file) {
                        this.removeFile();
                    }
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