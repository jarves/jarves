var jarves_system_module = new Class({

    /**
     * @var {jarves.Dialog}
     */
    win: null,

    initialize: function (pWin) {
        this.win = pWin;

        this.tabGroup = this.win.addTabGroup();

        this.tabButtons = {};

        this.tabButtons['install'] =
            this.tabGroup.addButton(_('Repository'), '#icon-box-add', this.changeType.bind(this, 'install'));
        this.tabButtons['installed'] =
            this.tabGroup.addButton(_('Packages'), '#icon-box', this.changeType.bind(this, 'installed'));
        this.tabButtons['local'] =
            this.tabGroup.addButton(_('Development'), '#icon-console-2', this.changeType.bind(this, 'local'));

        this.win.setContentStick(true);

        this.panes = {};
        this.panes['installed'] = new Element('div', {
            'class': 'jarves-system-module-pane'
        }).inject(this.win.content);
        this.panes['install'] = new Element('div', {
            'class': 'jarves-system-module-pane'
        }).inject(this.win.content);

        this.panes['local'] = new Element('div', {
            'class': 'jarves-system-module-pane'
        }).inject(this.win.content);

        /* installed */
        this.installedPane = new Element('div', {
            'class': 'jarves-kwindow-content-withBottomBar'
        }).inject(this.panes['installed']);
        this.installedActionBar = new Element('div', {
            'class': 'kwindow-win-buttonBar jarves-ActionBar'
        }).inject(this.panes['installed']);

        new Element('h2', {
            html: _('Bundles'),
            'class': 'light',
            style: 'margin-left: 5px;'
        }).inject(this.installedPane);

        this.tableInstalledBundles = new jarves.Table([
            [_('Name'), null, 'html'],
            [_('Status'), 100],
            [_('Action'), 150]
        ], {
            absolute: false,
            valign: 'middle'
        }).inject(this.installedPane);
        document.id(this.tableInstalledBundles).setStyle('margin', 10);

        new Element('h2', {
            html: _('Composer Packages'),
            'class': 'light',
            style: 'margin-left: 5px;'
        }).inject(this.installedPane);
        this.tableInstalledPackages = new jarves.Table([
            [_('Name'), null, 'html'],
            [_('Version'), 100],
            [_('Installed'), 150],
            [_('Action'), 150]
        ], {
            absolute: false,
            valign: 'middle'
        }).inject(this.installedPane);
        document.id(this.tableInstalledPackages).setStyle('margin', 10);

        new jarves.Button(t('Update Packages'))
            .inject(this.installedActionBar);

        new jarves.Button(t('Install Package'))
            .setButtonStyle('blue')
            .addEvent('click', function(){
                this.installComposerPackage();
            }.bind(this))
            .inject(this.installedActionBar);

        this.categories = {};
        [
            {v: _('Information/Editorial office'), i: 1},
            {v: _('Multimedia'), i: 2},
            {v: _('SEO'), i: 3},
            {v: _('Widget'), i: 4},
            {v: _('Statistic'), i: 5},
            {v: _('Community'), i: 6},
            {v: _('Interface'), i: 7},
            {v: _('System'), i: 8},
            {v: _('Advertisement'), i: 9},
            {v: _('Security'), i: 10},
            {v: _('ECommerce'), i: 11},
            {v: _('Download & Documents'), i: 12},
            {v: _('Themes / Layouts'), i: 13},
            {v: _('Language package'), i: 14},
            {v: _('Data acquisition'), i: 19},
            {v: _('Collaboration'), i: 18},
            {v: _('Other'), i: 16}
        ].each(function (item) {
                this.categories[ item.i ] = item.v;
            }.bind(this));

        this.win = pWin;
        this._createInstallLayout();

        if (this.win.params && this.win.params.updates == 1) {
            this.changeType('installed');
        } else {
            this.changeType('install');
        }
    },

    changeType: function (pType) {
        this.lastType = pType;
        Object.each(this.tabButtons, function (button, id) {
            button.setPressed(false);
            this.panes[id].setStyle('display', 'none');
        }.bind(this));
        this.tabButtons[ pType ].setPressed(true);
        this.panes[ pType ].setStyle('display', 'block');

        if (pType == 'installed') {
            this.loadInstalled();
            //this.renderInstall();
        }
        if (pType == 'local') {
            this.loadLocal();
        }
        if (pType == 'install') {
            this._createInstallLayout();
        }
    },

    loadInstalled: function () {
        this.win.setLoading(true);
        if (this.llir) {
            this.llir.cancel();
        }

        var lang = jarves.settings['user']['adminLanguage'];

        this.llir = new Request.JSON({url: _pathAdmin + 'admin/system/bundle/manager/installed', noCache: 1,
            onComplete: function (pResult) {
                var bundles = pResult.data.bundles;
                var packages = pResult.data.packages;

                this.tableInstalledBundles.empty();
                this.tableInstalledPackages.empty();

                Array.each(packages, function(packageDef){
                    var actions = new Element('div');
                    new jarves.Button(t('Remove'))
                        .addEvent('click', function(){
                            this.removeComposerPackage(packageDef.name);
                        }.bind(this))
                        .inject(actions);

                    var installed = packageDef.installed;

                    if ('object' === typeOf(installed)) {
                        installed = new Element('span', {
                            text: packageDef.installed.version
                        });
                        new Element('span', {
                            text: ' ('+packageDef.installed.reference+')',
                            style: 'color: gray'
                        }).inject(installed);
                    }

                    this.tableInstalledPackages.addRow([packageDef.name, packageDef.version, installed, actions]);
                }.bind(this));


                var systemModules = ['JarvesBundle'];
                Array.each(bundles, function(bundle) {
                    if (-1 !== systemModules.indexOf(bundle['class'])) {
                        return;
                    }
                    var actions = new Element('div');

                    if (bundle.active) {
                        new jarves.Button(t('Uninstall'))
                            .addEvent('click', function(){
                                this.setBundle(bundle['class'], false);
                            }.bind(this))
                            .inject(actions);
                    } else {
                        new jarves.Button(t('Install'))
                            .addEvent('click', function(){
                                this.setBundle(bundle['class'], true);
                            }.bind(this))
                            .inject(actions);
                    }

                    var activeIcon = new Element('span', {
                        'class': bundle.active ? 'icon-checkmark-6' : 'icon-cancel-6',
                        'styles': {color: bundle.active ? 'green' : 'red'}
                    });
                    var title = new Element('span', {text: bundle['class']});
                    var packageName = new Element('span', {
                        text: ' ('+bundle.package+')',
                        style: 'color: gray'
                    }).inject(title);

                    this.tableInstalledBundles.addRow([
                        title,
                        activeIcon,
                        actions
                    ]);

                }.bind(this));

                this.win.setLoading(false);
            }.bind(this)}).get();
    },

    installComposerPackage: function(name, version, withBundles)
    {

        if ('string' !== typeOf(name) || name.length <= 1 || !version) {
            var dialog;

            dialog = this.win.prompt(t('Package name:'), name || '', function(name){
                if (typeOf(name) == 'string' && name.length > 1) {
                    this.installComposerPackage(name, dialog.version.getValue(), dialog.withBundles.getValue());
                }
            }.bind(this));

            dialog.version = new jarves.Field({
                label: t('Version constraint'),
                desc: t('Example: >=1.0.0, dev-master, *, 3.6.*'),
                type: 'text',
                'default': '*',
                inputWidth: 100
            }, dialog.getContentContainer());

            dialog.withBundles = new jarves.Field({
                label: t('Install all containing bundles'),
                desc: t('If the package is a jarves package, we install also all containing bundles.'),
                type: 'checkbox',
                'default': true
            }, dialog.getContentContainer());
            return;
        }

        this.win.setLoading(true, t('Install composer package ...'));
        this.setBundleRequest = new Request.JSON({url: _pathAdmin + 'admin/system/bundle/manager/composer/install', noCache: 1,
            onComplete: function () {
                this.loadInstalled();
            }.bind(this)}).post({name: name, version: version, withBundles: withBundles});
    },

    removeComposerPackage: function(name, confirmed) {

        if (true !== confirmed) {
            var dialog;

            dialog = this.win.confirm(t('Really uninstall?'), function(a){
                this.removeComposerPackage(name, true);
            }.bind(this));

            new Element('div', {
                text: t('This uninstalls possible containing bundles and all of its data.'),
                style: 'color: gray; padding: 5px; padding-top: 15px;'
            }).inject(dialog.getContentContainer());
            return;
        }

        this.win.setLoading(true, t('Remove composer package ...'));
        this.setBundleRequest = new Request.JSON({url: _pathAdmin + 'admin/system/bundle/manager/composer/uninstall', noCache: 1,
            onComplete: function () {
                this.loadInstalled();
            }.bind(this)}).post({name: name});
    },

    setBundle: function(className, activate, removeFiles) {
        if (this.setBundleRequest) {
            this.setBundleRequest.cancel();
        }

        var uri = activate ? 'install' : 'uninstall';

        if (!activate) {
            if ('null' === typeOf(removeFiles)) {
                var dialog;

                dialog = this.win.confirm(t('Really uninstall?'), function(a){
                    this.setBundle(className, activate, dialog.withFiles.getValue());
                }.bind(this));

                new Element('div', {
                    text: t('This uninstalls the bundle and all of its data.'),
                    style: 'color: gray; padding: 5px; padding-top: 15px;'
                }).inject(dialog.getContentContainer());
                dialog.withFiles = new jarves.Field({
                    label: t('Remove also all files'),
                    desc: t('This tries also to uninstall the composer package.'),
                    type: 'checkbox'
                }, dialog.getContentContainer());
                return;
            }
        }

        this.win.setLoading(true, activate ? t('Install bundle ...') : t('Uninstall bundle ...'));
        this.setBundleRequest = new Request.JSON({url: _pathAdmin + 'admin/system/bundle/manager/'+uri, noCache: 1,
            onComplete: function () {
                this.loadInstalled();
                jarves.loadSettings();
                jarves.loadMenu();
            }.bind(this)}).post({'bundle': className, ormUpdate: 1, removeFiles: removeFiles});
    },

    loadLocal: function () {
        if (this.lc) {
            this.lc.cancel();
        }
        this.win.setLoading(true);

        this.lc = new Request.JSON({url: _pathAdmin +
            'admin/system/bundle/manager/local', noCache: 1, onComplete: function (res) {
            this.win.setLoading(false);
            this.renderLocal(res.data);
        }.bind(this)}).get();
    },

    renderLocal: function (pMods) {
        this.panes['local'].empty();

        this.localePane = new Element('div', {
            'class': 'jarves-kwindow-content-withBottomBar'
        }).inject(this.panes['local']);
        var p = this.localePane;

        if (jarves.settings.system.communityId + 0 > 0) {
            new Element('h3', {
                html: _('My extensions') + ' (' + jarves.settings.system.communityEmail + ')'
            }).inject(p);
        }

        var buttonBar = new jarves.ButtonBar(this.panes['local']);
        var createBtn = buttonBar.addButton(_('Create Bundle'), function () {
            var prompt;

            prompt = new jarves.Dialog(this.win, {
                content: _('New Bundle'),
                maxHeight: '90%',
                withButtons: true
            });

            prompt.addEvent('apply', function(){
                prompt.cancelClosing();

                if (!prompt.packageInput.checkValid() || !prompt.classInput.checkValid()) {
                    return;
                }

                prompt.getApplyButton().startLoading(t('Creating ...'));

                this.lastAddModuleRq = new Request.JSON({
                    url: _pathAdmin + 'admin/system/bundle/manager',
                    noCache: true,
                    onComplete: function(response) {
                        if (response.data) {
                            prompt.getApplyButton().doneLoading(t('Created!'));
                            prompt.close();
                            this.loadLocal();
                        } else {
                            prompt.getApplyButton().failedLoading(t('Failed!'));
                        }
                    }.bind(this)
                }).put({
                    package: prompt.packageInput.getValue(),
                    namespace: prompt.classInput.getValue(),
                    directoryStructure: prompt.directoryStructure.getValue()
                });

            }.bind(this));

            //prompt.input.destroy();
            prompt.packageInput = new jarves.Field({
                label: t('Package name'),
                desc: t('Is used as name for the composer package. Example: peter/blog'),
                type: 'text',
                modifier: 'trim',
                require: true,
                requiredRegex: '^([a-zA-Z0-9_-]+)/([a-zA-Z0-9_.-]+)$',
                onChange: function(value) {
                    if (!prompt.classInput.getValue() || prompt.lastGeneratedNameSpace == prompt.classInput.getValue()) {
                        if (!value) {
                            prompt.lastGeneratedNameSpace = '';
                            prompt.classInput.setValue('', true);
                            return;
                        }
                        var split = value.split('/');
                        prompt.lastGeneratedNameSpace = [];
                        Array.each(split, function(item) {
                            prompt.lastGeneratedNameSpace.push(item.ucfirst());
                        });
                        prompt.lastGeneratedNameSpace = prompt.lastGeneratedNameSpace.join('\\');
                        if ('Bundle' !== prompt.lastGeneratedNameSpace.substr(-6) && '/' !== value.substr(-1)) {
                            prompt.lastGeneratedNameSpace += 'Bundle';
                        }
                        prompt.classInput.setValue(prompt.lastGeneratedNameSpace, true);
                    }
                }.bind(this),
                readMore: 'http://getcomposer.org/doc/01-basic-usage.md#package-names'
            }, prompt.getContentContainer());

            prompt.classInput = new jarves.Field({
                label: t('Bundle namespace'),
                desc: t('Is a PHP namespace containing your vendor prefix. It must be a string ending with the Bundle suffix.  Example Peter\\BlogBundle.'),
                modifier: 'phpclass',
                type: 'text',
                requiredRegex: '^(([a-zA-Z0-9_-]+)\\\\)*([a-zA-Z0-9_-]*)Bundle',
                require: true,
                onChange: function(value) {
                    var bundleName = value;

                    bundleName = bundleName.replace('\\Bundle\\', '\\');
                    bundleName = bundleName.replace(/\\/, '');

                    prompt.className.setValue(value + '\\' + bundleName);
                    prompt.fileName.setValue('./src/' + value.replace(/\\/g, '/') + '/' + bundleName + '.php');
                    prompt.composer.setValue('./src/' + value.replace(/\\/g, '/')+'/composer.json');
                },
                readMore: 'http://symfony.com/doc/current/cookbook/bundles/best_practices.html#bundle-name'
            }, prompt.getContentContainer());

            prompt.className = new jarves.Field({
                type: 'info',
                label: t('Generates bundle class name:'),
                value: '(autogenerated)'
            }, prompt.getContentContainer());

            prompt.fileName = new jarves.Field({
                type: 'info',
                label: t('Generates php file:'),
                value: '(autogenerated)'
            }, prompt.getContentContainer());

            prompt.composer = new jarves.Field({
                type: 'info',
                label: t('Your composer.json path:'),
                value: '(autogenerated)'
            }, prompt.getContentContainer());

            prompt.directoryStructure = new jarves.Field({
                label: t('Generate directory structure'),
                type: 'checkbox',
                desc: t('Generates some common directories and files.'),
                'default': true
            }, prompt.getContentContainer());

            prompt.info = new Element('div', {
                style: 'padding: 15px',
                text: t('The system creates based on your bundle namespace the correct bundle class name.')
            }).inject(prompt.getContentContainer());

            prompt.show();

        }.bind(this));
        createBtn.setButtonStyle('blue');

        if (typeOf(pMods) == 'array') {
            new Element('div', {
                style: 'color: gray; text-align: center; padding: 5px;',
                html: t("No extensions found. Create or install a extension.")
            }).inject(p);
        }

        var values = {my: [], local: [], external: []};
        var tables = {};

        if (jarves.settings.system.communityId + 0 > 0) {
            //if connected
            tableMyDiv = new Element('div', {style: 'position: relative; margin: 10px;'}).inject(p);
            tables['my'] = new jarves.Table([
                [_('Title'), null, 'html'],
                [_('Activated'), 50, 'html'],
                [_('Version'), 50],
                [_('Status'), 130],
                [_('Action'), 350]
            ], {absolute: false, valign: 'middle'}).inject(tableMyDiv);
        }

        new Element('h2', {
            html: _('Local bundles'),
            'class': 'light',
            style: 'margin-left: 5px;'
        }).inject(p);

        tableLocalDiv = new Element('div', {style: 'position: relative; margin: 10px;'}).inject(p);
        tables['local'] = new jarves.Table([
            [_('Title'), null, 'html'],
            [_('Activated'), 50, 'html'],
            [_('Version'), 50],
            [_('Status'), 130],
            [_('Action'), 350]
        ], {absolute: false, valign: 'middle'}).inject(tableLocalDiv);

        new Element('h2', {
            html: _('External bundles'),
            'class': 'light',
            style: 'margin-left: 5px;'
        }).inject(p);

        tableLocalDiv = new Element('div', {style: 'position: relative; margin: 10px;'}).inject(p);
        tables['external'] = new jarves.Table([
            [_('Title'), null, 'html'],
            [_('Activated'), 50, 'html'],
            [_('Version'), 50],
            [_('Status'), 130],
            [_('Action'), 350]
        ], {absolute: false, valign: 'middle'}).inject(tableLocalDiv);

        var lang = jarves.settings['user']['adminLanguage'];
        Object.each(pMods, function (mod, key) {

            var item = mod;
            var table = 'my';
            if (mod.owner == '' || !mod.owner || mod.owner != jarves.settings.system.communityId) {
                table = 'local';
            }
            if (0 === item._path.indexOf('vendor/')) {
                table = 'external';
            }

            var title = item['name'];

            if (!item) {
                title = "config parse error: " + key;
            }
            if (item.noConfig) {
                title = "config not found: " + key;
            }

            var _title = '';

            var actions = new Element('div');
            var bActions = new Element('div');
            if (!['Jarves\JarvesBundle'].contains(key)) {
                if (item.activated) {
                    var deactivate = new jarves.Button(_('Deactivate'))

                    deactivate.addEvent('click', function () {
                        deactivate.startLoading(t('Deactivating ...'));
                        new Request.JSON({url: _pathAdmin +
                            'admin/system/bundle/manager/deactivate', noCache: 1,
                            onComplete: function (response) {
                                if (response.error) {
                                deactivate.failedLoading(t('Failed'));
                                } else {
                                    deactivate.doneLoading(t('Deactivated'));
                                }
                                this.loadLocal();
                                jarves.loadSettings();
                                jarves.loadMenu();
                        }.bind(this)}).post({bundle: key});
                    }.bind(this)).inject(bActions)
                } else {
                    var activate =  new jarves.Button(_('Activate'))

                    activate.addEvent('click', function () {
                        activate.startLoading(t('Activating ...'));
                        new Request.JSON({url: _pathAdmin +
                            'admin/system/bundle/manager/activate', noCache: 1,
                            onComplete: function (response) {
                                if (response.error) {
                                    activate.failedLoading(t('Failed'));
                                } else {
                                    activate.doneLoading(t('Activated'));
                                }
                                this.loadLocal();
                                jarves.loadSettings();
                                jarves.loadMenu();
                        }.bind(this)}).post({bundle: key});
                    }.bind(this)).inject(bActions);
                }
            }

            new jarves.Button(_('Info')).addEvent('click', function () {
                jarves.wm.open('jarvesbundle/system/module/view', {name: key, type: 0}, -1, true);
            }.bind(this)).inject(actions);

            new jarves.Button(_('Edit')).addEvent('click', function () {
                jarves.wm.open('jarvesbundle/system/module/edit', {name: key});
            }.bind(this)).inject(actions);

            var activeIcon = new Element('span', {
                'class': item.activated ? 'icon-checkmark-6' : 'icon-cancel-6',
                'styles': {color: item.activated ? 'green' : 'red'}
            });
            var value = [item._bundleName + ' <span style="color: gray;">(' + title + ')</span>',
                activeIcon,
                item._installed.version ? item._installed.version : (item.version ? item.version : t('VCS')),
                bActions,
                actions];

            values[table].include(value);
        }.bind(this));

        if (jarves.settings.system.communityId + 0 > 0) {
            if (values['my'].length > 0) {
                tables['my'].setValues(values['my']);
            } else {
                tables['my'].hide();
            }
        }

        if (values['local'].length > 0) {
            tables['local'].setValues(values['local']);
        } else {
            tables['local'].hide();
        }

        if (values['external'].length > 0) {
            tables['external'].setValues(values['external']);
        } else {
            tables['external'].hide();
        }
    },

    _createInstallLayout: function () {
        this.panes['install'].empty();

        this.searchPane = new Element('div', {
            'style': 'position: absolute; left: 0px; top: 0px; right: 0px; height: 38px; text-align: right; padding-top: 7px; border-bottom: 1px solid #bbb; padding-right: 3px;'
        }).inject(this.panes['install']);

        this.searchLeftPane = new Element('div', {
            style: 'float: left;'
        }).inject(this.searchPane);

        this.searchInput = new Element('input', {
            'class': 'text',
            style: 'padding: 4px; width: 250px; margin: 0px 3px;'
        }).addEvent('keyup', function (e) {
                if (e.key == 'enter') {
                    if (this.searchInput.value == '') {
                        return this.searchInput.highlight();
                    }
                    this.doSearch();
                }
            }.bind(this)).inject(this.searchLeftPane);

        this.searchBtn = new jarves.Button(_('Search')).addEvent('click', function () {
            if (this.searchInput.value == '') {
                return this.searchInput.highlight();
            }
            this.doSearch();
        }.bind(this)).inject(this.searchLeftPane);

        new Element('span', {
            html: _('Package name:') + ' #'
        }).inject(this.searchPane);

        this.directInput = new Element('input', {
            'class': 'text',
            style: 'padding: 4px; width: 100px; margin: 0px 3px;'
        }).inject(this.searchPane);

        var _this = this;
        var chooserWin;

        this.directBtn = new jarves.Button(_('Install')).addEvent('click', function () {
            if (this.directInput.value == '') {
                return this.directInput.highlight();
            }
            return this.installComposerPackage(this.directInput.value);
        }.bind(this)).inject(this.searchPane);

        this.mainPane = new Element('div', {
            'style': 'position: absolute; top: 46px; left: 0px; right: 0px; bottom: 0px; background-color: #f4f4f4; padding: 5px; overflow: auto;',
            text: 'TODO'
        }).inject(this.panes['install']);

        //this.viewPath();

    },

    viewPath: function (pPath) {
        this.mainPane.empty();
        if (typeOf(pPath) == false) {
            pPath = '';
        }

        this.currentPath = pPath;

        if (pPath == '') {
            this.openCategories();
        } else {
            var paths = [pPath];
            if (pPath && pPath.indexOf('/') > 0) {
                paths = pPath.split('/');
            }
            this.paths = paths;

            switch (paths[0]) {
                case 'category':
                    this.openCategoryList(paths[1]);

            }
        }
    },

    doSearch: function () {

        var q = this.searchInput.value;
        this.mainPane.set('html', '<center><img src="' + _path + 'bundles/jarves/admin/images/loading.gif" /></center>');

        new Request.JSON({url: _pathAdmin +
            'admin/system/bundle/managerSearch', noCache: 1, onComplete: function (res) {
            this.mainPane.set('html', '');

            if (res && res['status'] == 'ok') {
                this.mainPane.set('html', '<h2>' + _('Search result: ') + ' ' + q + ' (' + res.items.length + ')</h2>');

                new jarves.Button('< ' + _('Go to overview')).addEvent('click', function () {
                    this.viewPath();
                }.bind(this)).inject(this.mainPane);

                res.items.each(function (item) {
                    this._createListItem(item).inject(this.mainPane);
                }.bind(this));
            } else {
                this.mainPane.set('html',
                    '<div style="padding: 5px; font-weight: bold; text-align: center;">' + _('No search results. :-(') +
                        '</div>');

                new jarves.Button('< ' + _('Go to overview')).addEvent('click', function () {
                    this.viewPath();
                }.bind(this)).inject(this.mainPane);
            }
        }.bind(this)}).get({q: q});

    },

//    openCategoryList: function (pId) {
//
//        new Element('h2', {
//            html: _('Extensions in %s').replace('%s', this.categories[ pId ]),
//            style: 'margin: 2px;'
//        }).inject(this.mainPane);
//
//        new jarves.Button('< ' + _('Go to overview')).addEvent('click', function () {
//            this.viewPath();
//        }.bind(this)).inject(this.mainPane);
//
//        var content = new Element('div', {
//            html: '<center><img src="' + _path + 'bundles/jarves/admin/images/loading.gif" /></center>'
//        }).inject(this.mainPane);
//
//        new Request.JSON({url: _pathAdmin +
//            'admin/system/bundle/managerGetCategoryItems', noCache: 1, onComplete: function (res) {
//            content.set('html', '');
//
//            if (res) {
//                res.each(function (item) {
//                    this._createListItem(item).inject(content);
//                }.bind(this));
//            }
//
//        }.bind(this)}).get({category: pId, lang: window._session.lang});
//
//    },

//    _createListItem: function (pItem) {
//        var box = new Element('div', {
//            style: 'border-bottom: 1px solid #ddd; padding: 8px 4px; margin: 4px 0px'
//        });
//        var h3 = new Element('h3', {
//            html: pItem.title,
//            style: 'font-weight: bold;'
//        }).inject(box);
//
//        new Element('span', {
//            style: 'font-size: 10px; color: gray; font-weight: normal; padding-left: 5px;',
//            html: _('by %s').replace('%s', pItem.owner)
//        }).inject(h3);
//
//        var desc = new Element('div', {
//            style: 'color: gray; padding: 4px 0px; '
//        }).inject(box);
//
//        if (pItem.preview) {
//            new Element('img', {
//                style: 'float: right; border: 1px solid silver',
//                width: 150,
//                src: pItem.preview
//            }).inject(desc);
//        }
//
//        new Element('div', {
//            html: pItem.desc + '<br /><br/>Extensioncode: #' + pItem.name + '<br />' + 'Version: ' + pItem.version +
//                '<br />' + 'Downloads: ' + pItem.downloads
//        }).inject(desc);
//
//        new Element('div', {
//            style: 'clear: both;'
//        }).inject(box);
//
//        var line = new Element('div', {
//        }).inject(box);
//
//        new jarves.Button(_('Details')).addEvent('click',
//            function () {
//                jarves.wm.open('jarvesbundle/system/module/view', {name: pItem.code, type: 1});
//            }).inject(line);
//
//        new jarves.Button(_('To website')).set('href', 'http://www.jarves.org/extensions/' + pItem.name).set('target',
//            '_blank').inject(line);
//
//        return box;
//    },

//    openSidebar: function (pBoxes) {
//        this.boxPane.empty();
//
//        pBoxes.each(function (opts) {
//            var box = new Element('div', {
//                'style': 'background-color: #eee;'
//            }).inject(this.boxPane);
//
//            var title = new Element('h3', {
//                html: opts.title
//            }).inject(box);
//
//            var content = new Element('div', {
//                style: 'padding: 4px;',
//                html: '<center><img src="' + _path + 'bundles/jarves/admin/images/loading.gif" /></center>'
//            }).inject(box);
//
//            if (this.oldGetbox) {
//                this.oldGetbox.cancel();
//            }
//
//            this.oldGetbox = new Request.JSON({url: _pathAdmin +
//                'admin/system/bundle/managerGetBox/', noCache: 1, onComplete: function (res) {
//                if (res) {
//                    if (opts.render) {
//                        opts.render(res, content, title);
//                    } else {
//                        content.set('html', res.html);
//                    }
//                }
//            }.bind(this)}).get({code: opts.code});
//
//        }.bind(this));
//    },

    openCategories: function () {

        new Element('h2', {
            html: _('Categories'),
            style: 'margin: 2px;'
        }).inject(this.mainPane);

        this.categoryPane = new Element('div').inject(this.mainPane);
        this.categoryLines = 0;

        this.categoryPaneLeft =
            new Element('div', {style: 'float: left; width: 49%; padding: 5px 0px;'}).inject(this.mainPane);
        this.categoryPaneRight =
            new Element('div', {style: 'float: right; width: 49%; padding: 5px 0px;'}).inject(this.mainPane);

        this.addCategoryLine(_('Theme / Layouts'), 13);

        Object.each(this.categories, function (cat, id) {
            if (id != 13) {
                this.addCategoryLine(cat, id);
            }
        }.bind(this));
//
//        this.openSidebar([
//            {title: _('Best themes'), code: 'best-themes', more: this.viewPath.bind(this,
//                'best-themes'), render: this.renderBestThemes.bind(this)}
//        ]);

    },

//    renderBestThemes: function (pRes, pContent, pTitle) {
//        pContent.set('text', '');
//        pRes.each(function (item) {
//
//            var div = new Element('div', {
//                style: "border-bottom: 1px solid #ddd; margin-bottom: 4px; padding-bottom: 6px;",
//                'class': 'extensionmanager-box-item'
//            }).inject(pContent);
//
//            new Element('div', {
//                html: item.title,
//                style: 'font-weight: bold;'
//            }).inject(div);
//
//            new Element('div', {
//                text: '#' + item.code,
//                style: 'color :gray; font-size: 10px;'
//            }).inject(div);
//
//            var imgDiv = new Element('div', {
//                style: 'text-align: center; padding: 2px;'
//            }).inject(div);
//
//            new Element('img', {
//                width: 150,
//                style: 'border: 1px solid silver',
//                src: item.preview
//            }).inject(imgDiv);
//
//            new jarves.Button(_('Install')).addEvent('click',
//                function () {
//                    jarves.wm.open('jarvesbundle/system/module/view', {name: item.code, type: 1});
//                }).inject(div);
//
//        }.bind(this));
//    },

    addCategoryLine: function (pTitle, pId) {
        this.categoryLines++;
        var a = new Element('a', {
            html: '» ' + pTitle,
            href: 'javascript: ;',
            'class': 'extensionmanager-category-line'
        }).addEvent('click', function () {
                this.viewPath('category/' + pId);
            }.bind(this));

        /*
         if( pId == 13 ){
         a.setStyles({
         'font-size': 14,
         paddingBottom: 5
         });
         }*/

        if (this.categoryLines <= 9) {
            a.inject(this.categoryPaneLeft);
        } else {
            a.inject(this.categoryPaneRight);
        }
    }

});
