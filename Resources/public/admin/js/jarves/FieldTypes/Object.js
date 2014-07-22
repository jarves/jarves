jarves.FieldTypes.Object = new Class({

    Extends: jarves.FieldAbstract,

    Statics: {
        asModel: true,
        options: {
            object: {
                label: 'Object key',
                desc: 'Example: jarvesbundle:Node.',
                type: 'objectKey',
                required: true
            },
            'objectLabel': {
                needValue: 'object',
                label: t('Object label field (Optional)'),
                desc: t('The key of the field which should be used as label.')
            },
            asObjectUrl: {
                label: 'Value as object url',
                desc: 'Returns object:name://value instead of only the `value`.',
                type: 'checkbox',
                'default': false
            }
        },
        modelOptions: {
            object: {
                label: 'Object key',
                desc: 'Example: jarves/node.',
                type: 'objectKey',
                required: true
            },
            'objectLabel': {
                needValue: 'object',
                label: t('Object label field (Optional)'),
                desc: t('The key of the field which should be used as label.')
            },
            'objectRelation': {
                label: t('Relation'),
                needValue: 'object',
                type: 'select',
                required: true,
                items: {
                    'nTo1': 'Many to One (n-1)',
                    '1ToN': 'One to Many (-1)',
                    'nToM': 'Many to Many (n-n)'
                },
                children: {
                    objectRelationPhpName: {
                        type: 'text',
                        needValue: 'nToM',
                        label: t('PHP name of the middle-table'),
                        desc: t('Used only in n-to-n relations.')
                    },
                    objectRelationTable: {
                        type: 'text',
                        needValue: 'nToM',
                        label: t('Table name of the middle-table'),
                        desc: t('Used only in n-to-n relations.')
                    }
                }
            },
            'objectRefRelationName': {
                label: t('Reference name (Optional)'),
                desc: t('Name for the outgoing-relation in the foreign object to this object.')
            },
            'objectRelationOnDelete': {
                label: t('OnDelete method (Optional)'),
                type: 'select',
                'default': 'cascade',
                items: ['cascade', 'setnull', 'restrict', 'none']
            },
            'objectRelationOnUpdate': {
                label: t('OnUpdate method (Optional)'),
                type: 'select',
                'default': 'cascade',
                items: ['cascade', 'setnull', 'restrict', 'none']
            },
            'objectRelationWithConstraint': {
                label: t('With constraint'),
                type: 'checkbox',
                'default': 'true',
                desc: t('If the storage backend should also create a constraint so its not possible to pass a invalid reference id.')
            }
        }
    },

    options: {
        object: null,
        objects: null,
        asObjectUrl: false,
        combobox: false
    },

    /**
     * Current object id/value.
     *
     * @var {*}
     */
    objectId: null,

    createLayout: function () {

        if (typeOf(this.options.object) == 'string') {
            this.options.objects = [this.options.object];
        }

        if (!this.options.objects || (typeOf(this.options.objects) == 'array' && this.options.objects.length == 0)) {
            //add all objects
            this.options.objects = [];

            Object.each(jarves.settings.configs, function (config, key) {
                if (config.objects) {
                    Object.each(config.objects, function (object, objectKey) {
                        this.options.objects.push(key + '\\' + objectKey);
                    }.bind(this));
                }
            }.bind(this));
        }

        var definition = jarves.getObjectDefinition(this.options.objects[0]);

        if (!definition) {
            this.fieldInstance.fieldPanel.set('text', t('Object not found %s').replace('%s', this.options.objects[0]));
            throw 'Object not found ' + this.options.objects[0];
        }

        if (definition.chooserFieldJavascriptClass) {
            var clazz = jarves.getClass(definition.chooserFieldJavascriptClass);
            if (!clazz) {
                throw 'Can no load custom object field class "' + definition.chooserFieldJavascriptClass +
                    '" for object ' + this.options.objects[0];
            }

            this.customObj = new clazz(this.field, this.fieldInstance.fieldPanel, this);

            this.customObj.addEvent('change', function () {
                this.fireChange();
            }.bind(this));

            this.setValue = this.customObj.setValue.bind(this.customObj);
            this.getValue = this.customObj.getValue.bind(this.customObj);
            this.isOk = this.customObj.isEmpty.bind(this.customObj);
            this.highlight = this.customObj.highlight.bind(this.customObj);

        } else {
            if (this.options.objectRelation == 'nToM' || this.options.multi == 1) {
                this.renderChooserMulti(this.options.objects);
            } else {
                this.renderChooserSingle(this.options.objects);
            }
        }
    },

    renderObjectTableNoItems: function () {

        var tr = new Element('tr').inject(this.chooserTable.tableBody);
        new Element('td', {
            colspan: this.renderChooserColumns.length,
            style: 'text-align: center; color: gray; padding: 5px;',
            text: t('Empty')
        }).inject(tr);
    },

    renderObjectTable: function () {
        this.chooserTable.empty();

        this.objectTableLoaderQueue = {};

        if (!this.objectId || this.objectId.length == 0) {
            this.renderObjectTableNoItems();
        } else {
            Array.each(this.objectId, function (id) {

                var row = [];

                var placeHolder = new Element('span');
                row.include(placeHolder);

                jarves.getObjectLabel(jarves.getObjectUrl(this.options.object, id), function (label) {
                    placeHolder.set('html', label);
                });

                var actionBar = new Element('div');

                var remoteIcon = new Element('a', {
                    'class': 'text-button-icon icon-remove-3',
                    href: 'javascript:;',
                    title: t('Remove')
                }).inject(actionBar);

                row.include(actionBar);

                var tr = this.chooserTable.addRow(row);
                remoteIcon.addEvent('click', function () {
                    tr.destroy();
                    this.updateThisValue();
                }.bind(this));

                tr.kaFieldObjectId = id;

            }.bind(this));
        }
    },

    updateThisValue: function () {

        var rows = this.chooserTable.getRows();

        this.objectId = [];
        Array.each(rows, function (row) {
            this.objectId.push(row.kaFieldObjectId);
        }.bind(this));

    },

    renderChooserSingle: function () {
        var table = new Element('table', {
            style: 'width: 100%', cellpadding: 0, cellspacing: 0
        }).inject(this.fieldInstance.fieldPanel);

        var tbody = new Element('tbody').inject(table);

        var tr = new Element('tr').inject(tbody);
        var leftTd = new Element('td').inject(tr);
        var rightTd = new Element('td', {width: '50px'}).inject(tr);

        this.field = new jarves.Field({
            noWrapper: true
        }, leftTd);

        this.input = this.field.getFieldObject().input;
        this.input.addClass('jarves-Input-text-disabled');
        this.input.disabled = true;

        if (this.options.combobox) {
            this.input.disabled = false;
            this.input.addEvent('focus', function () {
                this.input.removeClass('jarves-Input-text-disabled');
                this._lastValue = this.input.value;

                if (this.objectId) {
                    this.lastObjectLabel = this.input.value;
                    this.lastObjectId = this.objectId;
                }
            }.bind(this));

            var checkChange = function () {
                if (this.input.value == this.lastObjectLabel) {
                    this.objectId = this.lastObjectId;
                    this.input.addClass('jarves-Input-text-disabled');
                    return;
                }

                if (typeOf(this._lastValue) != 'null' && this.input.value != this._lastValue) {
                    //changed it, so we delete this.objectValue since its now a custom value
                    delete this.objectId;
                    this.input.removeClass('jarves-Input-text-disabled');
                } else if (this.objectId) {
                    this.input.addClass('jarves-Input-text-disabled');
                }
            }.bind(this);

            this.input.addEvent('keyup', checkChange);
            this.input.addEvent('change', checkChange);
            this.input.addEvent('blur', checkChange);
        }

        if (this.options.inputWidth) {
            this.input.setStyle('width', this.options.inputWidth);
        }

        var div = new Element('span').inject(this.fieldInstance.fieldPanel);

        var chooserParams = {
            onSelect: function (url) {
                this.setValue(url, true);
            }.bind(this),
            value: this.objectId,
            cookie: this.options.cookie,
            objects: this.options.objects,
            browserOptions: this.options.browserOptions
        };

        if (this.objectId) {
            chooserParams.value = this.objectId;
        }

        if (this.options.cookie) {
            chooserParams.cookie = this.options.cookie;
        }

        if (this.options.domain) {
            chooserParams.domain = this.options.domain;
        }

        var button = new jarves.Button(t('Choose'))
            .addEvent('click', function () {
            if (this.options.designMode) {
                return;
            }
            jarves.wm.openWindow('jarvesbundle/backend/chooser', null, -1, chooserParams, true);
        }.bind(this))
        .inject(rightTd);

        this.setValue = function (value, internal) {
            if (typeOf(value) == 'null' || value === false || value === '' || !jarves.getCroppedObjectId(value)) {
                this.objectId = '';
                this.input.value = '';
                this.input.title = '';
                return;
            }


            value = String.from(value);

            this.objectId = value;
            if ((typeOf(value) == 'string' && value.substr(0, 'object://'.length) != 'object://')) {
                this.objectId = 'object://' + jarves.normalizeObjectKey(this.options.objects[0]) + '/' + jarves.urlEncode(value);
            }

            jarves.getObjectLabel(this.objectId, function (label) {
                if (label === false) {
                    this.input.removeClass('jarves-Input-text-disabled');
                    if (!this.options.combobox) {
                        this.input.value = '[Not Found]: ' + value;
                    } else {
                        this.input.value = value;
                    }
                    delete this.objectId;
                } else {
                    this.input.value = label;
                    this.input.addClass('jarves-Input-text-disabled');
                }
            }.bind(this));

            this.input.title = jarves.urlDecode(jarves.getCroppedObjectId(value));
            if (internal) {
                this.fireChange();
            }
        };

        this.getValue = function () {
            if (!this.objectId) {
                return this.input.value;
            }

            var val = this.objectId;

            if (!this.options.asObjectUrl && typeOf(val) == 'string' && val.substr(0, 'object://'.length) == 'object://') {
                return jarves.getObjectIdFromUrl(val);
            }
            return val;
        }
    },

    renderChooserMulti: function () {

        this.renderChooserColumns = [];

        this.objectDefinition = jarves.getObjectDefinition(this.options.objects[0]);

        this.renderChooserColumns.include([""]);
        this.renderChooserColumns.include(["", 50]);

        this.chooserTable = new jarves.Table(this.renderChooserColumns, {absolute: false, selectable: false});

        this.chooserTable.inject(this.fieldInstance.fieldPanel);
        this.renderObjectTableNoItems();

        //compatibility
        if (this.options.domain) {
            if (!this.options.browserOptions) {
                this.options.browserOptions = {};
            }
            if (!this.options.browserOptions.node) {
                this.options.browserOptions.node = {};
            }
            this.options.browserOptions.node.domain = this.options.domain;
        }

        var chooserParams = {
            onSelect: function (internalUri) {
                if (!this.objectId) {
                    this.objectId = [];
                }

                this.objectId.include(jarves.getObjectIdFromUrl(internalUri));
                this.renderObjectTable();
            }.bind(this),
            value: this.objectId,
            cookie: this.options.cookie,
            objects: this.options.objects,
            browserOptions: this.options.browserOptions
        };

        if (this.objectId) {
            chooserParams.value = this.objectId;
        }

        if (this.options.cookie) {
            chooserParams.cookie = this.options.cookie;
        }

        if (this.options.domain) {
            chooserParams.domain = this.options.domain;
        }

        var button = new jarves.Button([t('Add'), '#icon-plus-5']).addEvent('click', function () {

            if (this.options.designMode) {
                return;
            }
            jarves.wm.open('jarvesbundle/backend/chooser', chooserParams, -1, true);

        }.bind(this));

        this.actionBar = new Element('div', {
            'class': 'jarves-ActionBar'
        }).inject(this.fieldInstance.fieldPanel);

        button.inject(this.actionBar);

        this.setValue = function (value) {
            this.objectId = [];

            Array.each(value, function(v) {
                if ('object' === typeOf(v)) {
                    v = jarves.getObjectUrlId(this.options.objects[0], v);
                }

                this.objectId.push(String.from(v));
            }.bind(this));

            this.renderObjectTable();

        }.bind(this);

        this.getValue = function () {
            return this.objectId;
        };

    }

});