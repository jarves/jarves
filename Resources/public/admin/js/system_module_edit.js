var jarves_system_module_edit = new Class({

    initialize: function(pWin) {
        this.win = pWin;
        this.mod = this.win.params.name;
        if (!this.mod) {
            this.win.alert('No bundle given.');
            return;
        }
        var bundleName = this.mod;
        if (-1 !== bundleName.lastIndexOf('\\')) {
            bundleName = bundleName.substr(bundleName.lastIndexOf('\\') + 1);
        }
        this.win.setTitle(bundleName);
        this._createLayout();
    },

    _createLayout: function() {
        this.win.content.setStyle('top', 0);
        this.win.content.setStyle('border-top', 0);

        this.topNavi = this.win.addTabGroup();
        this.buttons = {};
        this.buttons['general'] = this.topNavi.addButton(t('General'), '', this.viewType.bind(this, 'general'));
        this.buttons['extras'] = this.topNavi.addButton(t('Extras'), '', this.viewType.bind(this, 'extras'));
        this.buttons['entryPoints'] = this.topNavi.addButton(t('Admin entry points'), '', this.viewType.bind(this, 'entryPoints'));

        this.buttons['objects'] = this.topNavi.addButton(t('Objects'), '', this.viewType.bind(this, 'objects'));
        this.buttons['model'] = this.topNavi.addButton(t('Model'), '', this.viewType.bind(this, 'model'));

        this.buttons['windows'] = this.topNavi.addButton(t('Windows'), '', this.viewType.bind(this, 'windows'));
        this.buttons['plugins'] = this.topNavi.addButton(t('Plugins'), '', this.viewType.bind(this, 'plugins'));

        this.buttons['docu'] = this.topNavi.addButton(t('Docu'), '', this.viewType.bind(this, 'docu'));
        this.buttons['help'] = this.topNavi.addButton(t('Help'), '', this.viewType.bind(this, 'help'));
        this.buttons['themes'] = this.topNavi.addButton(t('Themes'), '', this.viewType.bind(this, 'themes'));
        this.buttons['language'] = this.topNavi.addButton(t('Language'), '', this.viewType.bind(this, 'language'));

        this.panes = {};
        Object.each(this.buttons, function(button, id) {
            this.panes[id] = new Element('div', {
                'class': 'jarves-system-modules-edit-pane jarves-scrolling'
            }).inject(this.win.content);
        }.bind(this));

        this.win.setLoading(false);

        this.viewType(this.win.getParameter('tab') || 'general');
    },

    /*
     *  Plugins
     * 
     *
     */

    loadPlugins: function() {

        if (this.lr) {
            this.lr.cancel();
        }
        this.panes['plugins'].empty();

        this.pluginsPane = new Element('div', {
            'class': 'jarves-system-modules-edit-pane',
            style: 'bottom: 40px;'
        }).inject(this.panes['plugins']);

        this.pluginTBody = new Element('table', {
            'class': 'jarves-Table-head jarves-Table-body jarves-Table-hover',
            style: 'position: relative; top: 0px; background-color: #eee; width: 100%; table-layout: auto;',
            cellpadding: 0, cellspacing: 0
        }).inject(this.pluginsPane);

        var tr = new Element('tr').inject(this.pluginTBody);
        new Element('th', {
            text: t('Id'),
            style: 'width: 150px;'
        }).inject(tr);

        new Element('th', {
            text: t('PHP Class'),
            style: 'width: 250px;'
        }).inject(tr);

        new Element('th', {
            text: t('Class method'),
            style: 'width: 150px;'
        }).inject(tr);

        new Element('th', {
            text: t('Plugin title'),
            style: 'width: 200px;'
        }).inject(tr);

        new Element('th', {
            text: t('Actions')
        }).inject(tr);

        var buttonBar = new jarves.ButtonBar(this.panes['plugins']);
        buttonBar.addButton(t('Add plugin'), this.addPlugin.bind(this));
        this.saveBtn = buttonBar.addButton(t('Save'), this.savePlugins.bind(this));
        this.saveBtn.setButtonStyle('blue');

        this.lr = new Request.JSON({url: _pathAdmin + 'admin/system/bundle/editor/plugins',
            noCache: 1,
            onComplete: function(res) {

                if (res) {
                    Object.each(res.data, function(item, key) {
                        this.addPlugin(item, key)
                    }.bind(this));
                }
                this.win.setLoading(false);

            }.bind(this)}).get({bundle: this.mod});
    },

    savePlugins: function() {

        var req = {plugins: {}};

        this.pluginsPane.getElements('.plugin').each(function(pluginTr) {

            var plugin = {
                'id': pluginTr.pluginId.getValue(),
                'class': pluginTr.pluginPhpClass.getValue(),
                'method': pluginTr.pluginPhpMethod.getValue(),
                'label': pluginTr.pluginLabel.getValue(),
                options: pluginTr.pluginOptions,
                routes: pluginTr.pluginRoutes
            };

            req.plugins[plugin.id] = plugin;
        });

        if (this.lr) {
            this.lr.cancel();
        }

        this.lr = new Request.JSON({
            url: _pathAdmin + 'admin/system/bundle/editor/plugins?bundle=' + this.mod,
            noCache: 1,
            saveStatusButton: this.saveBtn,
            onComplete: function(res) {
                jarves.loadSettings();
            }.bind(this)
        }).post(req);

    },

    normalizePluginDef: function(pPlugin) {
        var plugin = {};
        plugin.label = pPlugin[0];
        plugin.options = pPlugin[1];
        return plugin;
    },

    addPlugin: function(pPlugin, pKey) {
        if (typeOf(pPlugin) == 'array') {
            pPlugin = this.normalizePluginDef(pPlugin);
        }

        var tr = new Element('tr', {
            'class': 'plugin'
        }).inject(this.pluginTBody);

        var idTd = new Element('td').inject(tr);
        var classTd = new Element('td').inject(tr);
        var methodTd = new Element('td').inject(tr);
        var titleTd = new Element('td').inject(tr);
        var actionTd = new Element('td').inject(tr);

        tr.pluginOptions = pPlugin.options;
        tr.pluginRoutes = pPlugin.routes;

        var mod = this.mod.substr(0, 1).toUpperCase() + this.mod.substr(1);
        var clazz = '\\' + mod + '\\Plugin\\';

        tr.pluginId = new jarves.Field({
            type: 'text',
            modifier: 'phpclass',
            noWrapper: true
        }, idTd);

        tr.pluginPhpClass = new jarves.Field({
            type: 'text',
            modifier: 'phpclass',
            noWrapper: true
        }, classTd);

        tr.pluginPhpMethod = new jarves.Field({
            type: 'text',
            modifier: 'phpmethod',
            noWrapper: true
        }, methodTd);

        tr.pluginLabel = new jarves.Field({
            type: 'text',
            noWrapper: true
        }, titleTd);

        tr.pluginId.setValue(pKey ? pKey : '');
        tr.pluginPhpClass.setValue(pPlugin && pPlugin['class'] ? pPlugin['class'] : clazz);
        tr.pluginPhpMethod.setValue(pPlugin && pPlugin.method ? pPlugin.method : '');
        tr.pluginLabel.setValue(pPlugin && pPlugin.label) ? pPlugin.label : '';

        new jarves.Button(t('Options')).addEvent('click', function() {
            var dialog = new jarves.Dialog(this.win, {
                withButtons: true,
                title: tf('Options of `%s`', tr.pluginLabel.getValue())
            });

            var fieldTable = new jarves.FieldTable(dialog.getContentContainer(), this.win, {
                arrayKey: true
            });

            dialog.addEvent('apply', function() {
                tr.pluginOptions = fieldTable.getValue();
            });

            if (tr.pluginOptions) {
                fieldTable.setValue(tr.pluginOptions);
            }

            dialog.center(true);
        }.bind(this)).inject(actionTd);

        new jarves.Button(t('Routes')).addEvent('click', function() {
            var dialog = new jarves.Dialog(this.win, {
                withButtons: true,
                minWidth: '80%',
                title: tf('Routes of `%s`', tr.pluginLabel.getValue())
            });

            var routes = new jarves.Field({
                type: 'array',
                width: 'auto',
                withOrder: true,
                tableLayout: true,
                addText: t('Add route'),
                columns: [
                    {label: 'Pattern', width: 150},
                    {label: 'Defaults'},
                    {label: 'Requirements'}
                ],
                fields: {
                    pattern: {
                        type: 'text',
                        required: true
                    },
                    defaults: {
                        type: 'array',
                        asHash: true,
                        tableLayout: true,
                        addText: t('Add default'),
                        columns: [
                            {label: 'Key'},
                            {label: 'value'}
                        ],
                        fields: {
                            key: {
                                type: 'text',
                                required: true
                            },
                            value: {
                                type: 'text',
                                required: true
                            }
                        }
                    },
                    requirements: {
                        type: 'array',
                        asHash: true,
                        tableLayout: true,
                        addText: t('Add requirement'),
                        columns: [
                            {label: 'Key'},
                            {label: 'RegEx'}
                        ],
                        fields: {
                            key: {
                                type: 'text',
                                required: true
                            },
                            regex: {
                                type: 'text',
                                required: true
                            }
                        }
                    }
                }
            }, dialog.getContentContainer());

            dialog.addEvent('apply', function() {
                tr.pluginRoutes = routes.getValue();
            });

            if (tr.pluginRoutes) {
                routes.setValue(tr.pluginRoutes);
            }

            dialog.center(true);
        }.bind(this)).inject(actionTd);

        new Element('a', {
            style: "cursor: pointer; font-family: 'icomoon'; padding: 0px 2px;",
            title: t('Delete plugin'),
            html: '&#xe26b;'
        }).addEvent('click', function() {
                this.win._confirm(t('Really delete'), function(ok) {
                    if (!ok) {
                        return;
                    }
                    tr.destroy();
                });
            }.bind(this)).inject(actionTd);

        new Element('a', {
            style: "cursor: pointer; font-family: 'icomoon'; padding: 0px 2px;",
            title: t('Move up'),
            html: '&#xe2ca;'
        }).addEvent('click',function() {
                var previous = tr.getPrevious();
                if (previous.getElement('th')) {
                    return;
                }

                tr.inject(previous.getPrevious(), 'before');
            }).inject(actionTd);

        new Element('a', {
            style: "cursor: pointer; font-family: 'icomoon'; padding: 0px 2px;",
            title: t('Move down'),
            html: '&#xe2cc;'
        }).addEvent('click',function() {
                if (!tr.getNext()) {
                    return false;
                }
                tr.inject(tr.getNext(), 'after');
            }).inject(actionTd);

    },

    /*
     * 
     * Documentation
     *
     */


    saveDocu: function() {
        if (this.lr) {
            this.lr.cancel();
        }
        this.lr = new Request.JSON({
            url: _pathAdmin + 'admin/system/bundle/editor/docu?bundle=' + this.mod,
            noCache: 1,
            saveStatusButton: this.saveBtn
        }).post({text: this.text.getValue()});
    },

    loadDocu: function() {

        if (this.lr) {
            this.lr.cancel();
        }
        this.panes['docu'].empty();
        var p = new Element('div', {
            'class': 'jarves-system-modules-edit-pane',
            style: 'bottom: 40px;'
        }).inject(this.panes['docu']);

        var buttonBar = new jarves.ButtonBar(this.panes['docu']);
        var saveBtn = buttonBar.addButton(t('Save'), this.saveDocu.bind(this));

        saveBtn.setButtonStyle('blue');

        this.text = new jarves.Field({
            label: t('Documentation'),
            width: 'auto',
            inputHeight: 'auto',
            type: 'textarea',
            desc: t('This displays the content of ./Resources/doc/index.md. Markdown format.'),
            readMore: 'http://en.wikipedia.org/wiki/Markdown'
        }, p, {win: this.win});
        this.text.setValue(t('Loading ...'));

        this.lr = new Request.JSON({url: _pathAdmin + 'admin/system/bundle/editor/docu', noCache: 1, onComplete: function(response) {
            this.text.setValue(response.data || '');
        }.bind(this)}).get({bundle: this.mod});

        this.win.setLoading(false);
    },

    saveWindows: function() {

    },

    loadWindows: function() {
        if (this.lr) {
            this.lr.cancel();
        }
        this.lr = new Request.JSON({url: _pathAdmin + 'admin/system/bundle/editor/windows', noCache: 1,
            onComplete: function(pResult) {
                this.win.setLoading(false);
                this._renderWindows(pResult.data);
            }.bind(this)}).get({bundle: this.mod});
    },

    _renderWindows: function(pWindows) {

        this.panes['windows'].empty();

        var p = new Element('div', {
            'class': 'jarves-system-modules-edit-pane',
            style: 'bottom: 40px;'
        }).inject(this.panes['windows']);
        this.windowsPaneItems = p;

        this.windowsTBody = new Element('table', {
            'class': 'jarves-Table-head jarves-Table-body jarves-Table-hover',
            style: 'position: relative; top: 0px; background-color: #eee',
            cellpadding: 0, cellspacing: 0
        }).inject(this.windowsPaneItems);

        var tr = new Element('tr').inject(this.windowsTBody);
        new Element('th', {
            text: t('Class name'),
            style: 'width: 260px;'
        }).inject(tr);

        new Element('th', {
            text: t('Class file'),
            style: 'width: 360px;'
        }).inject(tr);

        new Element('th', {
            text: t('Actions'),
            style: 'width: 80px;'
        }).inject(tr);

        Object.each(pWindows, function(form, key) {
            this.addWindow(key, form);
        }.bind(this));

        var buttonBar = new jarves.ButtonBar(this.panes['windows']);
        buttonBar.addButton(t('Add window'), function() {
            this.createWindow('');
        }.bind(this));
    },

    createWindow: function(pName) {

        var dialog = this.win.newDialog(new Element('h2', {text: t('New Window')}));
        dialog.setStyle('width', '80%');

        var d = new Element('div', {
            style: 'padding: 5px 0px;'
        }).inject(dialog.content);

        var table = new Element('table', {width: '100%', cellpadding: 2}).inject(d);
        var tbody = table;

        var tr = new Element('tr').inject(tbody);
        var classPrefix = '\\' + this.mod.substr(0, this.mod.lastIndexOf('\\')).ucfirst() + '\\';

        new Element('td', {width: 250, text: t('PHP class:')}).inject(tr);
        var td = new Element('td', {
            width: '10%',
            style: 'color: gray',
            align: 'right',
            text: classPrefix
        }).inject(tr);
        var td = new Element('td').inject(tr);

        var name = new jarves.Field({
            type: 'text',
            noWrapper: true,
            modifier: 'phpclass'
        }, td);

        name.setValue('Controller\\Admin\\');

        this.newWindowDialogCancelBtn = new jarves.Button(t('Cancel')).addEvent('click',function() {
            dialog.close();
        }).inject(dialog.bottom);

        this.newWindowDialogApplyBtn = new jarves.Button(t('Apply')).addEvent('click', function() {

            if (name.value == '') {

                this.win._alert(t('Class name is empty'));
                return;
            }

            this.newWindowDialogCancelBtn.deactivate();
            this.newWindowDialogApplyBtn.deactivate();
            this.newWindowDialogApplyBtn.startTip(t('Please wait ...'));

            new Request.JSON({url: _pathAdmin + 'admin/system/bundle/editor/window', noCache: 1,
                noErrorReporting: ['FileAlreadyExistException'],
                onComplete: function(pResponse) {

                    this.newWindowDialogApplyBtn.stopTip();

                    if (pResponse.error) {
                        this.newWindowDialogApplyBtn.stopTip(t('Error: %s', pResponse.message));
                    }

                    this.newWindowDialogCancelBtn.activate();
                    this.newWindowDialogApplyBtn.activate();

                    if (!pResponse.error) {
                        this.loadWindows();
                        dialog.close();
                    }

                }.bind(this)}).put({'class': name.getValue(), bundle: this.mod});

        }.bind(this)).inject(dialog.bottom);

        dialog.center();

    },

    addWindow: function(pClassPath, pClassName) {

        var className = this.windowsTBody.getLast().hasClass('two') ? 'one' : 'two';

        var tr = new Element('tr', {
            'class': className
        }).inject(this.windowsTBody);

        var td = new Element('td', {
            text: pClassName,
            style: 'white-space: normal;'
        }).inject(tr);

        var td = new Element('td', {
            text: pClassPath,
            style: 'white-space: normal;'
        }).inject(tr);

        var td = new Element('td').inject(tr);

        new jarves.Button(t('Edit window')).addEvent('click', function() {
            jarves.wm.open('jarvesbundle/system/module/editWindow', {bundle: this.mod, className: pClassName});
        }.bind(this)).inject(td);

        new Element('a', {
            style: "cursor: pointer; font-family: 'icomoon'; padding: 0px 2px;",
            title: t('Remove'),
            html: '&#xe26b;'
        }).addEvent('click', function() {
                tr.destroy();
            }.bind(this)).inject(td);

    },

    /**
     *
     *
     * Database form
     *
     *
     */
    loadDb: function() {
        if (this.lr) {
            this.lr.cancel();
        }
        this.lr = new Request.JSON({url: _pathAdmin + 'admin/system/bundle/editor/model', noCache: 1, onComplete: function(res) {
            this.win.setLoading(false);
            this._renderDb(res.data);
        }.bind(this)}).get({bundle: this.mod});
    },

    saveDb: function(andUpdate) {
        var req = {};
        req.model = this.dbEditor.getValue();

        if (this.lr) {
            this.lr.cancel();
        }

        this.lr = new Request.JSON({
            url: _pathAdmin + 'admin/system/bundle/editor/model?bundle=' + this.mod,
            noCache: 1,
            saveStatusButton: this.saveBtn,
            onComplete: function() {
                if (true === andUpdate) {
                    this.updateORM();
                }
                jarves.loadSettings();
            }.bind(this)}).post(req);
    },

    _renderDb: function(pModel) {
        this.panes['model'].empty();

        this.dbEditorPane = new Element('div', {
            'class': 'jarves-system-modules-edit-pane',
            style: 'bottom: 40px; padding: 0;'
        }).inject(this.panes['model']);

        this.dbEditor = new jarves.Field({
            type: 'codemirror',
            noWrapper: 1,
            input_height: '100%'
        }, this.dbEditorPane);

        this.dbEditor.setValue(pModel.content);
        var buttonBar = new jarves.ButtonBar(this.panes['model']);

        var info = new Element('div', {
            style: 'position: absolute; left: 5px; top: 0; color: gray;',
            text: pModel.path + ', '
        }).inject(document.id(buttonBar));

        new Element('a', {
            text: t('XML Schema'),
            target: '_blank',
            href: 'http://www.propelorm.org/reference/schema.html'
        }).inject(info);

        new Element('span', {text: ', '}).inject(info);

        new Element('a', {
            text: t('Propel Basics'),
            target: '_blank',
            href: 'http://www.propelorm.org/documentation/02-buildtime.html'
        }).inject(info);

        this.saveButton = buttonBar.addButton(t('Save'), this.saveDb.bind(this));
        this.currentbutton = buttonBar.addButton(t('Save and build'), this.saveDb.bind(this, [true]));
        this.saveButton.setButtonStyle('blue');
    },

    /*
     *  Help
     */

    loadHelp: function() {
        if (this.lr) {
            this.lr.cancel();
        }

        this.lr = new Request.JSON({url: _pathAdmin + 'admin/system/bundle/getHelp',
            noCache: 1,
            onSuccess: function(res) {
                this.win.setLoading(false);
                this._renderHelp(res);
            }.bind(this)}).get({bundle: this.mod/*, lang: this.languageSelect.value*/});
    },

    _renderHelp: function(pHelp) {
        this.panes['help'].empty();

        this.helpPane = new Element('div', {
            'class': 'jarves-system-modules-edit-pane',
            style: 'bottom: 40px;'
        }).inject(this.panes['help']);

        Object.each(pHelp, function(item, index) {
            this.addHelpItem(item);
        }.bind(this));

        var buttonBar = new jarves.ButtonBar(this.panes['help']);
        buttonBar.addButton(t('Add help'), this.addHelpItem.bind(this));
        buttonBar.addButton(t('Save'), this.saveHelp.bind(this));

    },

    saveHelp: function() {
        var req = {};
        var items = [];
        this.helpPane.getElements('div.jarves-system-module-help').each(function(div) {

            var item = {};
            item.title = div.getElements('input')[0].value;
            item.tags = div.getElements('input')[1].value;
            item.id = div.getElements('input')[2].value;
            item.faq = (div.getElements('input')[3].checked) ? 1 : 0;
            item.help = div.getElement('textarea').value;
            items.include(item);

        }.bind(this));

        this.lr = new Request.JSON({url: _pathAdmin + 'admin/system/bundle/saveHelp?bundle=' + this.mod,
            noCache: 1,
            saveStatusButton: this.saveBtn
        }).post(req);
    },

    addHelpItem: function(pItem) {
        if (!pItem) {
            pItem = {};
        }
        var main = new Element('div', {
            'class': 'jarves-system-module-help',
            style: 'padding: 5px; border-bottom: 1px solid #ddd; margin: 5px;'
        }).inject(this.helpPane);

        new Element('span', {html: t('Title'), style: 'padding-right: 3px;'}).inject(main);
        new Element('input', {
            'class': 'text',
            style: 'width: 200px;',
            value: pItem.title
        }).inject(main);

        new Element('span', {html: t('Tags'), style: 'padding: 0px 3px;'}).inject(main);
        new Element('input', {
            'class': 'text',
            value: pItem.tags
        }).inject(main);

        new Element('span', {html: t('ID'), style: 'padding: 0px 3px;'}).inject(main);
        new Element('input', {
            'class': 'text',
            value: pItem.id
        }).inject(main);

        new Element('span', {html: t('FAQ?'), style: 'padding: 0px 3px;'}).inject(main);
        new Element('input', {
            type: 'checkbox',
            value: 1,
            checked: (pItem.faq == 1) ? true : false
        }).inject(main);

        new Element('a', {
            style: "cursor: pointer; font-family: 'icomoon'; padding: 0px 2px;",
            title: _('Remove'),
            html: '&#xe26b;'
        }).addEvent('click', function() {
                main.destroy();
            }.bind(this)).inject(main);

        new Element('textarea', {
            value: pItem.help,
            style: 'width: 100%; height: 100px;'
        }).inject(main);

    },

    loadLinks: function() {
        if (this.lr) {
            this.lr.cancel();
        }

        this.lr = new Request.JSON({url: _pathAdmin + 'admin/system/bundle/editor/entry-points', noCache: 1, onComplete: function(res) {
            this.win.setLoading(false);
            this._renderLinks(res.data);
        }.bind(this)}).get({bundle: this.mod});
    },

    _renderLinks: function(entryPoints) {
        this.panes['entryPoints'].empty();

        var p = new Element('div', {
            'class': 'jarves-system-modules-edit-pane',
            style: 'bottom: 40px; padding: 5px;'
        }).inject(this.panes['entryPoints']);

        this.entryPointsTable = new Element('table', {
            'class': 'jarves-Table-body jarves-Table-hover'
        });

        this.entryPointsHeader = new Element('table', {
            'class': 'jarves-Table-head'
        });

        var tr = new Element('tr').inject(this.entryPointsHeader);
        new Element('th', {text: 'Key'}).inject(tr);
        new Element('th', {width: 250, text: 'Title'}).inject(tr);
        new Element('th', {width: 250, text: 'Type'}).inject(tr);
        new Element('th', {width: 250, text: 'Actions'}).inject(tr);

        this.entryPointsHeader.inject(p);
        this.entryPointsTable.inject(p);

        this.entryPointSettingsFields = {
            label: {
                label: t('Label'),
                required: true,
                desc: t('Surround the value with [[ and ]] to make it multilingual.')
            },
            type: {
                label: t('Type'),
                type: 'select',
                items: {
                    'acl': t('Default'),
                    store: t('Store'),
                    'function': t('Background function'),
                    custom: t('[Window] Custom'),
                    iframe: t('[Window] iFrame'),
                    list: t('[Window] Framework list'),
                    edit: t('[Window] Framework edit'),
                    add: t('[Window] Framework add'),
                    combine: t('[Window] Framework Combine')
                },
                children: {
                    'class': {
                        label: t('PHP Class'),
                        desc: t('Example: \Module\Admin\ObjectList'),
                        modifier: 'phpclass',
                        required: true,
                        needValue: ['list', 'edit', 'add', 'combine', 'store']
                    },
                    'javascriptClass': {
                        label: t('Custom javascript user interface class (Optional)'),
                        desc: t('Should be extended from jarves.WindowList, jarves.WindowEdit, jarves.WindowAdd or jarves.WindowCombine.'),
                        'default': '',
                        needValue: ['list', 'edit', 'add', 'combine']
                    },
                    functionType: {
                        needValue: 'function',
                        type: 'select',
                        label: t('Function type'),
                        items: {
                            global: t('Call global defined function'),
                            code: t('Execture code')
                        },
                        children: {
                            functionName: {
                                type: 'text',
                                label: t('Function name'),
                                needValue: 'global'
                            },
                            functionCode: {
                                type: 'codemirror',
                                needValue: 'code',
                                codemirrorOptions: {
                                    mode: 'javascript'
                                },
                                label: t('Javascript code')
                            }
                        }
                    },
                    __or__: {
                        label: t('or'),
                        type: 'label',
                        needValue: 'store'
                    },
                    table: {
                        label: t('Table'),
                        needValue: 'store',
                        children: {
                            table_key: {
                                label: t('Table primary column'),
                                needValue: function(n) {
                                    if (n != '') {
                                        return true;
                                    } else {
                                        return false;
                                    }
                                }
                            },
                            table_label: {
                                label: t('Table label column'),
                                needValue: function(n) {
                                    if (n != '') {
                                        return true;
                                    } else {
                                        return false;
                                    }
                                }

                            }
                        }
                    },
                    '__info_js_name__': {
                        type: 'label',
                        needValue: 'custom',
                        label: t('File name and class information'),
                        help: 'admin/extension-custom-javascript',
                        desc: t('Javascript file: &lt;extKey&gt;/admin/js/&lt;pathWithUnderscore&gt;.js and class name: &lt;extKey&gt;_&lt;pathWithUnderscore&gt;.')
                    }
                }
            },
            link: {
                label: t('Is link in administration menu bar?'),
                desc: t('Only in the first and second level.'),
                type: 'checkbox',
                needValue: ['list', 'add', 'edit', 'combine', 'custom'],
                againstField: 'type',
                children: {
                    icon: {
                        needValue: 1,
                        label: t('Icon (Optional)'),
                        desc: t('Relative to /web/'),
                        type: 'text'
                    },
                    system: {
                        label: t('Is link under System menu?'),
                        desc: t('Only in the first and second level.'),
                        type: 'checkbox',
                        needValue: 1
                    }
                }
            },
            __optional__: {
                label: t('More optional'),
                type: 'childrenSwitcher',
                needValue: ['custom', 'iframe', 'list', 'edit', 'add', 'combine'],
                againstField: 'type',
                children: {
                    multi: {
                        label: t('Allow multiple instances?'),
                        needValue: ['custom', 'iframe', 'list', 'edit', 'add', 'combine'],
                        againstField: 'type',
                        'default': '',
                        type: 'checkbox'
                    }
                }
            }
        };

        if (entryPoints) {
            Object.each(entryPoints, function(link, key) {
                this.entryPointsAdd(key, link, this.entryPointsTable);
            }.bind(this));
        }

        var buttonBar = new jarves.ButtonBar(this.panes['entryPoints']);

        buttonBar.addButton(t('Add link'), function() {
            var count = this.entryPointsTable.getElements('tr').length;
            this.entryPointsAdd('first_lvl_id_' + (count + 1), {}, this.entryPointsTable);
        }.bind(this));

        this.entryPointsSaveButton = buttonBar.addButton(t('Save'), this.saveLinks.bind(this));
        this.entryPointsSaveButton.setButtonStyle('blue');

    },

    entryPointsAdd: function(pKey, pDefinition, pContainer) {

        if (pContainer.get('tag') == 'tr') {
            if (!pContainer.childContainer) {
                var childTr = new Element('tr', {'class': 'jarves-entryPoint-childrenContainer'}).inject(pContainer, 'after');
                var childTd = new Element('td', {colspan: 4}).inject(childTr);
                var childDiv = new Element('div', {style: 'margin-left: 25px;'}).inject(childTd);
                pContainer.childTr = childTr;
                pContainer.childContainer = new Element('table', {width: '100%'}).inject(childDiv);
            }
            pContainer = pContainer.childContainer;
        }

        var tr = new Element('tr', {'class': 'jarves-entryPoint-item'}).inject(pContainer);

        //KEY
        var td = new Element('td').inject(tr);
        var div = new Element('div', {style: 'position: relative;'}).inject(td);
        new Element('div', {'class': 'icon-arrow-right-5', style: 'position: absolute; left: -15px;'}).inject(div);

        tr.definition = pDefinition;

        tr.key = new jarves.Field({
            type: 'text',
            noWrapper: true,
            modifier: 'dash|trim'
        }, td);

        tr.getValue = function() {

            tr.definition.type = tr.typeField.getValue();
            tr.definition.title = tr.titleField.getValue();
            tr.definition.path = tr.key.getValue();
            var data = tr.definition;

            if (tr.childContainer) {
                data.children = [];
                tr.childContainer.getChildren('.jarves-entryPoint-item').each(function(item) {
                    var itemValue = item.getValue();
                    data.children.push(itemValue);
                });
            }

            return data; //{key: tr.key.getValue(), definition: data};

        };

        if (pKey) {
            tr.key.setValue(pKey);
        }

        //TITLE
        td = new Element('td', {width: 250}).inject(tr);

        tr.titleField = new jarves.Field({
            type: 'text',
            noWrapper: true
        }, td);

        if (pDefinition && pDefinition.label) {
            tr.titleField.setValue(pDefinition.label);
        }

        //TYPE
        td = new Element('td', {width: 250}).inject(tr);

        var typeField = Object.clone(this.entryPointSettingsFields.type);
        delete typeField.children;
        typeField.noWrapper = true;
        tr.typeField = new jarves.Field(typeField, td);

        if (pDefinition && pDefinition.type) {
            tr.typeField.setValue(pDefinition.type);
        }

        //ACTIONS
        var tdActions = new Element('td', {width: 250}).inject(tr);

        new jarves.Button(t('Settings')).addEvent('click', function() {

            var dialog = this.win.newDialog('', true);

            dialog.setStyle('width', '90%');
            dialog.setStyle('height', '90%');

            var applyBtn = new jarves.Button(t('Apply'));

            var fieldObject = new jarves.FieldForm(dialog.content, this.entryPointSettingsFields, {
                allTableItems: true,
                tableItemLabelWidth: 300,
                saveButton: applyBtn
            });

            fieldObject.setValue(tr.definition);

            fieldObject.getField('type').setValue(tr.typeField.getValue(), true);
            fieldObject.getField('label').setValue(tr.titleField.getValue(), true);

            new jarves.Button(t('Cancel')).addEvent('click', dialog.closeAnimated).inject(dialog.bottom);

            applyBtn.addEvent('click', function() {
                if (!fieldObject.isValid()) {
                    return;
                }

                tr.definition = fieldObject.getValue();
                tr.typeField.setValue(tr.definition.type);
                tr.titleField.setValue(tr.definition.label);

                dialog.close();

            }.bind(this)).setButtonStyle('blue').inject(dialog.bottom);

            dialog.center(true);

        }.bind(this)).inject(tdActions);

        new Element('a', {
            style: "cursor: pointer; font-family: 'icomoon'; padding: 0px 5px;",
            title: t('Add children'),
            html: '&#xe109;'
        }).addEvent('click', function() {
                this.entryPointsAdd('', {}, tr);
            }.bind(this)).inject(tdActions);

        new Element('a', {
            style: "cursor: pointer; font-family: 'icomoon'; padding: 0px 5px;",
            title: _('Remove'),
            html: '&#xe26b;'
        }).addEvent('click', function() {
                this.win._confirm(t('Really delete?'), function(ok) {
                    if (ok) {
                        tr.fireEvent('delete');
                        tr.removeEvents('change');
                        tr.destroy();
                        if (tr.childTr) {
                            tr.childTr.destroy();
                        }
                    }
                }.bind(this));
            }.bind(this)).inject(tdActions);

        new Element('a', {
            style: "cursor: pointer; font-family: 'icomoon'; padding: 0px 2px;",
            title: t('Move up'),
            html: '&#xe2ca;'
        }).addEvent('click', function() {

                var previous = tr.getPrevious('.jarves-entryPoint-item');
                if (!previous) {
                    return;
                }
                tr.inject(previous, 'before');

                if (tr.childTr) {
                    tr.childTr.inject(tr, 'after');
                }

            }.bind(this)).inject(tdActions);

        new Element('a', {
            style: "cursor: pointer; font-family: 'icomoon'; padding: 0px 2px;",
            title: t('Move down'),
            html: '&#xe2cc;'
        }).addEvent('click', function() {

                var next = tr.getNext('.jarves-entryPoint-item');
                if (!next) {
                    return;
                }
                tr.inject(next.childTr || next, 'after');

                if (tr.childTr) {
                    tr.childTr.inject(tr, 'after');
                }

            }.bind(this)).inject(tdActions);

        new Element('a', {
            style: "cursor: pointer; font-family: 'icomoon'; padding: 0px 2px;",
            title: t('Open'),
            html: '&#xe28d;'
        }).addEvent('click', function() {

                if (['list', 'add', 'edit', 'combine', 'custom'].contains(tr.definition.type)) {
                    var extension = this.mod;
                    var parent = tr, code = tr.key.getValue();
                    while ((parent = parent.getParent('.jarves-entryPoint-childrenContainer')) && (parent = parent.getPrevious('.jarves-entryPoint-item'))) {

                        code = parent.key.getValue() + '/' + code;
                    }
                    code = extension + '/' + code;
                    jarves.wm.open(code);
                    logger(code);
                }

            }.bind(this)).inject(tdActions);

        if (pDefinition.children) {
            Object.each(pDefinition.children, function(link, key) {
                this.entryPointsAdd(key, link, tr);
            }.bind(this));
        }

    },

    saveLinks: function() {

        var entryPoints = [];

        this.entryPointsTable.getChildren('.jarves-entryPoint-item').each(function(item) {
            var itemData = item.getValue();
            entryPoints.push(itemData);
        });

        this.lr = new Request.JSON({url: _pathAdmin + 'admin/system/bundle/editor/entry-points?bundle=' + decodeURIComponent(this.mod),
            noCache: 1,
            saveStatusButton: this.entryPointsSaveButton,
            onComplete: function() {
                jarves.loadSettings();
                jarves.adminInterface.loadMenu();
            }.bind(this)
        }).post({entryPoints: entryPoints});

    },

    _getLayoutSetting: function(pLayoutItem) {
        var res = {};

        var kaParser = pLayoutItem.retrieve('kaparser');
        res = kaParser.getValue();

        Object.each(res, function(v, k) {
            if (v === '') {
                delete res[k];
            }
        });

        res['childs'] = {};

        pLayoutItem.getElement('.layoutChilds').getChildren('.jarves-extension-manager-links-item').each(function(item) {
            var input = item.getElement('input');
            res['childs'][input.value ] = this._getLayoutSetting(item);
        }.bind(this));

        return res;
    },

    _loadGeneral: function(pConfig) {
        this.panes['general'].empty();

        var p = new Element('div', {
            'class': 'jarves-system-modules-edit-pane',
            style: 'bottom: 40px;'
        }).inject(this.panes['general']);

        var fields = {
            name: {
                label: t('Name'),
                type: 'text',
                required: true,
                requiredRegex: '^([a-zA-Z0-9_-]+)/([a-zA-Z0-9_.-]+)$',
                desc: t('Should be in format &lt;vendor&gt;/&lt;name&gt;. Example: peter/blog'),
                readMore: 'http://getcomposer.org/doc/01-basic-usage.md#package-names',
                required: true
            },
            description: {
                label: t('Description'),
                type: 'textarea'
            },
            license: {
                label: t('License'),
                type: 'text'
            },
            keywords: {
                label: t('Keywords'),
                type: 'array',
                asArray: true,
                columns: [
                    {label: t('Keyword'), width: '100%'}
                ],
                fields: {
                    tag: {
                        type: 'text'
                    }
                }
            },
            version: {
                label: t('Version'),
                type: 'text',
                readMore: 'http://getcomposer.org/doc/01-basic-usage.md#package-versions',
                desc: t('Composer uses VCS repositories, so you can specify own branches or git tags to specify a version. Use this field only if you provide this package not through a VCS.')
            },
            screenshots: {
                label: t('Screenshots'),
                type: 'text',
                desc: t('Screenshots in %s').replace('%s', pConfig._path + 'Resources/screenshots/'),
                disabled: true
            },
            //            version: {
            //                label: t('Version'),
            //                required: true,
            //                type: 'text'
            //            },
            authors: {
                label: t('Authors'),
                desc: t(''),
                type: 'array',
                withOrder: true,
                columns: [
                    {label: t('Name'), width: '30%'},
                    {label: t('Homepage')},
                    {label: t('Email'), width: '30%'}
                ],
                fields: {
                    name: {
                        type: 'text'
                    },
                    homepage: {
                        type: 'text'
                    },
                    email: {
                        type: 'text'
                    }
                }
            },
            require: {
                label: t('Dependencies'),
                desc: t(''),
                readMore: 'http://getcomposer.org/doc/01-basic-usage.md#package-versions',
                type: 'array',
                asHash: true,
                withOrder: true,
                columns: [
                    {label: t('Package name'), width: '60%'},
                    {label: t('Version constraint')}
                ],
                fields: {
                    name: {
                        type: 'text'
                    },
                    version: {
                        type: 'text'
                    }
                }
            },
            community: {
                label: t('Community'),
                type: 'checkbox',
                desc: t('Is this extension available under jarves.io/bundles.')
            },
            category: {
                label: t('Category'),
                desc: t('What kind of extension is this?'),
                type: 'select',
                items: {
                    1: 'Information/Editorial office',
                    2: 'Multimedia',
                    3: 'SEO',
                    4: 'Widget',
                    5: 'Statistic',
                    6: 'Community',
                    7: 'Interface',
                    8: 'System',
                    9: 'Advertisement',
                    10: 'Security',
                    11: 'ECommerce',
                    12: 'Download / Documents',
                    13: 'Theme / Layouts',
                    14: 'Language package',
                    15: 'Data acquisition',
                    16: 'Collaboration'
                }
            }
        }

        var buttonBar = new jarves.ButtonBar(this.panes['general']);
        this.saveBtn = buttonBar.addButton(t('Save'), this.saveGeneral.bind(this));
        this.saveBtn.setButtonStyle('blue');

        this.generalFieldsObj = new jarves.FieldForm(p, fields, {allTableItems: 1, saveButton: this.saveBtn});

        var value = pConfig;

        value.screenshots = 'No Screenshots found';
        if (pConfig.screenshots) {
            value.screenshots = pConfig.screenshots.length;
        }

        if (jarves.settings.system.communityId > 0 && !pConfig.owner > 0) {
            var ownerField = this.generalFieldsObj.getField('owner');
            new jarves.Button(t('Set to my extension: ' + jarves.settings.system.communityEmail)).addEvent('click', function() {
                this.setToMyExtension = jarves.settings.system.communityId;
                ownerField.setValue(jarves.settings.system.communityEmail);
            }.bind(this)).inject(document.id(ownerField).getElement('.jarves-field-field'));
        }

        this.generalFieldsObj.setValue(value);

    },

    saveGeneral: function() {
        var req = this.generalFieldsObj.getValue();

        this.lr = new Request.JSON({url: _pathAdmin + 'admin/system/bundle/editor/config?bundle=' + decodeURIComponent(this.mod),
            saveStatusButton: this.saveBtn
        }).post(req);
    },

    loadGeneral: function() {
        this.win.setLoading(true, t('Loading ...'));
        if (this.lr) {
            this.lr.cancel();
        }
        this.lr = new Request.JSON({url: _pathAdmin + 'admin/system/bundle/editor/config', noCache: 1, onComplete: function(pResult) {
            this._loadGeneral(pResult.data);
            this.win.setLoading(false);
        }.bind(this)}).get({bundle: this.mod});
    },

    loadLayouts: function() {
        this.win.setLoading(true, t('Loading ...'));
        if (this.lr) {
            this.lr.cancel();
        }
        this.lr = new Request.JSON({url: _pathAdmin + 'admin/system/bundle/editor/themes', noCache: 1, onComplete: function(pResult) {
            this.setupThemes(pResult.data);
            this.win.setLoading(false);
        }.bind(this)}).get({bundle: this.mod});
    },

    setupThemes: function(themes) {
        this.panes['themes'].empty();
        var p = new Element('div', {
            'class': 'jarves-system-modules-edit-pane',
            style: 'bottom: 40px;'
        }).inject(this.panes['themes']);

	    var bundleName = jarves.getBundleName(this.mod);

        this.themes = new jarves.Field({
            type: 'array',
            width: 'auto',
            noWrapper: true,
            columns: [
                {label: t('Id'), width: 150},
                {label: t('Label')},
                {label: t('Actions'), width: 250}
            ],
            fields: {
                id: {
                    type: 'text',
                    modifier: 'camelcase|trim|'
                },
                label: {
                    type: 'text'
                },
                __container__: {
                    type: 'container',
                    children: {
                        __options__: {
                            type: 'dialog',
                            label: 'Options',
                            minWidth: '80%',
                            noWrapper: true,
                            children: {
                                options: {
                                    label: 'Options',
                                    width: 'auto',
                                    type: 'fieldTable'
                                }
                            }
                        },
                        __contents__: {
                            type: 'dialog',
                            label: 'Content Layouts',
                            noWrapper: true,
                            children: {
                                contents: {
                                    label: 'Content Layouts',
                                    type: 'array',
                                    columns: [
                                        {label: t('Label')},
                                        {label: t('View')}
                                    ],
                                    fields: {
                                        label: {
                                            type: 'text'
                                        },
                                        file: {
                                            type: 'view',
                                            fullPath: true,
                                            directory: '@' + bundleName
                                        }
                                    }
                                }
                            }
                        },
                        __layouts__: {
                            type: 'dialog',
                            label: 'Page Layouts',
                            noWrapper: true,
                            children: {
	                            '__info__': {
		                            type: 'info',
		                            label: t('Here you should define your page layouts. Use the predefined layouts to allow a user to change all layouts of their sites at once.')
	                            },
	                            'startpage': {
		                            label: 'Startpage',
		                            type: 'view',
		                            fullPath: true,
		                            directory: '@' + bundleName
	                            },
	                            'default': {
		                            label: 'Default',
		                            type: 'view',
		                            fullPath: true,
		                            directory: '@' + bundleName
	                            },
	                            'full': {
		                            label: 'Full',
		                            type: 'view',
		                            fullPath: true,
		                            directory: '@' + bundleName
	                            },
	                            'notFound': {
		                            label: '404 - Not Found',
		                            type: 'view',
		                            fullPath: true,
		                            directory: '@' + bundleName
	                            },
	                            'accessDenied': {
		                            label: 'Access Denied',
		                            type: 'view',
		                            fullPath: true,
		                            directory: '@' + bundleName
	                            },
                                layouts: {
                                    label: 'Extra Layouts',
                                    type: 'array',
                                    columns: [
                                        {label: t('key')},
                                        {label: t('Label')},
                                        {label: t('View')}
                                    ],
                                    fields: {
                                        key: {
                                            type: 'text'
                                        },
                                        label: {
                                            type: 'text'
                                        },
                                        file: {
                                            type: 'view',
                                            fullPath: true,
                                            directory: '@' + bundleName
                                        }
                                    }
                                }
                            }
                        },
                        __navigations__: {
                            type: 'dialog',
                            label: 'Navigation Layouts',
                            noWrapper: true,
                            children: {
                                navigations: {
                                    label: 'Navigation Layouts',
                                    type: 'array',
                                    columns: [
                                        {label: t('Label')},
                                        {label: t('View')}
                                    ],
                                    fields: {
                                        label: {
                                            type: 'text'
                                        },
                                        file: {
                                            type: 'view',
                                            fullPath: true,
                                            directory: '@' + bundleName
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }, p);

        if ('object' === typeOf(themes)) {
            var copy = [];
            Object.each(themes, function(theme) {
                copy.push(theme);
            });
            themes = copy;
        }

        if (themes) {
	        var predefined = ['startpage', 'default', 'full', 'notFound', 'accessDenied'];
	        Array.each(themes, function(theme, idx) {
		        var layouts = [];
		        Array.each(theme.layouts, function(layout) {
			         if (predefined.contains(layout.key)) {
				         theme[layout.key] = layout.file;
			         } else {
				         layouts.push(layout);
			         }
		        }.bind(this));
		        theme.layouts = layouts;
		        console.log(theme);
	        }.bind(this));

            this.themes.setValue(themes);
        }

        var buttonBar = new jarves.ButtonBar(this.panes['themes']);

        this.saveBtn = buttonBar.addButton(t('Save'), this.saveThemes.bind(this));
        this.saveBtn.setButtonStyle('blue');
    },

    saveThemes: function() {
        var themes = this.themes.getValue();
	    var predefined = ['startpage', 'default', 'full', 'notFound', 'accessDenied'];

	    Array.each(themes, function(theme){
		    predefined.each(function(key){
			    if (theme[key]) {
				    theme.layouts.push({
					    key: key,
					    file: theme[key]
				    });
				    delete theme[key];
			    }
		    }.bind(this));
	    }.bind(this));

        if (this.lr) {
            this.lr.cancel();
        }

        this.lr = new Request.JSON({
            url: _pathAdmin + 'admin/system/bundle/editor/themes?bundle=' + this.mod,
            noCache: 1,
            saveStatusButton: this.saveBtn,
            onComplete: function() {
                jarves.loadSettings();
            }.bind(this)
        }).post({themes: themes});
    },

    _addPublicProperty: function(pContainer, pKey, pTitle, pType) {
        var li = new Element('li').inject(pContainer);

        new Element('input', {
            'class': 'text',
            style: 'width: 110px',
            value: (pKey) ? pKey : t('propertie_key')
        }).inject(li).focus();

        new Element('span', {
            text: ' : '
        }).inject(li);

        new Element('input', {
            'class': 'text',
            style: 'width: 140px;',
            value: (pTitle) ? pTitle : t('Propertie title')
        }).inject(li);

        new Element('span', {
            text: ' : '
        }).inject(li);

        var select = new Element('select', {

        }).inject(li);

        Object.each({
            text: 'Text',
            'number': 'Number',
            'checkbox': 'Checkbox',
            page: 'Page/Tray',
            file: 'File'
        }, function(title, key) {
            new Element('option', {
                html: _(title),
                value: key
            }).inject(select);
        });

        select.value = pType;

        new Element('a', {
            style: "cursor: pointer; font-family: 'icomoon'; padding: 0px 2px;",
            title: _('Remove'),
            html: '&#xe26b;'
        }).addEvent('click', function() {
                this.win._confirm(t('Really delete'), function(ok) {
                    if (!ok) {
                        return;
                    }
                    li.destroy();
                });
            }.bind(this)).inject(li);
    },

    _addThemeProperty: function(pContainer, pKey, pValue) {
        var li = new Element('li').inject(pContainer);

        new Element('input', {
            'class': 'text',
            value: (pKey) ? pKey : t('propertie_key')
        }).inject(li).focus();

        new Element('span', {
            text: ' : '
        }).inject(li);

        new Element('input', {
            'class': 'text',
            style: 'width: 200px;',
            value: (pValue) ? pValue : t('Propertie value')
        }).inject(li);

        new Element('a', {
            style: "cursor: pointer; font-family: 'icomoon'; padding: 0px 2px;",
            title: _('Remove'),
            html: '&#xe26b;'
        }).addEvent('click', function() {

                this.win._confirm(t('Really delete'), function(ok) {
                    if (!ok) {
                        return;
                    }
                    li.destroy();
                });
            }.bind(this)).inject(li);
    },

    _layoutsAddTheme: function(pTitle, pTemplates) {
        var myp = new Element('div', {'class': 'themeContainer'}).inject(this.layoutsAddThemeButton, 'before');

        new Element('input', {
            value: pTitle,
            'class': 'text themeTitle',
            style: 'margin: 4px; width: 250px;'
        }).inject(myp);

        new Element('a', {
            style: "cursor: pointer; font-family: 'icomoon'; padding: 0px 2px;",
            title: _('Remove'),
            html: '&#xe26b;'
        }).addEvent('click', function() {
                this.win._confirm(t('Really delete this theme ?'), function(res) {
                    if (!res) {
                        return;
                    }
                    myp.destroy();
                }.bind(this))
            }.bind(this)).inject(myp);

        var p = new Element('div', {
            style: 'padding-left: 20px; border-bottom: 1px solid silver; padding-bottom: 2px; margin-bottom: 2px;',
            'class': 'layoutContainer'
        }).inject(myp);

        var addTemplate = function(pLayoutTitle, pLayoutFile, pTo) {
            var li = new Element('li').inject(pTo);
            new Element('input', {
                'class': 'text', value: pLayoutTitle
            }).inject(li);
            new Element('span', {text: ' : '}).inject(li);
            var file = new Element('input', {
                'class': 'text', value: pLayoutFile, style: 'width: 200px;'
            }).inject(li);
            new Element('a', {
                style: "cursor: pointer; font-family: 'icomoon'; padding: 0px 2px;",
                title: _('Edit template'),
                html: '&#xe00f;'
            }).addEvent('click',function() {
                    jarves.wm.open('jarvesbundle/files/edit', {file: {path: '/' + file.value}});
                }).inject(li);
            new Element('a', {
                style: "cursor: pointer; font-family: 'icomoon'; padding: 0px 2px;",
                title: _('Remove'),
                html: '&#xe26b;'
            }).addEvent('click', function() {
                    this.win._confirm(t('Really delete this template ?'), function(res) {
                        if (!res) {
                            return;
                        }
                        li.destroy();
                    }.bind(this));
                }.bind(this)).inject(li);
        }.bind(this);

        //public properties
        var title = new Element('h3', {
            html: 'Public properties'
        }).inject(p);

        var publicproperties = new Element('div', {
            'class': 'publicProperties'
        }).inject(p);

        var olpp = new Element('ol').inject(publicproperties);

        new Element('img', {
            'src': _path + 'bundles/jarves/admin/images/icons/add.png',
            title: t('Add public property'),
            style: 'cursor: pointer; position: relative; top: 3px; margin-left: 3px;'
        }).addEvent('click', function() {
                this._addPublicProperty(olpp);
            }.bind(this)).inject(title);

        if (pTemplates.publicProperties) {
            Object.each(pTemplates.publicProperties, function(val, key) {
                this._addPublicProperty(olpp, key, val[0], val[1]);
            }.bind(this));
        }

        //properties
        var title = new Element('h3', {
            html: 'Theme properties'
        }).inject(p);

        var properties = new Element('div', {
            'class': 'themeProperties'
        }).inject(p);

        var ol = new Element('ol').inject(properties);

        new Element('img', {
            'src': _path + 'bundles/jarves/admin/images/icons/add.png',
            title: t('Add property'),
            style: 'cursor: pointer; position: relative; top: 3px; margin-left: 3px;'
        }).addEvent('click', function() {
                this._addThemeProperty(ol);
            }.bind(this)).inject(title);

        if (pTemplates.properties) {
            Object.each(pTemplates.properties, function(val, key) {
                this._addThemeProperty(ol, key, val);
            }.bind(this));
        }

        /// layouts
        var title = new Element('h3', {
            html: t('Layout templates')
        }).inject(p);

        this.layoutsLayoutContainer = new Element('ol', {
            'class': 'layoutContainerLayout'
        }).inject(p);
        new Element('img', {
            'src': _path + 'bundles/jarves/admin/images/icons/add.png',
            title: t('Add layout template'),
            style: 'cursor: pointer; position: relative; top: 3px; margin-left: 3px'
        }).addEvent('click', function() {
                addTemplate('My title', this.mod + '/layout_mytitle.tpl', this.layoutsLayoutContainer);
            }.bind(this)).inject(title);

        if (pTemplates.layouts) {
            Object.each(pTemplates.layouts, function(file, title) {
                addTemplate(title, file, this.layoutsLayoutContainer);
            }.bind(this));
        }

        /// contents

        var title = new Element('h3', {
            html: t('Element templates')
        }).inject(p);

        this.layoutsContentContainer = new Element('ol', {
            'class': 'layoutContainerContent'
        }).inject(p);
        new Element('img', {
            'src': _path + 'bundles/jarves/admin/images/icons/add.png',
            title: t('Add element template'),
            style: 'cursor: pointer; position: relative; top: 3px; margin-left: 3px'
        }).addEvent('click', function() {
                addTemplate('My title', this.mod + '/content_mytitle.tpl', this.layoutsContentContainer);
            }.bind(this)).inject(title);

        if (pTemplates.contents) {
            Object.each(pTemplates.contents, function(file, title) {
                addTemplate(title, file, this.layoutsContentContainer);
            }.bind(this));
        }

        /// navigations
        title = new Element('h3', {
            html: t('Navigation templates')
        }).inject(p);

        this.layoutsNavigationContainer = new Element('ol', {
            'class': 'layoutContainerNavigation'
        }).inject(p);
        new Element('img', {
            'src': _path + 'bundles/jarves/admin/images/icons/add.png',
            title: t('Add navigation template'),
            style: 'cursor: pointer; position: relative; top: 3px; margin-left: 3px'
        }).addEvent('click', function() {
                addTemplate('My title', this.mod + '/navigation_mytitle.tpl', this.layoutsNavigationContainer);
            }.bind(this)).inject(title);

        if (pTemplates.navigations) {
            Object.each(pTemplates.navigations, function(file, title) {
                addTemplate(title, file, this.layoutsNavigationContainer);
            }.bind(this));
        }

    },

    loadLanguage: function() {

        this.win.setLoading(false);

        if (this.lr) {
            this.lr.cancel();
        }
        var div = this.panes['language'];
        div.empty();

        new Element('h3', {
            text: t('Translations')
        }).inject(div);

        this.languageLanguageSelect = new jarves.Field({
            type: 'lang',
            label: 'Language'
        }, div);

        var table = new Element('table', {
            width: '100%'
        }).inject(div);
        var tr = new Element('tr').inject(table);

        var left = new Element('td').inject(tr);
        var right = new Element('td', {
            width: 100
        }).inject(tr);

        this.langProgressBars = new jarves.Progress(t('Extracting ...'), true);
        this.langProgressBars.inject(left);

        this.langTranslateBtn = new jarves.Button(t('Translate')).inject(right);
        this.langTranslateBtn.addEvent('click', function() {
            jarves.wm.open('jarvesbundle/system/languages/edit', {lang: this.languageLanguageSelect.getValue(), bundle: this.mod});
        }.bind(this));
        this.langTranslateBtn.deactivate();

        this.extractLanguage(this.languageLanguageSelect.getValue());
    },

    extractLanguage: function(language) {
        this.lr = new Request.JSON({url: _pathAdmin + 'admin/system/bundle/editor/language/overview', noCache: 1,
            onComplete: function(pResponse) {
                if (!pResponse.data) {

                    this.langProgressBars.setText('Error.');
                } else {
                    this.langProgressBars.setUnlimited(false);
                    this.langProgressBars.setValue((pResponse.data.countTranslated / pResponse.data.count) * 100);

                    this.langProgressBars.setText(_('%1 of %2 translated').replace('%1', pResponse.data.countTranslated).replace('%2', pResponse.data['count']));
                }
                this.langTranslateBtn.activate();
            }.bind(this)}).get({bundle: this.mod, lang: language});

    },

    loadObjects: function() {
        if (this.lr) {
            this.lr.cancel();
        }

        this.panes['objects'].empty();

        this.objectsPane = new Element('div', {
            'class': 'jarves-system-modules-edit-pane',
            style: 'bottom: 40px;'
        }).inject(this.panes['objects']);

        new Element('h2', {
            text: t('Objects'),
            'class': 'light'
        }).inject(this.objectsPane);

        new Element('div', {
            'class': 'jarves-description',
            text: t('Define your own objects.'),
            style: 'margin: 8px 0;'
        }).inject(this.objectsPane);

        this.objectsTable = new jarves.Table([
            [t('Object key'), 260],
            [t('Object label'), 260],
            [t('Actions')]
        ], {
            absolute: false
        }).inject(this.objectsPane);

        this.objectsPaneButtons = new Element('div', {
            style: 'margin-top: 5px; margin-bottom: 15px;'
        }).inject(this.objectsPane);

        new jarves.Button([t('Add object'), '#icon-plus-alt'])
            .addEvent('click', function(){
                this.addObject();
            }.bind(this))
            .inject(this.objectsPaneButtons);

        this.objectTBody = this.objectsTable.getBody();

        new Element('h2', {
            text: t('Attributes'),
            'class': 'light'
        }).inject(this.objectsPane);

        new Element('div', {
            'class': 'jarves-description',
            text: t('Here you can add additional fields to foreign objects.'),
            style: 'margin: 8px 0;'
        }).inject(this.objectsPane);

        this.attributesTable = new jarves.ObjectAttributeTable(this.objectsPane, this.win, {
            addLabel: t('Add attribute'),
            asModel: true
        });

        var buttonBar = new jarves.ButtonBar(this.panes['objects']);
        this.saveButton = buttonBar.addButton(t('Save'), this.saveObjects.bind(this, false));
        this.saveButtonORM = buttonBar.addButton(t('Save and build'), this.saveObjects.bind(this, true));
        this.saveButtonORM.setButtonStyle('blue');

        this.lr = new Request.JSON({url: _pathAdmin + 'admin/system/bundle/editor/objects', noCache: 1,
            onComplete: function(response) {
                this.win.setLoading(false);

                if (response.data) {
                    Object.each(response.data.objects, function(item, key) {
                        this.addObject(item, key);
                    }.bind(this));
                    Object.each(response.data.attributes, function(item, key) {
                        this.attributesTable.add(key, item);
                    }.bind(this));
                }
            }.bind(this)}).get({bundle: this.mod});
    },

    modelBuild: function(callback) {
        if (this.lr) {
            this.lr.cancel();
        }

        this.lr = new Request.JSON({
            url: _pathAdmin + 'admin/system/bundle/editor/model/build',
            noCache: 1,
            noErrorReporting: true,
            onException: function(response){
                var dialog = new jarves.Dialog(this.win, {
                    absolute: true,
                    applyButtonLabel: 'OK',
                    autoClose: true,
                    withButtons: true,
                    cancelButton: false
                });
                dialog.setStyle('width', '80%');
                dialog.setStyle('height', '90%');

                new Element('h1', {
                    text: t('Error building the model')
                }).inject(dialog.getContentContainer());

                new Element('div', {
                    text: response.message
                }).inject(dialog.getContentContainer());


                new Element('div', {
                    style: 'padding: 15px; border: 1px solid silver; background-color: white; white-space:pre;',
                    text: JSON.stringify(response, undefined, 2)
                }).inject(dialog.getContentContainer());

                dialog.show();

            }.bind(this),
            onComplete: function(response) {
                if (response.data) {
                    var atLeastOneFailed = false;
                    Object.each(response.data, function(success, id) {
                        if (true !== success) {
                            atLeastOneFailed = true;
                        }
                    });
                    if (atLeastOneFailed) {
                        var dialog = new jarves.Dialog(this.win);
                        dialog.setStyle('width', '80%');
                        dialog.setStyle('height', '90%');

                        var content = '';

                        new Element('h1', {
                            text: t('One or more objects have errors.')
                        }).inject(dialog.getContentContainer());

                        Object.each(response.data, function(success, id) {
                            var div = new Element('div').inject(dialog.getContentContainer());

                            new Element('h2', {
                                text: id
                            }).inject(div);

                            if (true === success) {
                                new Element('div', {
                                    text: t('Success'),
                                    style: 'padding: 5px; text-align: center; color: green; border: 1px solid silver;'
                                }).inject(div);
                            } else {
                                new Element('div', {
                                    text: success,
                                    style: 'padding: 5px; color: red; border: 1px solid silver;'
                                }).inject(div);
                            }
                        });

                        dialog.center();

                        var ok = new jarves.Button(t('Ok')).addEvent('click', dialog.close).setButtonStyle('blue').inject(dialog.bottom);

                    } else {
                        callback(response);
                    }
                }
            }.bind(this)}).post();
    },

    printOrmError: function(pResponse) {
        this.currentButton.stopTip(t('Failed.'));

        var div = new Element('div');

        new Element('h2', {
            text: 'ORM Error: ' + pResponse.error
        }).inject(div);

        var msg = new Element('div', {
            style: 'position: absolute; top: 70px; left: 5px; right: 5px; bottom: 5px; overflow: auto; white-space: pre; background-color: white; padding: 5px;',
            text: 'ORM Error: ' + (pResponse.message || pResponse.error)
        }).inject(div);

        new Element('div', {
            style: 'white-space: pre; padding-top: 15px;',
            text: JSON.encode(pResponse)
        }).inject(msg);

        var dialog = this.win.newDialog(div, true);
        dialog.setStyle('width', '80%');
        dialog.setStyle('height', '90%');
        dialog.center();

        var ok = new jarves.Button(t('Ok')).addEvent('click', dialog.close).setButtonStyle('blue').inject(dialog.bottom);
    },

    updateORM: function() {
        this.currentButton.setProgress(50);
        this.currentButton.startLoading(t('Saved. Write Models ...'));

        this.modelBuild(function() {
            this.currentButton.setProgress(100);
            this.currentButton.doneLoading(t('Done.'));
        }.bind(this));
    },

    saveObjects: function(withBuildAndUpdate) {

        var objects = {};

        this.objectTBody.getChildren('.object').each(function(object) {
            var definition = object.definition;
            var iKey = object.getElements('input')[0];
            var iLabel = object.getElements('input')[1];

            definition.id = iKey.value;
            definition.label = iLabel.value;
            objects[iKey.value] = definition;
        });

        if (this.lr) {
            this.lr.cancel();
        }
        this.currentButton = withBuildAndUpdate ? this.saveButtonORM : this.saveButton;
        console.log(withBuildAndUpdate,this.currentButton);

        var req = {};
        req.objects = objects;
        req.objectAttributes = this.attributesTable.getValue();
        req.bundle = this.mod;

        this.currentButton.startLoading(t('Saving ...'));

        this.lr = new Request.JSON({
            url: _pathAdmin + 'admin/system/bundle/editor/objects?bundle=' + this.mod,
            noCache: 1,
            saveStatusButton: this.currentButton,
            onSuccess: function(response) {
                jarves.loadSettings(['configs']);
                if (withBuildAndUpdate) {
                    this.updateORM();
                }
            }.bind(this)}).post(req);

    },

    openObjectSettings: function(pTr) {
        this.dialog = this.win.newDialog('', true);

        this.dialog.setStyles({
            height: '95%',
            width: '95%'
        });
        this.dialog.center();

        var kaFields = {
            '__general__': {
                type: 'tab',
                fullPage: true,
                label: t('General'),
                children: {
                    'desc': {
                        label: t('Description')
                    },
                    listEntryPoint: {
                        label: t('Listing window entry point'),
                        type: 'object',
                        object: 'jarves/entryPoint'
                    },
                    editEntryPoint: {
                        label: t('Edit window entry point'),
                        type: 'object',
                        object: 'jarves/entryPoint'
                    },
                    addEntryPoint: {
                        label: t('Add window entry point'),
                        type: 'object',
                        object: 'jarves/entryPoint'
                    },
                    dataModel: {
                        type: 'select',
                        label: t('Class'),
                        inputWidth: 200,
                        'default': 'propel',
                        returnDefault: true,
                        items: {
                            'propel': t('Propel ORM'),
                            'custom': t('Custom class')
                        },
                        children: {
                            'class': {
                                needValue: 'custom',
                                label: t('Class name'),
                                desc: t('Class that extends from \\Jarves\\ORM\\ORMAbstract.')
                            },
                            table: {
                                label: t('Table name'),
                                modifier: 'underscore|trim',
                                desc: t('A ORM needs usually a table name which is then created in the database.')
                            },
                            crossRef: {
                                label: t('CrossRef'),
                                type: 'checkbox',
                                desc: t('If this is a cross table (usually used in n-to-n relations)')
                            },
                            labelField: {
                                label: t('Label field'),
                                desc: t('Default field for the label.'),
                                type: 'text',
                                modifier: 'camelcase|trim|lcfirst'
                            },
                            labelTemplate: {
                                label: t('Label template (Optional)'),
                                desc: t('For the javascript user interface field.'),
                                //todo, help id
                                type: 'codemirror'
                            },
                            defaultSelection: {
                                label: t('Default selection (Optional)'),
                                desc: t('You may enter here some field names comma separated. (e.g. if you have a own label template which needs it). Empty for full selection.'),
                                type: 'text'
                            },

                            blacklistSelection: {
                                label: t('Blacklist selection'),
                                desc: t('Enter fields which are not selectable through the ORM (and therefore also for the REST API). Comma separated.')
                            },

                            limitDataSets: {
                                label: t('Limit data sets'),
                                type: 'condition'
                            },
                            nested: {
                                label: t('Nested Set Model'),
                                desc: t('Implement with lft, rgt and lvl fields.'),
                                type: 'checkbox',
                                children: {
                                    nestedRootAsObject: {
                                        needValue: 1,
                                        label: t('Root as object (Optional)'),
                                        desc: t('Display an object item as the root item.'),
                                        type: 'checkbox',
                                        children: {
                                            nestedRootObject: {
                                                needValue: 1,
                                                label: t('Object key'),
                                                modifier: 'camelcase|trim|lcfirst'
                                            },
                                            nestedRootObjectField: {
                                                needValue: 1,
                                                label: t('Foreign key'),
                                                modifier: 'camelcase|trim|lcfirst',
                                                desc: t('Which field in the current object contains the primary value of the parent object?')
                                            },
                                            nestedRootObjectLabelField: {
                                                needValue: 1,
                                                label: t('Label field'),
                                                modifier: 'camelcase|trim|lcfirst'
                                            },
                                            nestedRootObjectExtraFields: {
                                                needValue: 1,
                                                label: t('Extra fields (Optional)'),
                                                desc: t('Comma separated. The backend (admin/objectTreeRoot) returns primary key, label and these extra fields. You may use this to get more fields in the user interface classes.')
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    multiLanguage: {
                        label: t('Multi-language'),
                        type: 'checkbox',
                        desc: t('Adds a extra field \'lang\' varchar(2)')
                    },
                    workspace: {
                        label: t('Workspace versioning'),
                        type: 'checkbox',
                        desc: t('')
                    },
                    domainDepended: {
                        label: t('Domain depended'),
                        type: 'checkbox',
                        desc: t('Adds a extra \'domain\' object field')
                    }
                }
            },
            '__selection__': {
                type: 'tab',
                fullPage: true,
                label: t('Appearence'),
                children: {
                    __fieldUi__: {
                        label: t('Field UI'),
                        type: 'childrenSwitcher',
                        children: {
                            fieldInterface: {
                                type: 'select',
                                label: t('Javascript UI Class'),
                                inputWidth: 150,
                                'default': 'default',
                                items: {
                                    'default': 'Framework',
                                    'custom': 'Custom javascript class'
                                },
                                children: {
                                    'fieldInterfaceClass': {
                                        needValue: 'custom',
                                        label: t('Javascript class name'),
                                        desc: t('You can inject javascript files through extension settings to make a javascript class available.')
                                    }
                                }
                            },
                            'fieldDataModel': {
                                label: t('Data source'),
                                type: 'select',
                                inputWidth: 150,
                                'default': 'default',
                                items: {
                                    'default': 'Framework',
                                    'custom': 'Custom class'
                                },
                                'default': 'default',
                                children: {
                                    fieldDataModelClass: {
                                        label: t('PHP Class'),
                                        needValue: 'custom',
                                        desc: t('A class that extends from \\Admin\\FieldModel\\Field. Entry point is admin/backend/field-object?uri=...')
                                    }
                                }
                            },
                            'fieldLabel': {
                                type: 'text',
                                label: t('Label field (optional)'),
                                desc: t('If you want to show a other label than the default label field.')
                            },
                            'fieldTemplate': {
                                type: 'codemirror',
                                label: t('Label template (optional)'),
                                desc: t('If you want to show a other template than the default label template.')
                            },
                            'fieldFields': {
                                type: 'text',
                                label: t('Select fields (optional)'),
                                desc: t('Define here other fields than in the default selection. (e.g. if you need more fields in your template above.)')
                            }
                        }
                    },
                    __tree__: {
                        againstField: 'nested',
                        needValue: 1,
                        type: 'childrenSwitcher',
                        label: t('Browser UI (tree)'),
                        desc: t('Only for nested objects.'),
                        children: {

                            treeInterface: {
                                label: t('Javascript UI class'),
                                inputWidth: 150,
                                'default': 'default',
                                items: {
                                    'default': 'Framework',
                                    'custom': 'Custom class'
                                },
                                type: 'select',
                                children: {
                                    treeInterfaceClass: {
                                        needValue: 'custom',
                                        label: t('Javascript class'),
                                        desc: t('Define the javascript class which is used to display the chooser. Include the javascript file through "Javascript files" under tab "Extras"')
                                    }
                                }
                            },

                            treeDataModel: {
                                needValue: 1,
                                label: t('Data model'),
                                inputWidth: 150,
                                items: {
                                    'default': 'Framework',
                                    'custom': 'Custom class'
                                },
                                'default': 'default',
                                type: 'select',
                                children: {
                                    treeDataModelClass: {
                                        label: t('PHP Class'),
                                        needValue: 'custom',
                                        desc: t('A class that extends from \\Admin\\FieldModel\\Tree. Entry point admin/object-tree?uri=...')
                                    }
                                }
                            },

                            'treeLabel': {
                                type: 'text',
                                label: t('Tree label field (optional)'),
                                desc: t('If you want to show a other label than the default label field.')
                            },
                            'treeTemplate': {
                                type: 'codemirror',
                                label: t('Tree label template (optional)'),
                                desc: t('If you want to show a other template than the default label template.')
                            },
                            'treeFields': {
                                type: 'text',
                                label: t('Tree select fields (optional)'),
                                desc: t('Define here other fields than in the default selection. (e.g. if you need more fields in your chooser label template.)')
                            },
                            'treeMoveable': {
                                type: 'checkbox',
                                'default': true,
                                label: t('Entrie moveable')
                            },

                            treeFixedIcon: {
                                type: 'checkbox',
                                label: t('Fixed icon'),
                                children: {
                                    treeIconPath: {
                                        needValue: 1,
                                        type: 'file',
                                        label: t('Icon field')
                                    },
                                    treeIcon: {
                                        needValue: 0,
                                        label: t('Icon field')
                                    },
                                    treeIconMapping: {
                                        label: t('Icon path mapping'),
                                        needValue: 0,
                                        type: 'array',
                                        asHash: true,
                                        columns: [
                                            {label: t('Value'), width: '30%'},
                                            {label: t('Icon path')}
                                        ],
                                        fields: {
                                            value: {
                                                type: 'text'
                                            },
                                            path: {
                                                type: 'file'
                                            }
                                        }
                                    },
                                    treeDefaultIcon: {
                                        needValue: 0,
                                        label: t('Default icon'),
                                        type: 'file',
                                        combobox: true
                                    }
                                }
                            },

                            treeRootObjectFixedIcon: {
                                type: 'checkbox',
                                needValue: 1,
                                againstField: 'nestedRootAsObject',
                                label: t('Fixed root icon'),
                                children: {
                                    treeRootObjectIconPath: {
                                        needValue: 1,
                                        type: 'file',
                                        label: t('Icon')
                                    },
                                    treeRootObjectIcon: {
                                        needValue: 0,
                                        label: t('Icon field')
                                    },
                                    treeRootObjectIconMapping: {
                                        label: t('Icon path mapping'),
                                        needValue: 0,
                                        asHash: true,
                                        type: 'array',
                                        columns: [
                                            {label: t('Value'), width: '30%'},
                                            {label: t('Icon path')}
                                        ],
                                        fields: {
                                            value: {
                                                type: 'text'
                                            },
                                            path: {
                                                type: 'file'
                                            }
                                        }
                                    }
                                }
                            },

                            'treeRootFieldLabel': {
                                type: 'text',
                                needValue: 1,
                                againstField: 'nestedRootAsObject',
                                label: t('Tree root label field (optional)'),
                                desc: t('If you want to show a other label than the default label field and other than default tree label field of the root object.')
                            },
                            'treeRootFieldTemplate': {
                                type: 'codemirror',
                                needValue: 1,
                                againstField: 'nestedRootAsObject',
                                label: t('Tree root abel template (optional)'),
                                desc: t('If you want to show a other template than the default label field and other than default tree template of the root object')
                            },
                            'treeRootFieldFields': {
                                type: 'text',
                                needValue: 1,
                                againstField: 'nestedRootAsObject',
                                label: t('Tree root select fields (optional)'),
                                desc: t('Define here other fields than in the default selection. (e.g. if you need more fields in your template above.)')
                            }
                        }
                    },
                    __browserUi__: {
                        label: t('Browser UI (chooser)'),
                        type: 'childrenSwitcher',
                        children: {
                            browserInterface: {
                                label: t('Javascript UI Class'),
                                type: 'select',
                                inputWidth: 150,
                                'default': 'default',
                                items: {
                                    'default': 'Framework',
                                    'custom': 'Custom javascript class'
                                },
                                children: {
                                    browserInterfaceClass: {
                                        needValue: 'custom',
                                        label: t('Javascript class'),
                                        desc: t('Define the javascript class which is used to display the chooser. Include the javascript file through "Javascript files" under tab "Extras"')
                                    },
                                    browserInterfaceOptions: {
                                        label: t('UI properties'),
                                        needValue: 'custom',
                                        desc: t('You can allow extensions to set some properties when providing your object chooser.'),
                                        type: 'fieldTable'
                                    },
                                    browserOptions: {
                                        label: t('Browser options'),
                                        type: 'fieldTable',
                                        needValue: 'custom',
                                        withoutChildren: true,
                                        addLabel: t('Add option')
                                    }
                                }
                            },
                            browserColumns: {
                                label: t('Columns in the chooser table'),
                                type: 'fieldTable',
                                asFrameworkColumn: true,
                                withoutChildren: true,
                                tableItemLabelWidth: 200,
                                addLabel: t('Add column')
                            },
                            'browserDataModel': {
                                type: 'select',
                                label: t('Data source'),
                                inputWidth: 150,
                                'default': 'default',
                                items: {
                                    'default': 'Default',
                                    'custom': 'Custom PHP class',
                                    'none': 'None'
                                },
                                children: {
                                    browserDataModelClass: {
                                        label: t('PHP Class'),
                                        needValue: 'custom',
                                        desc: t('A class that extends from \\Admin\\FieldModel\\Browse. Entry point admin/objects?uri=...')
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };

        var definition = pTr.definition;

        var tbody = new Element('table', {
            width: '100%'
        }).inject(this.dialog.content);

        var kaParseObj = new jarves.FieldForm(tbody, kaFields, {allTableItems: true, tableItemLabelWidth: 220}, {win: this.win});

        new jarves.Button(t('Cancel')).addEvent('click', this.cancelObjectSettings.bind(this)).inject(this.dialog.bottom);

        new jarves.Button(t('Apply')).addEvent('click', function() {

                var fields = Object.clone(pTr.definition.fields);
                var values = kaParseObj.getValue();

                pTr.definition = values;
                pTr.definition.fields = fields;

                this.cancelObjectSettings();

            }.bind(this))

            .setButtonStyle('blue').inject(this.dialog.bottom);

        //switcher
        if (definition.table) {
            definition.__dataModel__ = 'table';
        }

        if (definition) {
            kaParseObj.setValue(definition);
        }

    },

    cancelObjectSettings: function() {
        if (this.dialog) {
            this.dialog.close();
            delete this.dialog;
        }

    },

    addObject: function(pDefinition, pKey) {
        var row = [];

        var actions = new Element('div');
        var iKey = new jarves.Field({
            type: 'text',
            noWrapper: true,
            modifier: 'camelcase|trim|ucfirst',
            value: pDefinition ? pDefinition.id : ''
        });

        var iLabel = new jarves.Field({
            type: 'text',
            noWrapper: true,
            value: pDefinition ? pDefinition['label'] : ''
        });

        row.push(iKey);
        row.push(iLabel);
        row.push(actions);

        var tr = this.objectsTable.addRow(row);
        tr.addClass('object');
        tr.definition = pDefinition || {};
        tr.store('key', iKey);

        var fieldsBtn = new jarves.Button(t('Fields')).inject(actions);

        new jarves.Button(t('Settings')).addEvent('click', this.openObjectSettings.bind(this, tr)).inject(actions);

//        if (pDefinition) {
//            new jarves.Button(t('Window wizard')).addEvent('click', this.openObjectWizard.bind(this, pKey, pDefinition)).inject(actions);
//        }

        new Element('a', {
            style: "cursor: pointer; font-family: 'icomoon'; padding: 0px 2px;",
            title: _('Remove'),
            html: '&#xe26b;'
        }).addEvent('click', function() {
                this.win._confirm(t('Really delete'), function(ok) {
                    if (!ok) {
                        return;
                    }
                    tr.destroy();
                });
            }.bind(this)).inject(actions);

        fieldsBtn.addEvent('click', function() {

            var dialog = this.win.newDialog('', true);
            dialog.setStyles({
                width: '90%',
                height: '95%'
            });

            new jarves.Button(t('Cancel')).addEvent('click',function() {
                dialog.closeAnimated();
            }).inject(dialog.bottom);

            new Element('div', {
                style: 'padding: 5px; color: gray',
                text: t("You have to enter the keys as camelCased. In the real table we convert it to underscore, but you will work always with the camelCased name.")
            }).inject(dialog.content);

            var fieldTable = new jarves.FieldTable(dialog.content, this.win, {
                addLabel: t('Add field'),
                mode: 'object',
                keyModifier: 'camelcase|trim|lcfirst',
                asModel: true,
                withoutChildren: true
            });

            new Element('th', {
                text: t('Column name'),
                width: 150
            }).inject(fieldTable.headerTr.getFirst(), 'after');

            fieldTable.addEvent('add', function(item) {
                item.underscoreDisplay = new Element('td', {
                    'text': '',
                    style: 'color: gray',
                    width: 150
                }).inject(item.tdType, 'before');

                var updateUnderscore = function() {
                    var ucv = item.iKey.getValue().replace(/([^a-z0-9])/g, function($1) {
                        return "_" + $1.toLowerCase().replace(/[^a-z0-9]/, '');
                    });
                    item.underscoreDisplay.set('text', ucv);
                };

                item.iKey.addEvent('change', updateUnderscore);
                item.addEvent('set', updateUnderscore);

                updateUnderscore();
            });

            if (tr.definition.fields) {
                fieldTable.setValue(tr.definition.fields);
            }

            new jarves.Button(t('Apply')).addEvent('click',function() {

                tr.definition.fields = fieldTable.getValue();
                dialog.closeAnimated();

            }).setButtonStyle('blue').inject(dialog.bottom);

            dialog.center(true);

        }.bind(this));
    },

    addAttribute: function(definition) {
        var row = [];

        var actions = new Element('div');
        var iTarget = new jarves.Field({
            type: 'text',
            noWrapper: true,
            modifier: 'camelcase|trim|ucfirst',
            value: definition ? definition.target : ''
        });

        var iFieldKey = new jarves.Field({
            type: 'text',
            noWrapper: true,
            value: definition ? definition.id : ''
        });

        var iFieldType = new jarves.Field({
            type: 'select',
            noWrapper: true,
            value: definition ? definition.id : ''
        });

        row.push(iTarget);
        row.push(iFieldKey);
        row.push(actions);

        var tr = this.attributesTable.addRow(row);
        tr.addClass('object');
        tr.definition = pDefinition || {};
        tr.store('key', iKey);

        var fieldsBtn = new jarves.Button(t('Fields')).inject(actions);

        new jarves.Button(t('Settings')).addEvent('click', this.openObjectSettings.bind(this, tr)).inject(actions);

        if (pDefinition) {
            new jarves.Button(t('Window wizard')).addEvent('click', this.openObjectWizard.bind(this, pKey, pDefinition)).inject(actions);
        }

        new Element('a', {
            style: "cursor: pointer; font-family: 'icomoon'; padding: 0px 2px;",
            title: _('Remove'),
            html: '&#xe26b;'
        }).addEvent('click', function() {
                this.win._confirm(t('Really delete'), function(ok) {
                    if (!ok) {
                        return;
                    }
                    tr.destroy();
                });
            }.bind(this)).inject(actions);

        fieldsBtn.addEvent('click', function() {

            var dialog = this.win.newDialog('', true);
            dialog.setStyles({
                width: '90%',
                height: '95%'
            });

            new jarves.Button(t('Cancel')).addEvent('click',function() {
                dialog.closeAnimated();
            }).inject(dialog.bottom);

            new Element('div', {
                style: 'padding: 5px; color: gray',
                text: t("You have to enter the keys as camelCased. In the real table we convert it to underscore, but you will work always with the camelCased name.")
            }).inject(dialog.content);

            var fieldTable = new jarves.FieldTable(dialog.content, this.win, {
                addLabel: t('Add field'),
                mode: 'object',
                keyModifier: 'camelcase|trim|lcfirst',
                asModel: true,
                withoutChildren: true
            });

            new Element('th', {
                text: t('Column name'),
                width: 150
            }).inject(fieldTable.headerTr.getFirst(), 'after');

            fieldTable.addEvent('add', function(item) {
                item.underscoreDisplay = new Element('td', {
                    'text': '',
                    style: 'color: gray',
                    width: 150
                }).inject(item.iKey, 'after');

                var updateUnderscore = function() {
                    var ucv = item.iKey.getValue().replace(/([^a-z0-9])/g, function($1) {
                        return "_" + $1.toLowerCase().replace(/[^a-z0-9]/, '');
                    });
                    item.underscoreDisplay.set('text', ucv);
                };

                item.iKey.addEvent('change', updateUnderscore);
                item.addEvent('set', updateUnderscore);

                updateUnderscore();
            });

            if (tr.definition.fields) {
                fieldTable.setValue(tr.definition.fields);
            }

            new jarves.Button(t('Apply')).addEvent('click',function() {

                tr.definition.fields = fieldTable.getValue();
                dialog.closeAnimated();

            }).setButtonStyle('blue').inject(dialog.bottom);

            dialog.center(true);

        }.bind(this));
    },

    openObjectWizard: function(key, definition) {

        this.dialog = jarves.Dialog(this.win, {
            minHeight: '80%',
            minWidth: '90%',
            withButtons: true,
            content: '#Todo'
        });

        this.dialog.show();
        return;

        var tbody = new Element('table', {
            width: '100%'
        }).inject(this.dialog.content);

        var columns = [], fields = {};
        var fieldsActive = [];

        var colCount = 0;
        var useIt = false;

        Object.each(definition.fields, function(field, key) {

            useIt = false;
            if (!field.primaryKey && colCount <= 4) {
                useIt = true;
                colCount++;
            }

            if (!field.primaryKey) {
                fieldsActive.push(key);
            }

            if (!field.autoIncrement) {
                fields[key] = (field.label ? field.label : 'No label') + ' (' + key + ')';
            }

            columns.push({usage: useIt, key: key, label: (field.label ? field.label : 'No label'), width: field.width});
        });

        var reqs = {};

        var checkClassName = function(pValue, pFieldObject, pFieldId) {

            if (reqs[pFieldId]) {
                reqs[pFieldId].cancel();
            }

            reqs[pFieldId] = new Request.JSON({url: _path + 'admin/system/bundle/windowsExists', noCache: 1,
                onComplete: function(pResult) {
                    if (pFieldObject.existsInfo) {
                        pFieldObject.existsInfo.destroy();
                    }

                    if (pResult) {

                        pFieldObject.existsInfo = new Element('div', {
                            style: 'color: red;',
                            text: t('This class already exists. It will be overwritten!')
                        }).inject(pFieldObject.input, 'after');

                    }
                }}).get({bundle: this.mod, className: pValue});

        }.bind(this);

        var kaFields = {

            windowListName: {
                label: tc('objectWindowWizard', 'Window list class name'),
                regexp_replace: '',
                type: 'text',
                'default': key + 'List',
                onChange: checkClassName
            },
            windowAddName: {
                label: tc('objectWindowWizard', 'Window add class name'),
                type: 'text',
                'default': key + 'Add',
                onChange: checkClassName
            },
            windowEditName: {
                label: tc('objectWindowWizard', 'Window edit class name'),
                type: 'text',
                'default': key + 'Edit',
                onChange: checkClassName
            },

            windowListColumns: {
                label: tc('objectwindowWizard', 'Window list columns'),
                type: 'array',
                columns: [
                    {label: t('Usage'), width: 50},
                    {label: t('Key'), width: 100},
                    {label: t('Label')},
                    {label: t('Width'), width: 50}
                ],
                withoutAdd: true,
                withoutRemove: true,
                fields: {
                    usage: {
                        type: 'checkbox'
                    },
                    key: {
                        type: 'label'
                    },
                    label: {
                        type: 'text'
                    },
                    width: {
                        type: 'text'
                    }

                },
                'default': columns
            },

            windowAddFields: {
                label: tc('objectwindowWizard', 'Window add fields'),
                type: 'checkboxgroup',
                items: fields,
                'default': fieldsActive
            },

            windowEditFields: {
                label: tc('objectwindowWizard', 'Window edit fields'),
                type: 'checkboxgroup',
                items: fields,
                'default': fieldsActive
            },

            addEntrypoints: {
                label: tc('objectWindowWizard', 'Create entry points'),
                type: 'checkbox',
                'default': 1
            }

        };

        var kaParseObj = new jarves.FieldForm(tbody, kaFields, {allTableItems: true}, {win: this.win});

        this.objectWizardCloseBtn = new jarves.Button(t('Cancel')).addEvent('click', function() {
            this.dialog.close();
        }.bind(this)).inject(this.dialog.bottom);

        this.objectWizardSaveBtn = new jarves.Button(t('Apply')).addEvent('click', function() {

            var values = kaParseObj.getValue();
            this.dialog.canClosed = false;
            this.objectWizardCloseBtn.deactivate();
            this.objectWizardSaveBtn.deactivate();

            this.win.setLoading(true, t('Creating windows ...'));

            this.lr = new Request.JSON({
                url: _pathAdmin + 'admin/system/bundle/windows?bundle=' + this.mod,
                noCache: 1,
                onComplete: function(res) {

                    this.win.setLoading(false);
                    this.dialog.close();
                    jarves.loadMenu();
                    jarves.loadSettings();

                }.bind(this)
            }).post({_method: 'put', object: key, values: values});

        }.bind(this)).setButtonStyle('blue').inject(this.dialog.bottom);

    },

    loadExtras: function() {

        var extrasFields = {

            __resources__: {
                type: 'childrenSwitcher',
                label: tc('extensionEditor', 'Additional backend JavaScript/CSS files'),
                children: {

                    adminAssets: {

                        label: t('Admin assets'),
                        desc: t('Will be loaded during the login. Relative to /web/.'),
                        type: 'array',
                        columns: [
                            {label: t('Type'), width: 80},
                            t('Path'),
                            {label: t('Compression'), width: 80},
                            {label: t('Recursive'), width: 80, desc: t('Only for assets')}
                        ],
                        withOrder: true,
                        fields: {
                            type: {
                                type: 'select',
                                items: {'asset': 'Asset', 'assets': 'Assets'}
                            },
                            path: {
                                type: 'text'
                            },
                            compression: {
                                type: 'checkbox',
                                'default': true
                            },
                            recursive: {
                                type: 'checkbox',
                                needValue: 'assets',
                                againstField: 'type'
                            }
                        }
                    }
                }
            },

            __caches__: {
                type: 'childrenSwitcher',
                label: tc('extensionEditor', 'Cache'),
                children: {
                    caches: {
                        label: t('Cache keys'),
                        desc: t('Define here all cache keys your extension use, so we can delete all properly if needed. You can optional define a method, if you have stored this cache not through our cache layer and want to do own stuff.'),
                        type: 'array',
                        columns: [
                            {label: t('Key'), width: '50%'},
                            {label: t('Method (optional)')}
                        ],
                        fields: {
                            key: {
                                type: 'text'
                            },
                            method: {
                                type: 'text'
                            }
                        }
                    }
                }
            },

            __events__: {
                type: 'childrenSwitcher',
                label: tc('extensionEditor', 'Events'),
                children: {
                    events: {
                        type: 'array',
                        label: t('Define events'),
                        desc: t('Here you can define events, where others can attach to.'),
                        columns: [
                            {label: t('Key'), width: '40%'},
                            {label: t('Description')}
                        ],
                        fields: {
                            key: {
                                type: 'text',
                                required: true
                            },
                            desc: {
                                type: 'text'
                            }
                        }
                    },

                    listeners: {

                        label: t('Event listener'),
                        desc: t('You can attach here directly your action to an event.'),
                        type: 'array',
                        columns: [
                            {label: t('Key'), width: '35%'},
                            {label: t('Subject'), width: '35%'},
                            {label: t('Actions')}
                        ],
                        fields: {
                            key: {
                                type: 'text',
                                required: true
                            },
                            subject: {
                                type: 'text'
                            },
                            actions: {
                                type: 'container',
                                children: {
                                    callsButton: {
                                        type: 'dialog',
                                        noWrapper: true,
                                        label: 'PHP Calls',
                                        children: {
                                            calls: {
                                                type: 'array',
                                                asArray: true,
                                                columns: [
                                                    {label: t('Method'), desc: t('Example `\BundleName\ClassName::methodName`')}
                                                ],
                                                fields: {
                                                    method: {
                                                        type: 'text'
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    clearCacheButton: {
                                        type: 'dialog',
                                        noWrapper: true,
                                        label: 'Clear Caches',
                                        children: {
                                            clearCaches: {
                                                type: 'array',
                                                asArray: true,
                                                columns: [
                                                    {label: t('Cache key')}
                                                ],
                                                fields: {
                                                    cacheKey: {
                                                        type: 'text'
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }

                    }

                }

            },

            __cdn__: {
                type: 'childrenSwitcher',
                label: tc('extensionEditor', 'FAL driver'),
                children: {

                    falDriver: {
                        type: 'array',
                        label: t('CDN Driver'),
                        desc: t('Here you can define driver for the file abstraction layer. The class has to be in module/&lt;extKey&gt;/&lt;class&gt;.class.php'),
                        asHash: 1,
                        columns: [
                            {label: t('Class'), width: '150'},
                            {label: t('Title'), width: '150'},
                            {label: t('Properties')}
                        ],
                        fields: {
                            'class': {
                                type: 'text'
                            },
                            title: {
                                type: 'text'
                            },
                            properties: {
                                type: 'fieldTable',
                                options: {
                                    withoutChildren: true,
                                    fieldTypesBlacklist: ['window_list', 'layoutelement']
                                }
                            }
                        }
                    }
                }
            }
        }

        if (this.lr) {
            this.lr.cancel();
        }
        this.panes['extras'].empty();

        this.extrasPane = new Element('div', {
            'class': 'jarves-system-modules-edit-pane',
            style: 'bottom: 40px;'
        }).inject(this.panes['extras']);

        this.extraFieldsObj = new jarves.FieldForm(this.extrasPane, extrasFields, {allTableItems: 1, tableItemLabelWidth: 270});

        var buttonBar = new jarves.ButtonBar(this.panes['extras']);
        this.saveBtn = buttonBar.addButton(t('Save'), this.saveExtras.bind(this));
        this.saveBtn.setButtonStyle('blue');

        this.lr = new Request.JSON({url: _pathAdmin + 'admin/system/bundle/editor/basic', noCache: 1,
            onComplete: function(pResult) {

                if (pResult.data) {
                    this.extraFieldsObj.setValue(pResult.data);
                }
                this.win.setLoading(false);

            }.bind(this)}).get({bundle: this.mod});
    },

    saveExtras: function() {

        var req = this.extraFieldsObj.getValue();

        this.lr = new Request.JSON({
            url: _pathAdmin + 'admin/system/bundle/editor/basic?bundle=' + this.mod,
            noCache: 1,
            saveStatusButton: this.saveBtn,
            onComplete: function() {
                jarves.loadSettings();
            }.bind(this)}).post(req);
    },

    viewType: function(pType) {
        Object.each(this.buttons, function(button, id) {
            button.setPressed(false);
            this.panes[id].setStyle('display', 'none');
        }.bind(this));
        this.buttons[pType].setPressed(true);
        this.panes[pType].setStyle('display', 'block');

        this.win.setLoading(true, t('Loading ...'));
        if (this.lr) {
            this.lr.cancel();
        }

        this.win.setParameter('tab', pType);

        this.lastType = pType;
        switch (pType) {
            case 'language':
                return this.loadLanguage();
            case 'themes':
                return this.loadLayouts();
            case 'general':
                return this.loadGeneral();
            case 'extras':
                return this.loadExtras();
            case 'entryPoints':
                return this.loadLinks();
            case 'model':
                return this.loadDb();
            case 'windows':
                return this.loadWindows();
            case 'docu':
                return this.loadDocu();
            case 'help':
                return this.loadHelp();
            case 'plugins':
                return this.loadPlugins();
            case 'objects':
                return this.loadObjects();
        }
    }


});
