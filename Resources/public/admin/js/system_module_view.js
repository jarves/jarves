var jarves_system_module_view = new Class({

    initialize: function (pWindow) {
        this.win = pWindow;
        this.loadInfos();
        this.checkboxes = new Hash({});
    },

    loadInfos: function () {
        this.win.content.empty();

        var id = (this.win.params.values) ? this.win.params.values.id : false;
        if (!id) {
            id = this.win.params.name;
        }

        if (typeOf(this.win.params.type) == 'undefined') {
            this.win.params.type = 0;
        }

        this.loading = new jarves.Loader(this.win.content);
        this.loading.show();

        new Request.JSON({url: _pathAdmin +
            'admin/system/bundle/manager/info', noCache: 1, onComplete: function (res) {
            this.loading.hide();

            this.currentValues = res;

//            if (res.module && res.module.notExist == 1) {
//                this.win._alert(_('Module not found.'), function () {
//                    this.win.close();
//                }.bind(this));
//                return;
//            }
//            if (res.module && res.module.noConfig) {
//                this.win._alert(_('Config.json not found.'), function () {
//                    this.win.close();
//                }.bind(this));
//                return;
//            }
//            if (this.win.params.type == 1 && res.cannotConnect) {
//                this.win._alert(_('Cannot connect to jarves server'), function () {
//                    this.win.close();
//                }.bind(this));
//                return;
//            }
            this.renderContent(res.data);

//            if (this.twiceLoading != true) {
//                if (this.win.params.updateNow == 1) {
//                    if (res.serverCompare == '>') {
//                        this.confirmDowngrade();
//                    } else {
//                        this.update();
//                    }
//                }
//                if (this.win.params.removeNow == 1) {
//                    this.renderRemove();
//                }
//            }
//            this.twiceLoading = true;
        }.bind(this)}).get({type: this.win.params.type, bundle: id});
    },

    confirmDowngrade: function () {
        this.win._confirm(_('Really downgrade extension?'), function (p) {
            if (!p) {
                this.loadInfos();
            } else {
                this.update(false);
            }
        }.bind(this));
    },

    renderContent: function (info) {
        this.info = info;

        var lang = jarves.settings['user']['adminLanguage'];

        var title = info.name;
        var desc = info.description;

        this.win.setTitle(title + ' - ' + _('package'));
        if (info.tags) {
            var tags = info.info;
        }

        new Element('h2', {
            html: title,
            style: 'margin-bottom: 0px;'
        }).inject(this.win.content);

//        if (pItem.owner_name) {
//            pItem.module.cached_owner_name = pItem.owner_name;
//            pItem.module.cached_category_title = pItem.category_title;
//        }

//        if (pItem.module.cached_owner_name) {
//
//            new Element('div', {
//                style: 'padding: 5px;',
//                html: _('from') + ' <b>' + pItem.module.cached_owner_name + '</b> ' + _('in category') + ' <b>' +
//                    _(pItem.module.cached_category_title) + '</b>'
//            }).inject(this.win.content);
//
//        }

        var d = new Element('div', {
            style: 'padding: 5px;'
        }).inject(this.win.content)

        var table = new Element('table', {cellspacing: 2, cellpadding: 0, width: '100%'}).inject(d);
        var tablebody = new Element('tbody').inject(table);

//        var tr = new Element('tr').inject(tablebody);
//        var td = new Element('td', {height: 20, html: _('Extensioncode')}).inject(tr);
//        var td = new Element('td', {text: pItem.module.extensionCode}).inject(tr);

//        var td = new Element('td',
//            {rowspan: 5, width: 150, html: '<img style="padding: 3px; border: 1px solid #ddd;" src="http://download.jarves.org/extThump?extension=' +
//                pItem.name + '" width="150"/>'}).inject(tr);

        var tr = new Element('tr').inject(tablebody);
        var td = new Element('td', {height: 20, html: _('Version')}).inject(tr);
        var td = new Element('td', {html: (info._installed.version) ? info._installed.version :
            t('Local')
        }).inject(tr);

        var tr = new Element('tr').inject(tablebody);
        var td = new Element('td', {colspan: 2}).inject(tr);
        new Element('div', {
            style: 'margin: 5px 5px 5px 0px; border: 1px solid #ccc; background-color: #f3f3f3; padding: 5px;',
            html: desc
        }).inject(td);

//        if (info._installed) {
//            var tr = new Element('tr').inject(tablebody);
//            var td = new Element('td', {height: 25, html: _('Installed version')}).inject(tr);
//            var td = new Element('td', {text: pItem.installedModule.version + ' '}).inject(tr);
//            if (pItem.installedModule && pItem.installedModule.version != pItem.serverVersion) {
//                td.setStyle('color', 'red');
//            } else {
//                td.setStyle('color', 'green');
//            }
//            if (pItem.serverCompare == '>') {
//                new Element('img',
//                    { title: _('Local version newer than server version!'), src: '/inc/admin/images/icons/error.png' }).inject(td);
//            }
//        }

//        if (this.win.params.type != 1 && this.win.params.type != 0) {
//
//            var tr = new Element('tr').inject(tablebody);
//            var border2 = new Element('td', {colspan: 2}).inject(tr);
//
//            new Element('div', {
//                html: _('You view a locale installation package!'),
//                style: 'color: orange; font-weight: bold;'
//            }).inject(border2);
//            new Element('div', {
//                html: _('Package') + ': <span style="color: gray;">' + this.win.params.type + "</span>"
//            }).inject(border2);
//            new Element('div', {
//                html: _('Package version: %s').replace('%s', pItem.module.version)
//            }).inject(border2);
//        }

//        var tr = new Element('tr').inject(tablebody);
//        var td = new Element('td', {colspan: 2, style: 'padding-left: 5px;'}).inject(tr);
//
//        if (pItem.name != 'admin' && pItem.name != 'jarves' && pItem.name != 'users') {
//            new jarves.Button(_('To website')).addEvent('click',
//                function () {
//                    window.open('http://www.jarves.org/extensions/' + pItem.name, '_blank');
//                }).inject(td);
//        }
//
//        if (!pItem.installed) {
//            new jarves.Button(_('Install')).addEvent('click', this.install.bind(this)).inject(td);
//        } else {
//
//            if (pItem.name != 'admin' && pItem.name != 'jarves' && pItem.name != 'users') {
//                new jarves.Button(_('Deinstall')).addEvent('click', this.renderRemove.bind(this)).inject(td);
//            } else {
//                new Element('div', {
//                    text: _('System-Extension')
//                }).inject(td);
//            }
//        }
//
//        if ((pItem.installedModule && pItem.serverVersion && pItem.installedModule.version != pItem.serverVersion) ||
//            ( ( this.win.params.type != 1 && this.win.params.type != 0) &&
//                pItem.module.version != pItem.installedModule.version )) {
//
//            if (pItem.serverCompare == '>') {
//                new jarves.Button(_('Downgrade')).addEvent('click', this.confirmDowngrade.bind(this)).inject(td);
//            } else {
//                new jarves.Button(_('Update')).addEvent('click', this.update.bind(this, false)).inject(td);
//            }
//        }

        var border = new Element('div', {
            style: 'padding: 2px; border: 0px solid #ddd; margin-bottom: 3px;'
        }).inject(this.win.content);

        var tabPane = new jarves.TabPane(border);

        var descPane = tabPane.addPane(_('General'));

        var table = new Element('table').inject(descPane.pane);
        var tbody = new Element('tbody').inject(table);
        var tr = new Element('tr').inject(tbody);

        var tags = '';
        if (info.tags) {
            tags = info.tags;
        }

        var td = new Element('td', {width: 150, text: _('Tags:')}).inject(tr);
        var td = new Element('td', {style: 'color: gray;', text: (tags != "") ? tags : _('No tags')}).inject(tr);

//        var tr = new Element('tr').inject(tbody);
//
//        var td = new Element('td', {width: 150, valign: 'top', text: _('Last publish:')}).inject(tr);
//        var td = new Element('td', {text: new Date(pItem.published * 1000).format('db')}).inject(tr);

        var tr = new Element('tr').inject(tbody);
        var td = new Element('td', {valign: 'top', text: _('Dependency:')}).inject(tr);
        var td = new Element('td', {text: info.require ? 'todo' : _('No dependency')}).inject(tr);

//        var dbPane = tabPane.addPane(_('Database'));
//
//        var table = new Element('table').inject(dbPane.pane);
//        var tbody = new Element('tbody').inject(table);
//        var tr = new Element('tr').inject(tbody);
//        var td = new Element('td', {valign: 'top', width: 150, text: _('Tables:')}).inject(tr);
//        var td = new Element('td').inject(tr);
//        if (pItem.module.db) {
//            var html = '';
//            $H(pItem.module.db).each(function (columns, table) {
//                html += '<b style=" color: gray;">' + table + '</b><br />';
//            });
//            td.set('html', html);
//            if (pItem.installed) {
//                new jarves.Button(_('Database update')).addEvent('click',
//                    function () {
//                        jarves.wm.open('jarvesbundle/system/module/dbInit', {name: pItem.name});
//                    }).inject(td);
//            }
//
//        } else {
//            td.set('text', _('No tables.'));
//        }

        tabPane.to(0);

//        if (pItem.serverVersion == false) {
//            new Element('div', {
//                html: _('Cannot connect to Server to retrieve latest version.')
//            }).inject(border);
//        }

    },

    install: function () {
        var _this = this;
        this.win.setTitle(_('Install extension'));
        this.installMode = true;

        this.loading = new jarves.Loader(this.win.content);
        ;
        this.loading.show();

        //this.boxNavi.hide();
        new Request.JSON({url: _pathAdmin +
            'admin/system/bundle/getPrepareInstall/', noCache: 1, onComplete: function (res) {
            _this.loading.hide();

            //todo re comment out in jarves.cms 0.9
            if (res.needPackages) {
                _this.renderDepends(res, true);
            } else {
                if (res.modifiedFiles && res.modifiedFiles.length > 0) {
                    _this.renderInstallForm(res, true);
                } else {
                    _this._install(true);
                }
            }
        }}).post(this.win.params);
    },

    _install: function (pDirectly) {
        var req = {go: true};

        if (!pDirectly) {
            var files = $H({});
            this.checkboxes.each(function (item, file) {
                files.include(file, (item.checked) ? 1 : 0);
            });
            req.files = JSON.encode(files);
        }

        req.name = this.win.params.name;
        req.type = this.win.params.type;
        if (this.dependFiles) {
            req.dependfiles = {};
            $H(this.dependFiles).each(function (field, fieldKey) {
                req.dependfiles[ fieldKey ] = field.getValue();
            })
        }

        this.win.content.empty();
        //this.boxNavi.destroy();

        this.loading = new jarves.Loader(this.win.content);
        this.loading.show();

        new Request.JSON({url: _pathAdmin +
            'admin/system/bundle/installModule/', noCache: 1, onComplete: function (res) {

            if (this.currentValues && this.currentValues.module.category == 13 && this.installMode)//layout
            {
                jarves.helpsystem.newBubble(_('New themes installed'),
                    _('You have installed a new theme package. Please read the article <jarves:help id="admin/use-theme-packages">Use theme packages</jarves:help> to check out what you can do.'),
                    30000);//30sec
            }

            new Request.JSON({url: _pathAdmin + 'admin/system/bundle/dbInit/', noCache: 1, onComplete: function (res) {
                this.loading.hide();
                jarves.check4Updates();
                jarves.loadMenu();
                this.win._alert(_('Installation complete'), function () {
                    this.loadInfos();
                }.bind(this));
            }.bind(this)}).post({name: req.name});

            jarves.loadSettings();
            jarves.wm.sendSoftReload('admin/system/module');
        }.bind(this)}).post(req);
    },

    update: function () {
        var _this = this;
        this.win.setTitle(_('Update extension'));
        if (this.win.params.type == 0) {
            this.oldType = 0;
            this.win.params.type = 1;
        }

        this.isUpdate = true;

        this.loading = new jarves.Loader(this.win.content);
        this.loading.show();

        new Request.JSON({url: _pathAdmin +
            'admin/system/bundle/getPrepareInstall/', noCache: 1, onComplete: function (res) {
            _this.loading.hide();

            if (res.needPackages) {
                _this.renderDepends(res);
            } else {
                if ((res.modifiedFiles && res.modifiedFiles.length > 0)) {
                    _this.renderInstallForm(res);
                } else {
                    _this._install(true);
                }
            }
        }}).post(this.win.params);
    },

    renderDepends: function (pValues, pInstall) {

        this.win.content.empty();

        if (pInstall) {
            this.win.setTitle(_('Install extension'));
        } else {
            this.win.setTitle(_('Update extension'));
        }

        var lang = window._session.lang;
        var title = this.item.module.title[lang] ? this.item.module.title[lang] : this.item.module.title['en'];

        var div = new Element('div', {
            style: 'padding: 3px;'
        }).inject(this.win.content);

        new Element('h2', {
            html: title,
            style: 'margin-bottom: 0px; margin-top: 3px;'
        }).inject(div);

        new Element('div', {
            text: '#' + this.item.module.extensionCode,
            style: 'color: gray; font-size: 11px;'
        }).inject(div);

        var div = new Element('div', {
            style: 'padding-top: 5px; padding-bottom: 5px;'
        }).inject(this.win.content);

        new jarves.Button(_('Cancel')).addEvent('click', this.loadInfos.bind(this)).inject(div);

        this.dependsGoNext = new jarves.Button(_('Next')).addEvent('click', function () {

            if (!this.item.installed) {
                this.install();
            } else {
                this.update();
            }

            //this.checkAllDepends.bind(this, false))
        }.bind(this)).inject(div);

        var div = new Element('div', {
            style: 'padding-top: 5px; padding-bottom: 5px;'
        }).inject(this.win.content);

        new Element('h3', {
            text: _('Dependencies found')
        }).inject(div);

        /*
         this.needFiles = [];
         this.filesOk = [];
         this.checkDepends = [];
         this.loadingDiv = {};

         var depends = new Element('ul').inject( div );
         this.dependsUl = depends;

         this.dependFiles = {};
         this.depends_ext = pValues.depends_ext;
         */

        this.dependFiles = {}; //jarves.fields
        this.dependsStatus = {}; //status, ok or needfile
        this.dependDivContainer = {}; //container for child depended extensions

        this.checkDepends(this.item.module.extensionCode, this.win.params.type, div);

        return;

    },

    _renderDepends: function (pRes, pDiv) {

        var ul = new Element('ul').inject(pDiv);

        $H(pRes.depends_ext).each(function (extInfo, extKey) {

            var li = new Element('li', {
                style: 'padding: 2px'
            }).inject(ul);

            var needManuelSelection = false;

            //li.store('code', extKey);

            var titel = new Element('div', {
                html: extKey + ' <span style="color: gray">' + extInfo['needVersion'] + '</span>, ',
                style: 'font-weight: bold;'
            }).inject(li);

            var img = 'error';

            if (extInfo.installed) {
                new Element('span', {
                    html: _('Installed'),
                    style: 'color: green; font-weight: normal;'
                }).inject(titel);
                img = 'accept';
            }

            if (extInfo.needUpdate && extInfo.server_version && !extInfo.server_version_not_ok) {
                new Element('span', {
                    html: _('will be updated from %1 to %2').replace('%1', extInfo.installedVersion).replace('%2',
                        extInfo.toVersion),
                    style: 'color: green; font-weight: normal;'
                }).inject(titel);
            }

            if (!extInfo.installed && extInfo.server_version && !extInfo.server_version_not_ok) {
                new Element('span', {
                    html: _('will be installed'),
                    style: 'color: green; font-weight: normal;'
                }).inject(titel);
            }

            if (!extInfo.installed) {

                if (!extInfo.server_version) {

                    new Element('span', {
                        html: _('Extension not found in the repository server.'),
                        style: 'color: red; font-weight: normal;'
                    }).inject(titel);
                    img = 'stop';

                    //needManuelSelection = true;
                    //li.store('needFile', true);
                    this.dependsStatus[ extKey ] = 'ok';

                    this.dependFiles[extKey] = new jarves.Field({
                        type: 'file', empty: false, label: 'Installation package', desc: _('Jarves cms can not fetch server information. Please choose the proper installation file')
                    }).inject(li);
                }

                if (extInfo.server_version_not_ok) {
                    //needManuelSelection = true;
                    //li.store('needFile', true);

                    //this.needFiles.include(extKey);

                    img = 'stop';

                    new Element('span', {
                        html: _('Version does not exist in the repository server.'),
                        style: 'color: red; font-weight: normal;'
                    }).inject(titel);

                    new Element('div', {
                        style: 'padding: 3px; padding-left: 14px; padding-top: 7px;',
                        text: _('Server version: %s').replace('%s', extInfo.server_version_not_ok_version)
                    }).inject(li);

                    new Element('div', {
                        style: 'padding: 3px; padding-left: 14px; padding-top: 7px;',
                        text: _('Please install the installation package manual via installation files.')
                    }).inject(li);

                    /*
                     this.dependsStatus[ extKey ] = 'needfile';

                     this.dependFiles[extKey] = new jarves.Field({
                     type: 'file', empty: false, label: 'Installation package',
                     desc: _('Jarves cms can not fetch the proper package with the needed version. Please choose the proper installation file')
                     }).inject( li );

                     new jarves.Button(_('Install')).inject(); */

                    //this.dependDivContainer[extKey] = new Element('div').inject( li );

                }
            }

            new Element('img', {
                src: _path + 'bundles/jarves/admin/images/icons/' + img + '.png',
                style: 'position: relative; top: 2px; margin-right: 3px;'
            }).inject(titel, 'top');

        }.bind(this));

    },

    checkAllDepends: function () {

        var allOk = true;

        $H(this.dependsStatus).each(function (status, extKey) {

            if (status != 'ok') {
                allOk = false;
                /*if( status == 'needfile' ){
                 if( this.dependFiles[extKey].getValue() != '' ){

                 this.checkDepends( '', this.dependFiles[extKey].getValue(), this.dependDivContainer[extKey] );

                 }
                 }*/
            }

        }.bind(this));

    },

    checkDepends: function (pName, pType, pDiv) {

        pDiv.empty();

        pDiv.set('html', _('Checking dependencies ...'));

        this.dependsGoNext.hide();

        new Request.JSON({url: _pathAdmin +
            'admin/system/bundle/getPrepareInstall/', noCache: 1, onComplete: function (res) {
            this.dependsGoNext.show();

            pDiv.empty();

            if (res.needPackages) {
                //one or more dependencies are not installed

                this._renderDepends(res, pDiv);

            } else {
                //all fine, all dependencies are installed
            }

        }.bind(this)}).post({name: pName, type: pType});

        return;
        /*
         new Request.JSON({url: _path+'admin/system/bundle/getDependExtension', noCache: 1, onComplete: function( pRes ){

         //this.dependsQueue.include( extKey );

         if( pRes.ok == true ){
         li.store('ok', true);


         this.filesOk.include(extKey);
         this.checkDepends.include(extKey);

         new Element('div', {
         style: 'padding: 3px; padding-left: 14px; padding-top: 7px; color: green;',
         text: _('This package will be installed')
         }).inject( div, 'after' );
         div.destroy();
         } else {
         field.show();
         li.store('ok', false);

         this.filesOk.erase(extKey);
         div.set('text', _('This installation file contains not the correct version. Please select this right one.'));

         }
         this._checkDependsIsFinished();

         }.bind(this)}).post({name: extKey, file: field.getValue(), version: version});
         */

    },

    /*
     _checkDepends: function(){

     if( this.dependsAllOk ){
     this._install();
     }


     var go = true;
     $H(this.dependFiles).each(function(field, extKey){
     if( !field.isOk() ){
     field.highlight();
     go = false;
     }
     }.bind(this))

     if( go == true ){

     //this.dependsGoNext.hide();
     this.dependsQueue = [];

     this.dependsUl.getElements('li').each(function(li){

     if( !li.retrieve('needFile') ){
     li.store('ok', true);
     return;
     }

     var extKey = li.retrieve('code');

     var field = this.dependFiles[extKey];
     field.hide();
     var version = this.depends_ext[extKey].needVersion;

     if( li.retrieve('infoDiv') ){
     li.retrieve('infoDiv').destroy();
     }

     var div = new Element('div', {
     'class': 'jarves-jarves-modules-depends-status',
     style: 'padding: 10px;',
     text: _('Loading ...')
     }).inject( li );

     this.loadingDiv[ extKey ] = div;

     li.store('infoDiv', div);

     new Element('img', {
     src: _path+ PATH_WEB + '/admin/images/jarves-tooltip-loading.gif',
     style: 'position: relative; top: 2px; margin-right: 3px;'
     }).inject( div, 'top' );


     this.checkDepends.erase(extKey);

     new Request.JSON({url: _path+'admin/system/bundle/getDependExtension', noCache: 1, onComplete: function( pRes ){

     this.dependsQueue.include( extKey );
     if( pRes.ok == true ){
     li.store('ok', true);


     this.filesOk.include(extKey);
     this.checkDepends.include(extKey);

     new Element('div', {
     style: 'padding: 3px; padding-left: 14px; padding-top: 7px; color: green;',
     text: _('This package will be installed')
     }).inject( div, 'after' );
     div.destroy();
     } else {
     field.show();
     li.store('ok', false);

     this.filesOk.erase(extKey);
     div.set('text', _('This installation file contains not the correct version. Please select this right one.'));

     }
     this._checkDependsIsFinished();

     }.bind(this)}).post({name: extKey, file: field.getValue(), version: version});

     }.bind(this))
     }
     },*/

    _checkDependsIsFinished: function () {
        var allOk = true;

        //check if the fields are empty
        if (this.needFiles.length > 0) {
            this.needFiles.each(function (item) {
                if (!this.filesOk.contains(item)) {
                    allOk = false;
                }
            }.bind(this));
        }

        //check whether a dependency exist

        this.checkDepends.each(function (item) {

            var div = this.loadingDiv[ item ];
            div.empty();

            div.set('html', _('Check dependency ...'));

            new Request.JSON({url: _pathAdmin +
                'admin/system/bundle/getDependExtension', noCache: 1, onComplete: function (pRes) {

                if (pRes.ok == true) {

                    this.filesOk.include(extKey);
                    this.checkDepends.include(extKey);

                    new Element('div', {
                        style: 'padding: 3px; padding-left: 14px; padding-top: 7px; color: green;',
                        text: _('This package will be installed')
                    }).inject(div, 'after');

                } else {

                    this.filesOk.erase(extKey);
                    div.set('text',
                        _('This installation file contains not the correct version. Please select this right one.'));

                    //new jarves.Field

                }
                this._checkDependsIsFinished();

            }.bind(this)}).post({name: extKey, file: field.getValue(), version: version});

        }.bind(this));

        /*
         this.dependsUl.getElements('li').each(function(li){
         if( !li.retrieve('needFile') ){
         if( li.retrieve('ok') != true )
         allOk = false;
         }
         });
         */

        if (allOk) {
            this.dependsGoNext.show();
            logger('allok')
            //this.dependsAllOk = true;
        }
    },

    renderInstallForm: function (pValues, pInstall) {
        var _this = this;

        this.win.content.empty();

        var _this = this;

        if (pInstall) {
            new Element('h3', {
                html: _('install extension')
            }).inject(this.win.content);
        } else {
            new Element('h3', {
                html: _('Update extension')
            }).inject(this.win.content);
        }

        var lang = window._session.lang;
        var title = this.item.module.title[lang] ? this.item.module.title[lang] : this.item.module.title['en'];

        var div = new Element('div', {
            style: 'padding: 3px;'
        }).inject(this.win.content);

        new Element('h2', {
            html: title,
            style: 'margin-bottom: 0px; margin-top: 3px;'
        }).inject(div);

        new Element('div', {
            text: '#' + this.item.name,
            style: 'color: gray; font-size: 11px;'
        }).inject(div);

        var div = new Element('div', {
            style: 'padding-top: 5px; padding-bottom: 5px;'
        }).inject(this.win.content);

        new jarves.Button(_('Cancel')).addEvent('click', this.loadInfos.bind(this)).inject(div);

        if (this.isUpdate) {
            new jarves.Button(_('Update now')).addEvent('click', this._install.bind(this, false)).inject(div);
        } else {
            new jarves.Button(_('Install now')).addEvent('click', this._install.bind(this, false)).inject(div);
        }

        var div = new Element('div', {
            style: 'padding-top: 5px; padding-bottom: 5px;'
        }).inject(this.win.content);

        if ((pValues.modifiedFiles && pValues.modifiedFiles.length > 0)) {

            new Element('h3', {
                text: _('Modified files found')
            }).inject(div);

            if (pValues.modifiedFiles.length > 0) {
                new Element('div', {
                    html: _('Select files to overwrite')
                }).inject(div);
            } else {
                new Element('div', {
                    html: _('No modified files')
                }).inject(div);
            }

            var ol = new Element('ol').inject(div);
            pValues.modifiedFiles.each(function (item, key) {
                var li = new Element('li', {
                    html: item + ' <a href="javascript:;" onclick="jarves.wm.open(\'admin/files/edit/\', {file: {path: \'' +
                        item + '\'}})">' + _('Old') + '</a> | ' +
                        '<a href="javascript:;" onclick="jarves.wm.open(\'admin/files/edit/\', {file: {path: \'data/packages/modules/' +
                        this.win.params.name + '/' + item + '\'}})">' + _('New') + '</a> | ' +
                        '<a href="javascript:;" onclick="jarves.wm.open(\'admin/files/diff/\', {filefrom: {path: \'' +
                        item + '\'}, fileto: {path: \'data/packages/modules/' + this.win.params.name + '/' + item +
                        '\'}})">' + _('Diff') + '</a>'
                }).inject(ol);
                _this.checkboxes.include(item, new Element('input', {
                    type: 'checkbox'
                }).inject(li, 'top'));
            }.bind(this));

            if (pValues.newFiles && !(pValues.newFiles.length > 0)) {
                new Element('div', {
                    html: _('No new files')
                }).inject(this.win.content);
            } else if (pValues.newFiles) {
                var ol = new Element('ol').inject(this.win.content);
                pValues.newFiles.each(function (item, key) {
                    new Element('li', {
                        text: item
                    }).inject(ol);
                });
            }

        }

    },

    remove: function () {

        this.win._confirm(_('Really remove ?'), function (p) {
            if (!p) {
                this.loadInfos();
                return;
            }

            var files = $H({});
            this.removeCheckboxes.each(function (item, file) {
                files.include(file, (item.checked) ? 1 : 0);
            });
            files = JSON.encode(files);
            new Request.JSON({url: _pathAdmin + 'admin/system/bundle/remove', noCache: 1, onComplete: function (res) {
                jarves.loadMenu();
                jarves.wm.sendSoftReload('admin/system/module');
                this.win.close();
            }.bind(this)}).post({name: this.win.params.name, files: files});
        }.bind(this));
    },

    renderRemove: function () {
        //this.boxNavi.destroy();
        this.win.content.empty();
        this.loader = new jarves.Loader(this.win.content);
        this.loader.show();
        this._renderRemove();
    },

    _renderRemove: function () {
        var _this = this;

        var _this = this;

        var lang = jarves.settings['user']['adminLanguage'];
        var title = this.item.module.title[lang] ? this.item.module.title[lang] : this.item.module.title['en'];
        new Element('h3', {
            html: title,
            style: 'margin-bottom: 0px; font-size: 13px; font-weight: bold;'
        }).inject(this.win.content);

        new Element('div', {
            text: '#' + this.item.name,
            style: 'color: gray; font-size: 10px; font-family: Monospace'
        }).inject(this.win.content);

        new Element('h3', {
            html: _('Deinstall extension')
        }).inject(this.win.content);

        this.removeCheckboxes = new Hash();

        new Request.JSON({url: _pathAdmin +
            'admin/system/bundle/getChangedFiles', noCache: 1, onComplete: function (res) {

            if (res.modifiedFiles.length > 0) {
                this.loader.hide();
                new Element('div', {
                    html: _('Following files has been changed after installating. Selected files will be remove.'),
                    style: 'color: gray; padding: 5px 0px 5px 0px;'
                }).inject(this.win.content);

                var ol = new Element('ol').inject(this.win.content);

                res.modifiedFiles.each(function (item, key) {
                    var li = new Element('li', {
                        html: item
                    }).inject(ol);
                    this.removeCheckboxes.include(item, new Element('input', {
                        type: 'checkbox'
                    }).inject(li, 'top'));
                }.bind(this));

                new jarves.Button(_('Deinstall now')).addEvent('click', this.remove.bind(this)).inject(this.win.content);

            } else {
                this.remove();
            }

        }.bind(this)}).post({name: this.win.params.name});
    }
});
