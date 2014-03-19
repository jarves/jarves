var jarves_system_module_editWindow = new Class({

    Binds: ['applyFieldProperties'],

    newCode: {}, //for class methods, code after modifing
    customCode: {}, //for class methods, presaved code

    customMethods: {}, //for custom methods
    customMethodItems: {}, //ref to <a> element of the custom method list

    initialize: function (pWin) {

        this.win = pWin;

        this._createLayout();
    },

    _createLayout: function () {

        this.win.getTitleGroupContainer().setStyle('text-align', 'right');
        this.saveBtn = new jarves.Button(t('Save'), this.save.bind(this)).inject(this.win.getTitleGroupContainer());
        this.saveBtn.setButtonStyle('blue');

        this.tabPane = new jarves.TabPane(this.win.content, true);

        this.generalTab = this.tabPane.addPane(t('General'));

        this.windowTabEdit = this.tabPane.addPane(t('Edit/Add'));
        this.windowTabAdd = this.tabPane.addPane(tc('systemModuleEditWindowTab', 'Add extras'));
        this.windowTabList = this.tabPane.addPane(t('List/Combine'));

        this.methodTab = this.tabPane.addPane(t('Class methods'));
        this.customMethodTab = this.tabPane.addPane(t('Custom methods'));

        //this.windowTabList.hide();

        var generalFields = {
            'class': {
                label: t('Class name'),
                children: {
                    file: {
                        label: t('File')
                    }
                }
            },
            object: {
                needValue: 'object',
                label: t('Object key'),
                type: 'objectKey',
                onChange: function () {
                    this.objectKeyChanged();
                }.bind(this)
            },
            preview: {
                label: t('Preview possibility'),
                desc: t('Requires defined views/plugins at the object'),
                type: 'checkbox'
            },

            titleField: {
                label: t('Window title field (Optional)'),
                needValue: 'adminWindowEdit',
                desc: t('Defines which field the window should use for his title.')
            },

            workspace: {
                label: t('Workspace'),
                type: 'checkbox',
                help: 'admin/extensions-object-workspace'
            },

            multiLanguage: {
                label: t('Multilingual'),
                type: 'checkbox',
                desc: t("The windows gets then a language chooser on the right top bar. The object or table needs a extra field 'lang' for this.")
            },

            multiDomain: {
                label: t('Multi domain'),
                type: 'checkbox',
                desc: t("Useful, when these objects are categorized usually under domains. The windows gets then a domain chooser on the right top bar. The object or table needs a extra field 'domain_id' for this.")
            }

        };
        var table = new Element('table', {width: '100%'}).inject(this.generalTab.pane);
        this.generalTbody = new Element('tbody').inject(table);

        this.generalObj = new jarves.FieldForm(this.generalTbody, generalFields,
            {allTableItems: true, tableItemLabelWidth: 250, withEmptyFields: false},
            {win: this.win});

        //window
        this.windowPane = new Element('div', {
            'class': 'jarves-system-module-editWindow-windowPane'
        }).inject(this.windowTabEdit.pane);

        this.actionBar = new Element('div', {
            'class': 'jarves-system-module-editWindow-actionbar jarves-ActionBar jarves-ActionBar-left'
        }).inject(this.windowTabEdit.pane);

        this.windowEditAddTabBtn = new jarves.Button(t('Add tab'))
            .addEvent('click', function () {

                var dialog = this.win.newDialog(new Element('b', {text: t('New Tab')}));
                dialog.setStyle('width', 400);

                var d = new Element('div', {
                    style: 'padding: 5px 0px;'
                }).inject(dialog.content);

                var table = new Element('table', {width: '100%'}).inject(d);
                var tbody = new Element('tbody').inject(table);

                tr = new Element('tr').inject(tbody);
                new Element('td', {text: t('Label:')}).inject(tr);
                td = new Element('td', {'style': 'width: 225px'}).inject(tr);
                var iLabel = new Element('input', {'class': 'text'}).inject(td);

                tr = new Element('tr').inject(tbody);
                new Element('td', {text: t('Key:')}).inject(tr);
                var td = new Element('td').inject(tr);
                var iId = new Element('input', {'class': 'text'}).inject(td);

                var oldLabel = '';
                var getId = function (pLabel) {
                    return '__' + (pLabel || iLabel.value).replace(/\W/, '-').replace(/--+/, '-') + '__';
                };

                var onChange = function () {
                    if (oldLabel == '' || iId.value == getId(oldLabel)) {
                        iId.value = getId();
                    }
                    if (this.value == '') {
                        iId.value = '';
                    }
                    oldLabel = this.value;
                };

                iLabel.addEvent('change', onChange);
                iLabel.addEvent('keyup', onChange);

                iLabel.focus();

                new jarves.Button(t('Cancel'))
                    .addEvent('click', function () {
                        dialog.close();
                    })
                    .inject(dialog.bottom);

                new jarves.Button(t('Apply'))
                    .addEvent('click', function () {

                        if (iId.value.substr(0, 2) != '__') {
                            iId.value = '__' + iId.value;
                        }

                        if (iId.value.substr(iId.value.length - 2) != '__') {
                            iId.value += '__';
                        }

                        this.addWindowEditTab(iId.value, {label: iLabel.value, type: 'tab'});
                        dialog.close();

                    }.bind(this))
                    .setButtonStyle('blue')
                    .inject(dialog.bottom);

                dialog.center();

            }.bind(this))
            .inject(this.actionBar);

        this.windowEditAddFieldBtn = new jarves.Button(t('Add custom field'))
            .addEvent('click', function () {

                var currentTab = this.winTabPane.getSelected();

                var items = currentTab.pane.fieldContainer.getChildren();

                this.addWindowEditField(currentTab,
                    'field_' + (items.length + 1), {type: 'text', label: 'Field ' + (items.length + 1)});

            }.bind(this))
            .inject(this.actionBar);

        var select;

        this.windowEditAddPredefinedFieldBtn = new jarves.Button(t('Add predefined object field'))
            .addEvent('click', function () {

                var currentTab = this.winTabPane.getSelected();
                if (!currentTab) {
                    return;
                }

                var dialog = this.win.newDialog(new Element('b', {text: t('Add predefined object field')}));
                dialog.setStyle('width', 400);

                var d = new Element('div', {
                    style: 'padding: 5px 0px;'
                }).inject(dialog.content);

                var table = new Element('table').inject(d);
                var tbody = new Element('tbody').inject(table);

                var tr = new Element('tr').inject(tbody);

                var object = this.generalObj.getValue('object');

                if (!object) {
                    new Element('td',
                        {colspan: 2, text: t('Please define first the object key under General.')}).inject(tr);
                } else {

                    var definition = jarves.getObjectDefinition(object);

                    if (!definition) {
                        new Element('td',
                            {colspan: 2, text: t('Can not find the object definition of %s.').replace('%s',
                                object)}).inject(tr);
                    } else {
                        new Element('td', {text: t('Object field:')}).inject(tr);
                        var td = new Element('td').inject(tr);
                        select = new jarves.Select();

                        Object.each(definition.fields, function (field, key) {

                            select.add(key, field.label ? field.label : key);

                        });

                        select.inject(td);
                    }
                }

                new jarves.Button(t('Cancel'))
                    .addEvent('click', function () {
                        dialog.close();
                    })
                    .inject(dialog.bottom);

                if (select) {
                    new jarves.Button(t('Apply'))
                        .addEvent('click', function () {

                            var currentTab = this.winTabPane.getSelected();

                            var items = currentTab.pane.fieldContainer.getChildren();

                            this.addWindowEditField(currentTab,
                                select.getValue(), {
                                    type: 'predefined',
                                    object: this.generalObj.getValue('object'),
                                    field: select.getValue()
                                }, true);

                            dialog.close();
                        }.bind(this))
                        .inject(dialog.bottom);
                }

                dialog.center();

            }.bind(this))
            .inject(this.actionBar);

        this.windowInspector = new Element('div', {
            'class': 'jarves-system-module-editWindow-windowInspector'
        }).inject(this.windowTabEdit.pane);

        new Element('h3', {
            text: t('Inspector'),
            'class': 'jarves-system-module-editWindow-windowInspector-header'
        }).inject(this.windowInspector);

        this.windowInspectorContainer = new Element('div', {
            'class': 'jarves-system-module-editWindow-windowInspector-content'
        }).inject(this.windowInspector);

        /*************************
         *
         * Add extras
         */

        var addFields = {


            nestedAddWithPositionSelection: {
                type: 'checkbox',
                label: t('With position selection'),
                'default': true,
                desc: t('This allows the user to choose a position where the item gets inserted.')
            },

            addMultiple: {
                type: 'checkbox',
                label: t('Activates mass insertion in the add form'),
                'default': false,
                'children': {

                    addMultipleFieldContainerWidth: {
                        label: t('Field container width'),
                        type: 'text',
                        'default': '70%'
                    },
                    addMultipleFixedFields: {
                        label: t('Fields for all items'),
                        type: 'fieldTable',
                        tableItem: false,
                        width: 'auto',
                        arrayKey: true
                    },

                    addMultipleFields: {
                        label: t('Fields per item'),
                        type: 'fieldTable',
                        tableItem: false,
                        arrayKey: true,
                        width: 'auto',
                        withWidth: true
                    }

                }
            }


        };

        table = new Element('table', {width: '100%', style: 'table-layout: fixed;'}).inject(this.windowTabAdd.pane);
        this.windowAddTbody = new Element('tbody').inject(table);

        this.windowAddObj = new jarves.FieldForm(this.windowAddTbody, addFields, {allTableItems: 1, withEmptyFields: false},
            {win: this.win});

        /*************************
         *
         * list/combine
         *
         **************************/

        var listFields = {

            columns: {

                label: t('Select columns'),
                type: 'fieldTable',
                asFrameworkColumn: true,
                withoutChildren: true,
                tableItem: false,
                addLabel: t('Add column')

            },

            __combine__: {
                type: 'label',
                label: t('Combine view'),
                children: {

                    itemLayout: {
                        label: t('Item layout (Optional)'),
                        desc: t('Default behaviour is that the system extracts the first three columns and build it on its own. You can define here your own item HTML.') +
                            '<br/>' + t('Example:') + '<br/>' +
                            '&lt;h2&gt;{title}&lt;/h2&gt;<br/>' +
                            '&lt;div style="font-size: 10px;"&gt;{anotherFieldName}&lt;/div&gt;',
                        type: 'codemirror',
                        inputHeight: 80
                    }

                }
            },

            defaultLimit: {

                label: t('Default limit (Items per page)'),
                type: 'number',
                inputWidth: 120

            },

            asNested: {

                label: t('As nested set'),
                type: 'checkbox',
                'default': false,
                desc: t('Shows then the tree instead of a list.')

            },

            order: {

                label: t('Default order'),
                type: 'array',
                columns: [
                    {label: t('Field'), width: '60%'},
                    {label: t('Direction')}
                ],
                withOrder: true,
                asHash: true,
                fields: {
                    field: {
                        type: 'text'
                    },
                    direction: {
                        type: 'select',
                        items: {
                            asc: 'ASC',
                            desc: 'DESC'
                        }
                    }
                }

            },

            __search__: {
                type: 'childrenSwitcher',
                label: 'Search',
                children: {
                    __search__kind__: {
                        type: 'select',
                        inputWidth: 150,
                        label: t('Definition'),
                        items: {
                            quick: t('Quickdefinition from defined columns'),
                            custom: t('Complete custom fields')
                        },
                        children: {
                            filter: {
                                type: 'text',
                                needValue: 'quick',
                                label: t('Search fields'),
                                desc: t('Comma seperated. Use only  defined columns from above.')
                            },
                            filterCustom: {
                                label: t('Search fields'),
                                needValue: 'custom',
                                tableItem: false,
                                type: 'fieldTable',
                                options: {
                                    asFrameworkSearch: true,
                                    withoutChildren: true,
                                    addLabel: t('Add field')
                                }
                            }
                        }
                    }

                }
            },

            __actions__: {

                label: t('Actions'),
                type: 'childrenSwitcher',
                children: {

                    add: {

                        label: t('Addable'),
                        type: 'checkbox',
                        children: {
                            addIcon: {
                                label: t('Icon file'),
                                desc: t('Vector images with #&lt;id&gt; are possible.'),
                                type: 'file',
                                needValue: 1,
                                combobox: true
                            },
                            addEntrypoint: {
                                label: t('Entry point'),
                                desc: t('You can define here another entry point, so that this action goes through another controller class.'),
                                type: 'text',
                                needValue: 1,
                                desc: t('Default is &lt;current&gt;. Relative values are possible.')
                            },

                            addLabel: {

                                label: t('Add label text'),
                                desc: t('The tooltip for the add button and the title of the position chooser dialog.'),
                                type: 'text',
                                'default': 'Add',
                                needValue: 1

                            }
                        }

                    },

                    edit: {

                        label: t('Editable'),
                        type: 'checkbox',
                        children: {
                            editIcon: {
                                label: t('Icon file'),
                                desc: t('Vector images with #&lt;id&gt; are possible.'),
                                type: 'file',
                                needValue: 1,
                                combobox: true
                            },

                            editEntrypoint: {
                                label: t('Entry point'),
                                type: 'text',
                                desc: t('You can define here another entry point, so that this action goes through another controller class.'),
                                needValue: 1,
                                desc: t('Default is &lt;current&gt;. Relative values are possible.')
                            }
                        }

                    },

                    remove: {

                        label: t('Removeable'),
                        type: 'checkbox',
                        children: {

                            removeIcon: {
                                label: t('Icon file'),
                                type: 'file',
                                desc: t('Vector images with #&lt;id&gt; are possible.'),
                                needValue: 1,
                                combobox: true
                            },
                            removeEntrypoint: {
                                label: t('Entry point'),
                                type: 'text',
                                desc: t('You can define here another entry point, so that this action goes through another controller class.'),
                                needValue: 1,
                                desc: t('Default is &lt;current&gt;. Relative values are possible.')
                            }

                        }

                    },

                    itemActions: {
                        label: t('Custom item actions'),
                        desc: t('This generates on each record a extra icon which opens the defined entry point.'),
                        type: 'array',
                        withOrder: true,
                        columns: [
                            {'label': t('Entry point'), desc: t('The path to the entry point')},
                            {'label': t('Title')},
                            {'label': t('Icon path')}
                        ],
                        fields: {
                            entrypoint: {
                                type: 'object',
                                inputWidth: 100,
                                object: 'system_entrypoint'
                            },
                            label: {
                                type: 'text'
                            },
                            icon: {
                                type: 'object',
                                input_width: 100,
                                object: 'file',
                                objectOptions: {
                                    onlyLocal: 1,
                                    returnPath: 1
                                }
                            }
                        }
                    },

                    __nestedManagement__: {

                        type: 'childrenSwitcher',
                        label: t('Nested object management'),
                        children: {

                            nestedMoveable: {

                                label: t('Moveable'),
                                desc: t('Defines whether the items in the object tree are moveable or not.'),
                                type: 'checkbox',
                                'default': true

                            },

                            __nestedRootManaged__: {

                                type: 'childrenSwitcher',
                                label: t('Root entry management'),

                                children: {

                                    'nestedRootFieldLabel': {
                                        type: 'text',
                                        label: t('Label field (optional)'),
                                        desc: t('Priority: default label > tree label > this label > window class tree root label')
                                    },
                                    'nestedRootFieldTemplate': {
                                        type: 'codemirror',
                                        label: t('Label template (optional)'),
                                        desc: t('Priority: default template > tree template > this template > window class tree root template')
                                    },
                                    'nestedRootFieldFields': {
                                        type: 'text',
                                        label: t('Select fields (optional)'),
                                        desc: t('Define here other fields than in the default selection. (e.g. if you need more fields in your template above.)')
                                    },

                                    nestedRootAdd: {

                                        label: t('Addable'),
                                        type: 'checkbox',
                                        children: {
                                            nestedRootAddIcon: {
                                                label: t('Icon file'),
                                                desc: t('Vector images with #&lt;id&gt; are possible.'),
                                                type: 'file',
                                                needValue: 1,
                                                combobox: true
                                            },

                                            nestedRootAddLabel: {

                                                label: t('Add root label text'),
                                                desc: t('For add button.'),
                                                'default': 'Add root',
                                                type: 'text',
                                                needValue: 1

                                            },

                                            nestedRootAddEntrypoint: {
                                                label: t('Entry point'),
                                                type: 'text',
                                                desc: t('You can define here another entry point, so that this action goes through another controller class.'),
                                                needValue: 1,
                                                desc: t('Default is &lt;current&gt;/root.Relative values are possible.')
                                            }
                                        }

                                    },

                                    nestedRootEdit: {

                                        label: t('Editable'),
                                        type: 'checkbox',
                                        children: {
                                            nestedRootEditEntrypoint: {
                                                label: t('Entry point'),
                                                type: 'text',
                                                desc: t('You can define here another entry point, so that this action goes through another controller class.'),
                                                needValue: 1,
                                                desc: t('Default is &lt;current&gt;/root. Relative values are possible.')
                                            }
                                        }

                                    },

                                    nestedRootRemove: {

                                        label: t('Removeable'),
                                        type: 'checkbox',
                                        children: {

                                            nestedRootRemoveEntrypoint: {
                                                label: t('Entry point'),
                                                type: 'text',
                                                desc: t('You can define here another entry point, so that this action goes through another controller class.'),
                                                needValue: 1,
                                                desc: t('Default is &lt;current&gt;/root. Relative values are possible.')
                                            }

                                        }

                                    }

                                }

                            }
                        }
                    }
                }

            },

            __export__: {
                label: t('Export'),
                type: 'childrenSwitcher',
                children: {
                    'export': {
                        label: t('Export'),
                        type: 'checkbox',
                        desc: t('Provide a export button in the window header.')
                    },

                    /*export_types: {
                     label: t('Types'),
                     needValue: 1,
                     againstField: 'export',
                     type: 'checkboxGroup',
                     items: {
                     csv: t('CSV'),
                     json: t('JSON'),
                     xml: t('XML')
                     }
                     },*/

                    exportCustom: {
                        needValue: 1,
                        width: 400,
                        againstField: 'export',
                        label: t('Custom export'),
                        type: 'array',
                        columns: [
                            {'label': t('Method')},
                            {'label': t('Label')}
                        ],
                        fields: {
                            method: {
                                type: 'text'
                            },
                            label: {
                                type: 'text'
                            }
                        }
                    }

                }
            }

        };

        table = new Element('table', {width: '100%', style: 'table-layout: fixed;'}).inject(this.windowTabList.pane);
        this.windowListTbody = new Element('tbody').inject(table);

        this.windowListObj =
            new jarves.FieldForm(this.windowListTbody, listFields, {allTableItems: 1, withEmptyFields: false},
                {win: this.win});

        this.loadInfo();
    },

    objectKeyChanged: function () {

        var objectKey = this.generalObj.getValue('object');
        var showNestedStuff = false;

        if (objectKey) {
            var definition = jarves.getObjectDefinition(objectKey);
            if (definition && definition.nested) {
                showNestedStuff = true;
            }
        }

        this.windowListObj.setVisibility('__nestedManagement__', showNestedStuff);
        this.windowListObj.setVisibility('asNested', showNestedStuff);

        this.windowAddObj.setVisibility('nestedAddWithPositionSelection', showNestedStuff);
    },

    save: function () {

        var req = {
            'oldClass': this.win.params.className
        };

        req.general = this.generalObj.getValue();
        req.list = this.windowListObj.getValue();
        req.add = this.windowAddObj.getValue();

        var methods = {};

        this.methodContainer.getElements('a').each(function (item) {
            var key = item.get('text');

            if (this.newCode[key]) {
                methods[key] = this.newCode[key];
            }
        }.bind(this));

        this.customMethodContainer.getElements('a').each(function (item) {
            var key = item.get('text');

            if (this.customMethods[key]) {
                methods[key] = this.customMethods[key];
            }
        }.bind(this));

        req.methods = methods;

        var extractFields = function (pField, pChildren) {

            var children = {};
            if (typeOf(pField) == 'element' && pField.instance) {
                pField = pField.instance;
            }

            var isTab = !instanceOf(pField, jarves.Field);

            if (!isTab) {
                parentContainer = pField.getChildrenContainer();
            } else {
                parentContainer = pField.pane.fieldContainer;
            }

            if (parentContainer) {
                parentContainer.getChildren('.jarves-field').each(function (field) {

                    if (isTab && instanceOf(field.instance.getParent(), jarves.Field)) {
                        return;
                    }

                    children[field.instance.getKey()] = field.instance.getCalledDefinition();
                    delete children[field.instance.getKey()].designMode;
                    delete children[field.instance.getKey()].key;

                    children[field.instance.getKey()].children = extractFields(field.instance);

                    if (Object.getLength(children[field.instance.getKey()].children) == 0) {
                        delete children[field.instance.getKey()].children;
                    }

                });
            }

            return children;

        };

        var tabs = this.winTabPane.getTabs();
        var fields = {}, field;

        Array.each(tabs, function (tab) {

            field = Object.clone(tab.button.definition);
            field.type = 'tab';

            field.children = extractFields(tab);

            fields[tab.button.key] = field;
        });

        req.fields = fields;

        if (this.lastSaveReq) {
            this.lastSaveReq.cancel();
        }

        this.lastSaveReq = new Request.JSON({
            url: _pathAdmin + 'admin/system/bundle/editor/window?class=' + req.general['class'],
            noCache: 1,
            progressButton: this.saveBtn,
            saveStatusButton: this.saveBtn
        }).post(req);
    },

    loadInfo: function () {

        this.win.clearTitle();
        this.win.addTitle(this.win.params.module);
        this.win.addTitle(this.win.params.className);

        if (this.lr) {
            this.lr.cancel();
        }

        this.win.setLoading(true);

        this.lr = new Request.JSON({url: _pathAdmin + 'admin/system/bundle/editor/window', noCache: 1,
            onComplete: this.renderWindowDefinition.bind(this)}).get({
                'class': this.win.params.className
            });

    },

    renderWindowDefinition: function (pDefinition) {

        this.definition = pDefinition.data;

        //compatibility
//        this.definition.properties.dataModel = this.definition.properties.object ? 'object' : 'table';

        var generalValues = Object.clone(this.definition.properties);
        generalValues['class'] = this.definition['class'];
        generalValues['file'] = this.definition['file'];

        this.generalObj.setValue(generalValues);

        this.loadWindowClass(this.definition['class']);

        if (!this.definition.methods) {
            this.definition.methods = {};
        }

        if (!this.definition.parentMethods) {
            this.definition.parentMethods = {};
        }

        //prepare class methods
        Object.each(this.definition.methods, function (code, key) {
            this.newCode[key] = "<?php\n\n" + code + "\n?>";

            if (!this.definition.parentMethods[key]) {
                this.customMethods[key] = this.newCode[key];
            }

        }.bind(this));

        //class methods Tab
        this.methodTab.pane.empty();

        this.methodContainer = new Element('div', {
            'class': 'jarves-system-module-windowEdit-method-container'
        }).inject(this.methodTab.pane);

        this.methodRight = new Element('div', {
            'class': 'jarves-system-module-windowEdit-method-right jarves-system-module-windowEdit-method-codemirror'
        }).inject(this.methodTab.pane);

        this.methodActionBar = new Element('div', {
            'class': 'jarves-system-module-windoeEdit-method-actionbar'
        }).inject(this.methodTab.pane);

        new jarves.Button(t('Got to source'))
            .addEvent('click', function () {
                // TODO
                alert('TODO');
            }.bind(this))
            .inject(this.methodActionBar);

        new jarves.Button(t('Undo'))
            .addEvent('click', function () {
                if (this.methodEditor) {
                    this.methodEditor.undo();
                }
            }.bind(this))
            .inject(this.methodActionBar);

        new jarves.Button(t('Redo'))
            .addEvent('click', function () {
                if (this.methodEditor) {
                    this.methodEditor.redo();
                }
            }.bind(this))
            .inject(this.methodActionBar);

        new jarves.Button(t('Remove overwrite'))
            .addEvent('click', function () {

                if (this.methodEditor && this.lastMethodItem) {
                    this.lastMethodItem.removeClass('active');

                    var code = this.lastMethodItem.get('text');
                    delete this.newCode[code];
                    delete this.definition.methods[code];
                    this.selectMethod(this.lastMethodItem);

                }
            }.bind(this))
            .inject(this.methodActionBar);

        Object.each(this.definition.parentMethods, function (code, item) {

            var a = new Element('a', {
                'class': 'jarves-system-module-windowEdit-methods-item',
                text: item
            }).inject(this.methodContainer);

            if (this.definition.methods && this.definition.methods[item]) {
                a.addClass('active');
            }

            a.addEvent('click', this.selectMethod.bind(this, a));

        }.bind(this));

        //custom methods Tab
        this.customMethodTab.pane.empty();

        this.customMethodContainer = new Element('div', {
            'class': 'jarves-system-module-windowEdit-method-container',
            style: 'bottom: 35px; border-bottom: 1px solid silver; '
        }).inject(this.customMethodTab.pane);

        var addBtnContainer = new Element('div', {
            'class': 'jarves-system-module-windowEdit-method-add'
        }).inject(this.customMethodTab.pane);

        new jarves.Button(t('Add method'))
            .addEvent('click', function () {

                var dialog = this.win.newDialog('<b>' + t('New method') + '</b>');
                dialog.setStyle('width', 400);

                var d = new Element('div', {
                    style: 'padding: 5px 0px;'
                }).inject(dialog.content);

                var table = new Element('table').inject(d);
                var tbody = new Element('tbody').inject(table);

                var fnDefinition = {
                    name: {
                        type: 'text',
                        label: t('Name'),
                        required_regexp: /^[a-zA-Z0-9_]*$/,
                        empty: false
                    },
                    'arguments': {
                        type: 'text', label: t('Arguments'), desc: t('Comma sperated')
                    },
                    visibility: {
                        type: 'select', label: t('Visibility'),
                        items: {'public': t('Public'), 'private': t('Private')}
                    },
                    'static': {
                        type: 'checkbox', label: t('Static')
                    }
                };

                var fnDefinitionObj = new jarves.FieldForm(tbody, fnDefinition,
                    {allTableItems: true, withEmptyFields: false}, {win: this.win});

                new jarves.Button(t('Cancel'))
                    .addEvent('click', function () {
                        dialog.close();
                    })
                    .inject(dialog.bottom);

                new jarves.Button(t('Apply'))
                    .addEvent('click', function () {

                        if (fnDefinitionObj.isValid()) {

                            var name = fnDefinitionObj.getValue('name');
                            if (this.definition.parentMethods[name]) {
                                this.win._alert(t('This method name is already in used by the parent class. Please write your code in the class methods tab.'));
                                return;
                            }

                            if (this.customMethods[name]) {
                                this.win._alert(t('This method does already exists. Please choose another name.'));
                                return;
                            }

                            //this.customMethods[name] = "<?php\n\n    ";

                            this.customMethods[name] = fnDefinitionObj.getValue('visibility') + " ";

                            this.customMethods[name] += fnDefinitionObj.getValue('static') == 1 ? "static " : "";

                            this.customMethods[name] +=
                                "function " + name + "(" + fnDefinitionObj.getValue('arguments') + "){";

                            this.renderCustomMethodList();

                            this.selectCustomMethod(this.customMethodItems[name]);
                            dialog.close();
                        }

                    }.bind(this))
                    .inject(dialog.bottom);

                dialog.center();

            }.bind(this))
            .inject(addBtnContainer);

        this.customMethodRight = new Element('div', {
            'class': 'jarves-system-module-windowEdit-method-right jarves-system-module-windowEdit-method-codemirror'
        }).inject(this.customMethodTab.pane);

        this.customMethodActionBar = new Element('div', {
            'class': 'jarves-system-module-windoeEdit-method-actionbar'
        }).inject(this.customMethodTab.pane);

        new jarves.Button(t('Undo'))
            .addEvent('click', function () {
                if (this.customMethodEditor) {
                    this.customMethodEditor.undo();
                }
            }.bind(this))
            .inject(this.customMethodActionBar);

        new jarves.Button(t('Redo'))
            .addEvent('click', function () {
                if (this.customMethodEditor) {
                    this.customMethodEditor.redo();
                }
            }.bind(this))
            .inject(this.customMethodActionBar);

        this.renderCustomMethodList();

        this.win.setLoading(false);

    },

    renderCustomMethodList: function () {

        delete this.customMethodItems;
        this.customMethodItems = {};

        this.customMethodContainer.empty();

        Object.each(this.customMethods, function (code, key) {

            var a = new Element('a', {
                'class': 'jarves-system-module-windowEdit-customMethods-item',
                text: key
            })
                .inject(this.customMethodContainer);

            new Element('img', {
                src: _path + 'bundles/jarves/admin/images/icons/pencil.png',
                'class': 'jarves-system-module-windowEdit-methods-item-pencil',
                title: t('Edit')
            })
                .addEvent('click', function (e) {
                    e.stopPropagation();
                    this.openCustomMethodEditor(a);
                }.bind(this))
                .inject(a);

            new Element('img', {
                src: _path + 'bundles/jarves/admin/images/icons/delete.png',
                'class': 'jarves-system-module-windowEdit-methods-item-remove',
                title: t('Remove')
            })
                .addEvent('click', function (e) {

                    e.stopPropagation();
                    this.win._confirm(t('Really remove?'), function (res) {

                        if (!res) {
                            return;
                        }
                        delete this.customMethods[key];

                        if (this.lastCustomMethodItem == a) {
                            this.customMethodEditor.setValue('');
                            delete this.lastCustomMethodItem;
                        }

                        a.destroy();
                    }.bind(this));

                }.bind(this))
                .inject(a);

            a.addEvent('click', this.selectCustomMethod.bind(this, a));

            this.customMethodItems[key] = a;

        }.bind(this));

    },

    parseMethodDefintion: function (pCode) {

        var res = pCode.match(/(public|private)\s*(static|)\s*function ([a-zA-Z0-9]*)\(([^\)]*)\)\s*{/);

        if (res) {

            return {
                visibility: res[1],
                'static': res[2] != "" ? true : false,
                name: res[3],
                arguments: res[4]
            };

        }

        return {};

    },

    openCustomMethodEditor: function (pA) {

        var key = pA.get('text');

        var parsedInfos = this.parseMethodDefintion(this.customMethods[key]);

        var dialog = this.win.newDialog('<b>' + t('Edit method') + '</b>');
        dialog.setStyle('width', 400);

        var d = new Element('div', {
            style: 'padding: 5px 0px;'
        }).inject(dialog.content);

        var table = new Element('table').inject(d);
        var tbody = new Element('tbody').inject(table);

        var fnDefinition = {
            name: {
                type: 'text',
                label: t('Name'),
                required_regexp: /^[a-zA-Z0-9_]*$/,
                empty: false
            },
            'arguments': {
                type: 'text', label: t('Arguments'), desc: t('Comma sperated')
            },
            visibility: {
                type: 'select', label: t('Visibility'),
                items: {'public': t('Public'), 'private': t('Private')}
            },
            'static': {
                type: 'checkbox', label: t('Static')
            }
        };

        var fnDefinitionObj = new jarves.FieldForm(tbody, fnDefinition, {allTableItems: true, withEmptyFields: false},
            {win: this.win});

        new jarves.Button(t('Cancel'))
            .addEvent('click', function () {
                dialog.close();
            })
            .inject(dialog.bottom);

        new jarves.Button(t('Apply'))
            .addEvent('click', function () {

                if (fnDefinitionObj.isValid()) {

                    var name = fnDefinitionObj.getValue('name');
                    if (this.definition.parentMethods[name]) {
                        this.win._alert(t('This method name is already in used by the parent class. Please write your code in the class methods tab.'));
                        return;
                    }

                    //this.customMethods[name] = "<?php\n\n    ";

                    var pos = this.customMethods[key].indexOf('{');
                    var lPos = this.customMethods[key].indexOf('}');
                    var codeContent = this.customMethods[key].substring(pos + 1, lPos);

                    var newCode = fnDefinitionObj.getValue('visibility') + " ";

                    newCode += fnDefinitionObj.getValue('static') == 1 ? "static " : "";

                    newCode += "function " + name + "(" + fnDefinitionObj.getValue('arguments') + "){";

                    delete this.customMethods[key];
                    this.customMethods[name] = "<?php\n\n    " + newCode + codeContent + "}\n\n?>";

                    var selectThis = this.lastCustomMethodItem == this.customMethodItems[key];

                    this.renderCustomMethodList();

                    if (selectThis) {
                        this.selectCustomMethod(this.customMethodItems[name]);
                    }

                    dialog.close();
                }

            }.bind(this))
            .inject(dialog.bottom);

        dialog.center();

        fnDefinitionObj.setValue(parsedInfos);

    },

    checkCurrentEditor: function () {

        if (this.methodEditor && this.lastMethodItem) {

            var code = this.lastMethodItem.get('text');

            var newCode = this.methodEditor.getValue().replace(/\r/g, '');

            if (this.customCode[code] != newCode) {
                this.newCode[code] = newCode;
                this.lastMethodItem.addClass('active');
            }

        }

    },

    checkCurrentCustomEditor: function () {
        if (this.customMethodEditor && this.lastCustomMethodItem) {

            var code = this.lastCustomMethodItem.get('text');
            this.customMethods[code] = this.customMethodEditor.getValue();

        }
    },

    selectCustomMethod: function (pA) {

        this.customMethodContainer.getChildren().removeClass('selected');

        $$(this.customMethodRight, this.customMethodActionBar).setStyle('display', 'block');

        pA.addClass('selected');
        var name = pA.get('text');

        if (this.customMethods[name].substr(0, 5) != '<?php') {
            this.customMethods[name] = "<?php\n\n    " + this.customMethods[name] + "\n\n       //my code\n    }\n\n?>";
        }

        this.lastCustomMethodItem = pA;

        var php = this.customMethods[name];

        if (!this.customMethodEditor) {
            this.customMethodEditor = CodeMirror(this.customMethodRight, {
                value: php,
                lineNumbers: true,
                onCursorActivity: this.onEditorCursorActivity,
                onChange: function (pEditor, pChanged) {
                    this.onEditorChange(pEditor, pChanged);
                    this.checkCurrentCustomEditor();
                }.bind(this),
                mode: "php"
            });

            CodeMirror.autoLoadMode(this.customMethodEditor, "php");
        } else {
            this.customMethodEditor.setValue(php);
            this.customMethodEditor.clearHistory();
        }

    },

    selectMethod: function (pA) {

        logger('selectMethod');
        this.methodContainer.getChildren().removeClass('selected');
        pA.addClass('selected');

        $$(this.methodRight, this.methodActionBar).setStyle('display', 'block');

        var code = pA.get('text');
        var php;

        if (this.definition.methods[code]) {
            php = "<?php\n\n" + this.definition.methods[code] + "\n?>";
        }

        if (this.newCode[code]) {
            php = this.newCode[code];
        }

        if (!php) {
            php = "<?php\n\n" + this.definition.parentMethods[code] + "\n" +
                "        //my custom code here\n\n" +
                "        return $result;\n\n" +
                "    }" + "\n\n?>";

            this.customCode[code] = php;

            this.methodRight.addClass('deactivateTabIndex')

            if (!this.lastMethodNotOverwritten) {
                this.lastMethodNotOverwritten = new Element('div', {
                    html: '<h2>' + t('Not overwritten.') + '</h2>',
                    'class': 'jarves-system-module-windowEdit-methods-notoverwritten',
                    style: 'display: block'
                }).inject(this.methodRight.getParent());
                this.lastMethodNotOverwritten.setStyle('opacity', 0.8);

                new jarves.Button('Overwrite now')
                    .addEvent('click', function () {
                        this.lastMethodNotOverwritten.destroy();
                        delete this.lastMethodNotOverwritten;
                    }.bind(this))
                    .inject(this.lastMethodNotOverwritten);
            }

        } else if (this.lastMethodNotOverwritten) {
            this.lastMethodNotOverwritten.destroy();
            delete this.lastMethodNotOverwritten;
        }

        this.lastMethodItem = pA;

        if (!this.methodEditor) {
            this.methodEditor = CodeMirror(this.methodRight, {
                value: php,
                lineNumbers: true,
                onCursorActivity: this.onEditorCursorActivity,
                onChange: function (pEditor, pChanged) {
                    this.onEditorChange(pEditor, pChanged);
                    this.checkCurrentEditor();
                }.bind(this),
                mode: "php"
            });

            CodeMirror.autoLoadMode(this.methodEditor, "php");
        } else {
            this.methodEditor.setValue(php);
            this.methodEditor.clearHistory();
        }

    },

    onEditorChange: function (pEditor, pChanges) {

        //todo, push this feature to the codemirror github repo (as "limit" option)

        //if the user want to remove the linebreak in first editable line
        if (pChanges.from.line == 2 && pChanges.to.line == 3 && pChanges.to.ch == 0) {
            pEditor.replaceRange("\n", pChanges.from);
            pEditor.setCursor(pChanges.to);
        }

        //if the user want to remove the linebreak in the line before the last editable line
        if (pChanges.to.line == pEditor.lineCount() - 2 && pChanges.to.ch == 0) {
            pEditor.replaceRange("\n", pEditor.getCursor(false));
        }

    },

    onEditorCursorActivity: function (pEditor) {

        //todo, push this feature to the codemirror github repo (as "limit" option)

        var firstPos = pEditor.getCursor(true);
        var lastPos = pEditor.getCursor(false);

        var newFirstPos = firstPos, newLastPos = lastPos, hasBeenChanged = false;

        if (firstPos.line < 3) {
            firstPos.line = 3;
            firstPos.ch = 0;
            hasBeenChanged = true;
        }

        if (pEditor.lineCount() > 6 && lastPos.line > pEditor.lineCount() - 4) {

            lastPos.line = pEditor.lineCount() - 4;
            lastPos.ch = pEditor.getLine(lastPos.line).length;
            hasBeenChanged = true;
        }

        if (hasBeenChanged) {
            if (firstPos == lastPos) {
                pEditor.setCursor(firstPos);
            } else {
                pEditor.setSelection(firstPos, lastPos);
            }
        }

    },

    newWindow: function () {

        this.windowPane.empty();
        var win = new jarves.Window();

        //win.borderDragger.detach();
        document.id(win).inject(this.windowPane);

        document.id(win).setStyles({
            left: 25,
            top: 25,
            right: 25,
            bottom: 25,
            width: 'auto',
            height: 'auto',
            zIndex: null
        });

        win.addEvent('toFront', function () {
            win.border.setStyle('zIndex', null);
        });

        return win;
    },

    windowListAddColumn: function () {

        this.previewWin;

    },

    loadWindowClass: function (pClass) {

        //this.windowEditAddTabBtn.hide();
        //this.windowEditAddFieldBtn.hide();
        //this.windowEditAddPredefinedFieldBtn.hide();

        //this.windowTabEdit.hide();
        //this.windowTabList.hide();

        //if (pClass == 'adminWindowList' || pClass == 'adminWindowCombine'){
        //    this.windowTabList.show();

        //compatibility
        if (this.definition.properties) {
            if (this.definition.properties.orderBy) {
                this.definition.properties.order = {};
                this.definition.properties.order[this.definition.properties.orderBy] =
                    this.definition.properties.orderByDirection ?
                        this.definition.properties.orderByDirection.toLowerCase() : 'asc';
            }

            if (this.definition.properties.secondOrderBy) {
                if (!this.definition.properties.order) {
                    this.definition.properties.order = {};
                }
                this.definition.properties.order[this.definition.properties.secondOrderBy] =
                    this.definition.properties.secondOrderByDirection ?
                        this.definition.properties.secondOrderByDirection.toLowerCase() : 'asc';
            }

//            if (this.definition.properties.iconEdit) {
//                this.definition.properties.editIcon = '/admin/images/icons/' + this.definition.properties.iconEdit;
//            }
//
//            if (this.definition.properties.iconAdd) {
//                this.definition.properties.addIcon = '/admin/images/icons/' + this.definition.properties.iconAdd;
//            }
//
//            if (this.definition.properties.iconDelete) {
//                this.definition.properties.removeIcon = '/admin/images/icons/' + this.definition.properties.iconDelete;
//            }

            if (this.definition.properties.filter && typeOf(this.definition.properties.filter) == 'array') {
                this.definition.properties.filter = this.definition.properties.filter.join(',');
            }

            if (this.definition.properties.filterCustom && typeOf(this.definition.properties.filterCustom) == 'array' &&
                Object.getLength(this.definition.properties.filterCustom) > 0) {
                this.definition.properties.__search__kind__ = 'custom';
            }
        }

        this.windowListObj.setValue(this.definition.properties);
        this.windowListObj.setValue(this.definition.properties);
        this.windowAddObj.setValue(this.definition.properties);
        //}

        //if (pClass == 'adminWindowEdit' || pClass == 'adminWindowAdd'){

        //    this.windowTabEdit.show();
        this.windowEditAddTabBtn.show();
        this.windowEditAddFieldBtn.show();
        this.windowEditAddPredefinedFieldBtn.show();

        var win = this.newWindow();

        //new jarves.WindowEdit(win, win.content);

        this.winTabPane = new jarves.TabPane(win.content, true, win);

        this.winTabPaneSortables = new Sortables(null, {
            revert: { duration: 500, transition: 'elastic:out' },
            dragOptions: {},
            opacity: 0.7,
            onSort: function () {
                (function () {
                    this.winTabPane.buttonGroup.rerender();
                }).delay(50, this);
            }.bind(this)
        });

        //normal fields without tab
        if (typeOf(this.definition.properties.fields) == 'object') {

            //do we have on the first leve tabs?

            var doWeHaveTabs = false;
            Object.each(this.definition.properties.fields, function (item, key) {
                if (item.type == 'tab') {
                    doWeHaveTabs = true;
                }
            });

            if (!doWeHaveTabs) {
                var tab = this.addWindowEditTab('general', {label: '[[General]]', type: 'tab'});

                Object.each(this.definition.properties.fields, function (field, key) {
                    this.addWindowEditField(tab, key, field);
                }.bind(this));
            } else {
                Object.each(this.definition.properties.fields, function (tab, tkey) {

                    var tabObj = this.addWindowEditTab(tkey, tab);

                    Object.each(tab.children, function (field, key) {
                        this.addWindowEditField(tabObj, key, field);
                    }.bind(this));

                }.bind(this));
            }
        }

        //tab fields with tab, backward compatibility
        if (typeOf(this.definition.properties.tabFields) == 'object') {

            Object.each(this.definition.properties.tabFields, function (fields, tabKey) {

                var tab = this.addWindowEditTab(tabKey.replace(/[^a-zA-Z0-9_\-]/, ''), {label: tabKey});

                Object.each(fields, function (field, key) {
                    this.addWindowEditField(tab, key, field);
                }.bind(this));
            }.bind(this));

        }

        if (
            (typeOf(this.definition.properties.fields) == 'object' &&
                Object.getLength(this.definition.properties.fields) === 0) &&
                (typeOf(this.definition.properties.tabFields) == 'object' &&
                    Object.getLength(this.definition.properties.tabFields) === 0)) {
            this.addWindowEditTab('general', {label: '[[General]]', type: 'tab'});
        }
        //}

    },

    /*cancelFieldProperties: function(){

     this.windowInspectorContainer.empty();

     if (this.lastFieldProperty)
     delete this.lastFieldProperty;

     if (this.lastLoadedField){
     if (this.windowEditFields[this.lastLoadedField])
     document.id(this.windowEditFields[this.lastLoadedField]).setStyle('outline');
     }

     if (this.lastLoadedField)
     delete this.lastLoadedField;

     },*/

    applyFieldProperties: function () {

        if (this.inApplyingProperties) {
            return;
        }
        this.inApplyingProperties = true;

        var tab;

        if (instanceOf(this.lastLoadedField, jarves.Field)) {

            var val = this.lastFieldProperty.getValue();

            //check if the key is not anywhere else used
            //TODO, check it
            if (this.lastLoadedField.key != val.key && false) {
                //yepp, in use
                this.lastFieldProperty.getField('key').highlight();
                return;
            }

            if (val.type != 'tab') {

                var oField = this.lastLoadedField;

                var children = oField.getDefinition().children;

                var definition = val.definition;
                definition.children = children;

                var field = this.addWindowEditField(null, val.key, definition);

                field.injectAfter(oField);

                this.lastLoadedField = field;
                document.id(this.lastLoadedField).setStyle('outline', '1px dashed green');

                oField.destroy();

                this.inApplyingProperties = false;
                return;
            }
        }

        //we're a tab
        var button = this.lastLoadedField;

        //copy the action images
        var actions = button.getChildren();
        actions.adopt();

        //get new defintion
        var definition = this.toolbarTabItemObj.getValue();

        //check if the key is not anywhere else used
        //TODO check it
        if (this.lastLoadedField.key != definition.key && false) {
            //yepp, in use
            this.toolbarTabItemObj.getField('key').highlight();
            return;
        }

        //did the layout change?
        if (button.definition.layout != definition.layout) {

            //update tab content
            var container = button.tab.pane.fieldContainer;
            var currentScroll = container.getScroll();

            var children = [];
            container.getElements('.jarves-field').each(function (child) {
                if (child.instance.getParent() == button.tab) {
                    children.push(child.instance);
                }
            });

            if (children) {

                //dispose fields
                children.invoke('dispose');

                //assign new layout
                container.set('html', definition.layout);

                //injects fields back

                children.each(function (child) {

                    var target = container.getElement('*[id=' + child.options.target + ']') ||
                        container.getElement('*[id=' + child.key + ']') ||
                        container.getElement('*[id=__default__]');

                    if (!target) {
                        target = container;
                    }

                    child.inject(target);

                });

            }

            container.scrollTo(currentScroll.x, currentScroll.y);
        }

        button.definition = definition;
        definition.type = 'tab';

        button.key = definition.key;
        delete definition.key;

        if (button.key.substr(0, 2) != '__') {
            button.key = '__' + button.key;
        }
        if (button.key.substr(button.key.length - 2) != '__') {
            button.key += '__';
        }

        button.set('text', definition.label);

        actions.inject(button);

        this.inApplyingProperties = false;

    },

    loadToolbar: function (pField) {

        if (this.lastLoadedField) {

            if (instanceOf(this.lastLoadedField, jarves.Field)) {
                document.id(this.lastLoadedField).setStyle('outline');
            }
            else {
                document.id(this.lastLoadedField).setStyle('border');
            }
        }

        var field = pField;

        if (!instanceOf(field, jarves.Field)) {

            delete this.lastFieldProperty;

            if (!this.toolbarTabItemObj) {

                this.windowInspectorContainer.empty();

                this.toolbarTabItemDef = {
                    key: {
                        type: 'text', label: t('ID'), desc: t('Will be surrounded with __ and __ (double underscore) if its not already.')
                    },
                    label: {
                        type: 'text', label: t('Label')
                    },
                    layout: {
                        type: 'codemirror',
                        inputHeight: 'auto',
                        label: t('Content layout (Optional)'),
                        height: 200,
                        help: 'admin/objectWindowLayout',
                        desc: t('If you want to have a own layout in this content tab, then just type here the HTML.')
                    },
                    __optional__: {
                        label: t('More'),
                        type: 'childrenSwitcher',
                        cookieStorage: 'jarves.editWindow.toolbarTabItemOptional',
                        children: {
                            'needValue': {
                                label: tc('kaFieldTable', 'Visibility condition (Optional)'),
                                desc: t("Shows this field only, if the field defined below or the parent field has the defined value. String, JSON notation for arrays and objects, /regex/ or 'javascript:(value=='foo'||value.substr(0,4)=='lala')'")
                            },
                            againstField: {
                                label: tc('kaFieldTable', 'Visibility condition field (Optional)'),
                                desc: t("Define the key of another field if the condition should not against the parent. Use JSON notation for arrays and objects. String or Array")
                            }
                        }
                    }
                };

                this.toolbarTabItemObj =
                    new jarves.FieldForm(this.windowInspectorContainer, this.toolbarTabItemDef, {withEmptyFields: false});

                this.toolbarTabItemObj.addEvent('change', this.applyFieldProperties);
            }

            var values = field.definition;
            values.key = field.key;

            document.id(field).setStyle('border', '1px dashed green');

            this.toolbarTabItemObj.setValue(values);

            this.lastLoadedField = pField;
            return;
        }

        var definition = Object.clone(field.editWindowDefinition) || {};

        definition.key = field.key;

        delete this.toolbarTabItemObj;

        if (!this.lastFieldProperty) {

            this.windowInspectorContainer.empty();

            this.lastFieldProperty = new jarves.FieldProperty(field.key, definition, this.windowInspectorContainer, {
                arrayKey: true,
                allTableItems: false,
                withActions: false,
                withoutChildren: true,
                asTableItem: false
            });

            this.lastFieldProperty.addEvent('change', this.applyFieldProperties);
        } else {
            this.lastFieldProperty.setValue(field.key, definition);
        }

        if (field) {
            document.id(field).setStyle('outline', '1px dashed green');
        }

        this.lastLoadedField = pField;
    },

    addWindowEditField: function (pParent, pKey, pField) {
        var field, errorMsg, target;

        field = Object.clone(pField);
        field.designMode = true;

        var parentContainer;

        if (pParent) {
            if (instanceOf(pParent, jarves.Field)) {
                pParent.prepareChildContainer();
                parentContainer = pParent.getChildrenContainer();
            } else {
                parentContainer = pParent.pane.fieldContainer;
            }

            if (!parentContainer) {
                logger('no parent found for id=' + pParentKey);
                return;
            }

            target = parentContainer.getElement('*[id=' + field.target + ']') ||
                parentContainer.getElement('*[id=' + pKey + ']') ||
                parentContainer.getElement('*[id=__default__]');

            if (!target) {
                target = parentContainer;
            }
        }

        try {
            field = new jarves.Field(
                field,
                target,
                {win: this.win}
            );
        } catch (e) {
            var oldType = field.type;
            field.type = 'info';
            field.label = tf('jarves.Field type `%s` is misconfigured: %s', oldType, e);
            if (console) {
                console.error(e, field);
            }
            field = new jarves.Field(
                field,
                target
            );
        }

        field.key = pKey;
        field.editWindowDefinition = pField;

        field.parent = pParent;

        field.windowEditActions = new Element('div', {
            'class': 'jarves-field-designMode-actions'
        }).inject(pField.tableItem ? field.main : field.toElement());

        field.windowEditActions.setStyle('opacity', 0);

        field.toElement().addEvent('mouseenter', function () {
            field.windowEditActions.fade('in');
        });

        field.toElement().addEvent('mouseleave', function () {
            field.windowEditActions.fade('out');
        });

        new Element('a', {
            style: "cursor: pointer; font-family: 'icomoon'; padding: 0px 2px;",
            title: t('Add children'),
            html: '&#xe084;'
        })
            .addEvent('click', function () {

                field.prepareChildContainer();
                var child = field.childContainer;
                var count = child.getElements('.jarves-field-main').length + 1;
                this.addWindowEditField(field, 'field_' + count, {label: 'Field ' + count});

            }.bind(this))
            .inject(field.windowEditActions);

        new Element('a', {
            style: "cursor: pointer; font-family: 'icomoon'; padding: 0px 2px;",
            title: t('Edit'),
            html: '&#xe06f;'
        })
            .addEvent('click', function () {
                this.loadToolbar(field);
            }.bind(this))
            .inject(field.windowEditActions);

        new Element('a', {
            style: "cursor: pointer; font-family: 'icomoon'; padding: 0px 2px;",
            title: t('Delete'),
            html: '&#xe26b;'
        })
            .addEvent('click', function () {
                this.win._confirm(t('Really delete?'), function (ok) {

                    if (!ok) {
                        return;
                    }
                    document.id(field).destroy();

                }.bind(this));
            }.bind(this))
            .inject(field.windowEditActions);

        new Element('a', {
            style: "cursor: pointer; font-family: 'icomoon'; padding: 0px 2px;",
            title: t('Move up'),
            html: '&#xe2ca;'
        }).addEvent('click',function () {
                field.moveUp();
            }).inject(field.windowEditActions);

        new Element('a', {
            style: "cursor: pointer; font-family: 'icomoon'; padding: 0px 2px;",
            title: t('Move down'),
            html: '&#xe2cc;'
        }).addEvent('click',function () {
                field.moveDown();
            }).inject(field.windowEditActions);

        if (pField.children) {
            Object.each(pField.children, function (sfield, key) {
                this.addWindowEditField(field, key, sfield);
            }.bind(this));
        }

        return field;

    },

    addWindowEditTab: function (pTabKey, pDefinition, pIcon) {

        if (pTabKey.substr(0, 2) != '__') {
            pTabKey = '__' + pTabKey;
        }

        if (pTabKey.substr(pTabKey.length - 2) != '__') {
            pTabKey += '__';
        }

        var tab = this.winTabPane.addPane(pDefinition.label, pIcon);

        tab.pane.fieldContainer = new Element('div', {
            html: pDefinition.layout
        }).inject(tab.pane);

        this.winTabPaneSortables.addItems(tab.button);

        tab.button.tab = tab;

        tab.button.key = pTabKey;
        tab.button.definition = pDefinition;

        new Element('a', {
            style: "cursor: pointer; font-family: 'icomoon'; padding: 0px 2px;",
            title: t('Edit'),
            html: '&#xe06f;'
        })
            .addEvent('click', function () {
                this.loadToolbar(tab.button);
            }.bind(this))
            .inject(tab.button);

        new Element('a', {
            style: "cursor: pointer; font-family: 'icomoon'; padding: 0px 2px;",
            title: t('Delete'),
            html: '&#xe26b;'
        })
            .addEvent('click', function () {
                this.win._confirm(t('Really delete?'), function (ok) {

                    this.winTabPane.remove(tab.id);

                }.bind(this));
            }.bind(this))
            .inject(tab.button);

        return tab;
    }

})
