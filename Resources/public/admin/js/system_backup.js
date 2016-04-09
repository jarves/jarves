/*
 * This file is part of Jarves.
 *
 * (c) Marc J. Schmidt <marc@marcjschmidt.de>
 *
 *     J.A.R.V.E.S - Just A Rather Very Easy [content management] System.
 *
 *     http://jarves.io
 *
 * To get the full copyright and license information, please view the
 * LICENSE file, that was distributed with this source code.
 */

var jarves_system_backup = new Class({

    items: {},

    noAsyncSupport: false,

    initialize: function (pWin) {

        this.eachItems = {
            hour: _('Hour'),
            '3hour': _('3 Hours'),
            '6hour': _('6 Hours'),
            '12hour': _('12 Hours'),
            day: _('Day'),
            week: _('Week'),
            month: _('Month'),
            quarter: _('Quarter'),
            specifiy: _('Specifiy')
        };

        this.win = pWin;

        this.win.content.set('text', 'Todo');
        return;
        this.win.addEvent('close', function () {
            this.closed = true;
        }.bind(this));

        this.renderLayout();
        //TODO check if jarves.settings.cronjob_key is setup. if not, create alert with link to system->settings

        this.fieldDefs = {
            method: {
                label: _('Method'),
                type: 'select',
                desc: _("Please note: If you choose 'Generate later' you have to setup the cronjob script."),
                help: 'admin/backup-cronjob',
                items: {
                    download: _('Download now'),
                    cronjob: _('Generate later')
                },
                onChange: this.setAddButtons.bind(this),
                depends: {
                    savetarget: {
                        label: ('Save target'),
                        needValue: 'cronjob',
                        type: 'select',
                        items: {
                            local: _('Local'),
                            ftp: _('FTP'),
                            ssh: _('SSH')
                        },
                        depends: {

                            savetarget_local: {
                                needValue: 'local',
                                lable: _('Target'),
                                desc: _('Relative paths starts at the root of the jarves installation.'),
                                type: 'file'
                            }
                        }
                    },
                    start: {
                        label: _('Starts at'),
                        needValue: 'cronjob',
                        type: 'select',
                        items: {
                            immediately: _('Immediately'),
                            specifiy: _('Specifiy')
                        },
                        depends: {
                            start_date: {
                                needValue: 'specifiy',
                                type: 'datetime'
                            }
                        }
                    },
                    each: {
                        label: _('Each ...'),
                        needValue: 'cronjob',
                        type: 'select',
                        items: this.eachItems,
                        depends: {
                            each_minute: {
                                desc: _('Specify in minutes'),
                                needValue: 'specifiy',
                                type: 'datetime'
                            }
                        }
                    },

                    end: {
                        label: _('Ends at'),
                        needValue: 'cronjob',
                        type: 'select',
                        items: {
                            infinite: _('Infinite'),
                            specifiy: _('Specifiy')
                        },
                        depends: {
                            end_date: {
                                needValue: 'specifiy',
                                type: 'datetime'
                            }
                        }
                    },

                    maxrounds: {
                        label: _('Rounds'),
                        needValue: 'cronjob',
                        type: 'select',
                        items: {
                            infinite: _('Infinite'),
                            once: _('Once'),
                            specifiy: _('Specifiy')
                        },
                        depends: {
                            maxrounds_count: {
                                needValue: 'specifiy',
                                type: 'number',
                                width: 50
                            }
                        }
                    }
                }

            },

            pages: {
                label: _('Websites'),
                type: 'select',
                items: {
                    nothing: _('Nothing'),
                    all: _('All websites'),
                    choose: _('Choose nodes')
                },
                depends: {
                    pages_allversions: {
                        needValue: ['all', 'choose'],
                        label: _('With all versions'),
                        desc: _('This includes additionally all versions. Please note: Can blow up the backup file.'),
                        type: 'checkbox'
                    },
                    pages_domains: {
                        label: _('Whole website'),
                        needValue: 'choose',
                        desc: _('Please select one or more domains. All nodes below this domains will then be included.'),
                        type: 'textboxList',
                        store: 'backend/stores/domains'
                    },
                    pages_nodes: {
                        label: _('Nodes'),
                        needValue: 'choose',
                        desc: _('Please select one or more nodes.'),
                        type: 'array',
                        startWith: 1,
                        columns: [
                            {label: ''}
                        ],
                        fields: {
                            id: {
                                type: 'object',
                                object: 'JarvesBundle::Node'
                            }
                        }
                    }
                }
            },

            files: {
                label: _('Files'),
                desc: _('All files means all files except extension files.'),
                type: 'select',
                items: {
                    nothing: _('Nothing'),
                    all: _('All files'),
                    choose: _('Choose directories')
                },
                depends: {
                    files_allversions: {
                        needValue: ['all', 'choose'],
                        label: _('With all versions'),
                        desc: _('This includes additionally all versions. Please note: Can blow up the backup file.'),
                        type: 'checkbox'
                    },
                    files_choose: {
                        needValue: 'choose',
                        label: _('Folders'),
                        type: 'array',
                        startWith: 1,
                        columns: [
                            {label: ''}
                        ],
                        fields: {
                            folder: {
                                type: 'file',
                                multi: 0
                            }
                        }
                    }
                }
            },

            /* part of jarves.cms 1.1
             system: {
             label: _('Make a installation package'),
             desc: _('This includes then additionally all system files, the contents of the system database and the installer. Does not contain your system configuration. (inc/config.php)'),
             type: 'checkbox'
             },
             */

            extensions: {
                label: _('Extensions'),
                desc: _('Contains the whole package of an extension and also your translated languages and adjusted templates of each.'),
                type: 'select',
                items: {
                    nothing: _('Nothing'),
                    all: _('All additional extensions'),
                    choose: _('Choose extensions')
                },
                depends: {
                    extensions_choose: {
                        needValue: 'choose',
                        type: 'textboxList',
                        store: 'admin/backend/stores/extensions'
                    }
                }
            },

            extensions_data: {
                label: _('Extension contents'),
                desc: _('Means the contents in the database.'),
                type: 'select',
                items: {
                    nothing: _('Nothing'),
                    all: _('All additional extension'),
                    choose: _('Choose extension')
                },
                depends: {
                    extensions_data_allversions: {
                        needValue: ['all', 'choose'],
                        label: _('With all versions'),
                        desc: _('This includes additionally all versions. Please note: Can blow up the backup file.'),
                        type: 'checkbox'
                    },
                    extensions_data_choose: {
                        needValue: 'choose',
                        type: 'textboxList',
                        store: 'admin/backend/stores/extensions'
                    }
                }
            }
        }

        this.loadItems();
    },

    renderLayout: function () {

        this.left = new Element('div', {
            style: 'position: absolute; left: 0px; width: 200px; top: 0px;  overflow: auto;' +
                'bottom: 0px; border-right: 1px solid silver; background-color: #f7f7f7;'
        }).inject(this.win.content);

        this.main = new Element('div', {
            style: 'position: absolute; right: 0px; top: 0px;' + 'bottom: 0px; left: 201px; overflow: auto;'
        }).inject(this.win.content);

        this.btnGrp = this.win.addButtonGroup();
        this.btnNewBackup =
            this.btnGrp.addButton(_('New Backup'), _path + 'bundles/jarves/admin/images/icons/add.png', this.add.bind(this));
        this.btnImport = this.btnGrp.addButton(_('Import'), _path + 'bundles/jarves/admin/images/icons/database_import.png',
            this.import.bind(this));

        this.addGrp = this.win.addButtonGroup();
        this.addGrp.setStyle('margin-left', 130);
        this.addSaveBtn =
            this.addGrp.addButton(_('Save'), _path + 'bundles/jarves/admin/images/button-save.png', this.save.bind(this));

        this.addGenerateBtn =
            this.addGrp.addButton(_('Save and generate'), _path + 'bundles/jarves/admin/images/button-save-and-publish.png',
                this.generate.bind(this));
        this.addDeleteBtn =
            this.addGrp.addButton(_('Delete'), _path + 'bundles/jarves/admin/images/icons/delete.png', this.remove.bind(this));

        this.addGrp.hide();
    },

    renderItems: function (pItems) {

        this.left.empty();
        this.items = {};

        if (pItems['__noPopenAvailable']) {
            this.addPopenNotice();
        }

        Object.each(pItems, function (item, id) {
            if (id != '__noPopenAvailable') {
                this.addItem(id, item);
            }
        }.bind(this));

    },

    addPopenNotice: function () {

        if (this.noAsyncSupport == true) {
            return;
        }

        this.noAsyncSupport = true;

        this.left.setStyle('border-bottom', '1px solid silver');

        this.notice = new Element('div', {
            style: 'position: absolute; bottom: 0px; left:0px; width: 190px; padding: 5px;' +
                'height: 40px;background-color: #eee; line-height: 20px;',
            html: _('Your server does not support asynchronous php executions. <jarves:help id="admin/backup_no_popen_support">More</jarves:help>')
        }).inject(this.win.content, 'top');

        new Element('img', {
            src: _path + 'bundles/jarves/admin/images/icons/error.png',
            style: 'margin-right: 3px;',
            align: 'top'
        }).inject(this.notice, 'top');

        this.left.tween('bottom', 51);

    },

    loadItem: function (pId) {

        this.deselect();
        this.lastSelect = this.items[ pId ];

        if (this.lastZipList) {
            this.lastZipList.destroy();
        }

        this.btnNewBackup.setPressed(false);
        this.btnImport.setPressed(false);
        this.addDeleteBtn.show();

        this.addGrp.show();
        this.main.empty();

        this.mainTable = new Element('table').inject(this.main);
        this.mainTableBody = new Element('tbody').inject(this.mainTable);

        this.fields = new jarves.FieldForm(this.mainTableBody, this.fieldDefs, {allTableItems: 1});
        var values = this.items[ pId ].retrieve('item');

        this.fields.setValue(values);
        this.setAddButtons();

        this.win.clearTitle();
        this.win.addTitle('#' + pId);
        this.win.params = {backup_id: pId};

        this.items[ pId ].addClass('jarves-backup-item-active');

        if (values.generated > 0) {

            this.lastZipList = new Element('ol', {
                'class': 'jarves-backup-ziplist'
            }).inject(this.main, 'top');

            new Element('h3', {
                text: _('Generated backup files'),
                style: 'margin-bottom: 5px;'
            }).inject(this.lastZipList);

            Array.each(values.done, function (zip) {

                var li = new Element('li', {
                    'class': 'jarves-backup-ziplist-item',
                    html: '<a title="' + _('Download') + '" target="_blank" href="' + _path +
                        'admin/system/backup/download/?file=' + zip.name + '&id=' + pId + '">' + zip.name +
                        '</a><br /> <span style="color: gray">' +
                        _('took %f seconds').replace('%f', zip.took_time.toFixed(2)) + ', ' + jarves.bytesToSize(zip.size) +
                        '</span>'
                }).inject(this.lastZipList);

                var div = new Element('div', {
                    style: 'position: absolute; bottom: 5px; right: 4px; text-align: right;'
                }).inject(li);

                //TODO
                new jarves.Button(_('Delete')).inject(div);
                new jarves.Button(_('Import')).addEvent('click', this.import.bind(this, zip.path)).inject(div);

            }.bind(this));

        }

    },

    addItem: function (pId, pItem) {
        var div = new Element('div', {
            'class': 'jarves-backup-item'
        }).addEvent('click', this.loadItem.bind(this, pId)).inject(this.left);

        div.store('item', pItem);
        div.store('id', pId);
        this.items[ pId ] = div;

        var h2 = new Element('h2', {
            text: '#' + pId
        }).inject(div);

        if (pItem.method != 'download') {
            new Element('div', {
                text: _('Starts: ') +
                    ( pItem.start == 'immediately' ? _('Immediately') : new Date(pItem.start_date * 1000).format('db'))
            }).inject(div);

            var times = _('One times');
            if (pItem.maxrounds == 'infinite') {
                times = _('Infinite times');
            } else if (pItem.maxrounds == 'specifiy') {
                times = _('%d times').replace('%d', pItem.maxrounds_count);
            }

            var each = this.eachItems[pItem.each];
            if (pItem.each == 'specify') {
                each = _('%d Minutes').replace('%d', pItem.each_minute);
            }

            new Element('div', {
                text: _('Each: ') + each + ', ' + times
            }).inject(div);
            new Element('div', {
                text: _('Ends: ') +
                    ( pItem.end == 'infinite' ? _('Infinite') : new Date(pItem.end_date * 1000).format('db'))
            }).inject(div);
        } else {
            new Element('div', {
                text: _('One-time backup.')
            }).inject(div);
        }

        new Element('div', {
            html: _('Generated %d backups.').replace('%d', '<b>' + (pItem.generated ? pItem.generated : 0) + '</b>')
        }).inject(div);

        if (pItem.working) {
            this.attachProgressBar(div);

            if (pItem.startThroughAdministration) {

                var info = new Element('div', {
                    'class': 'jarves-backup-item-red',
                    text: _('Started through administration!')
                }).inject(h2, 'after');

                new Element('img', {
                    src: _path + 'bundles/jarves/admin/images/icons/error.png',
                    style: 'margin-right: 3px;',
                    align: 'top'
                }).inject(info, 'top');

                new Element('div', {
                    style: 'padding-bottom: 5px;',
                    html: _('Do not close the administration until the backup is done. <jarves:help id="admin/backup_started_in_administration">More</jarves:help>')
                }).inject(info, 'after');
            }
        }

        if (this.startNextBackupId == pId) {
            this.startBackup(pId);
        }

    },

    attachProgressBar: function (pDiv) {

        var progress = new jarves.Progress(_('Loading ...'), true);
        document.id(progress).inject(pDiv);
        document.id(progress).setStyle('margin-top', 5);

        var update;

        var id = pDiv.retrieve('id');

        var translate = {
            error: _('Error'),
            start: _('Started'),
            not_found: _('Backup deleted.'),
            done: '<b style="color: green">' + _('Done') + '</b>',
            domain: 'Domain: %s',
            gatherDone: _('Creating zip file.')
        };

        update = function () {
            new Request.JSON({url: _path + 'admin/system/backup/state', onComplete: function (res) {

                if (!this.closed) {

                    if (!res) {
                        progress.setText(_('Failed'));
                        progress.stop();
                        return;
                    }

                    var expl = res.split(':');
                    var trans_id = res;
                    var param = false;

                    if (res.indexOf(':') !== false) {
                        trans_id = res.split(':')[0];
                        param = res.split(':')[1];
                    }

                    var label = translate[trans_id] || trans_id;
                    if (param && label) {
                        label = label.replace('%s', param);
                    }

                    progress.setText(label);
                    if (res != 'done' && res != 'error' && res != 'not_found') {
                        update.delay(1000, this);
                    } else {
                        progress.stop();
                        if (res == 'done') {
                            this.loadItems();
                        }
                    }
                }

            }.bind(this)}).get({id: id});
        }.bind(this);

        update();

    },

    loadItems: function () {
        new Request.JSON({url: _path + 'admin/system/backup/list', onComplete: this.renderItems.bind(this)}).get();
    },

    save: function () {

        this.addSaveBtn.startTip(_('Save ...'));
        var id = '';

        if (this.lastSelect) {
            id = '?id=' + this.lastSelect.retrieve('id');
        }

        var req = this.fields.getValue();
        new Request.JSON({url: _path + 'admin/system/backup/save' + id, onComplete: function () {

            this.loadItems();
            this.addSaveBtn.stopTip(_('Done'));

            this.main.empty();
            this.addGrp.hide();
            this.btnNewBackup.setPressed(false);

        }.bind(this)}).post(req);

    },

    remove: function () {

        if (!this.lastSelect) {
            return;
        }

        this.win._confirm(_('Do you really want to remove this backup? All generated backups will be deleted.'),
            function (res) {
                if (res) {
                    this._remove();
                }
            }.bind(this));
    },

    _remove: function () {

        var id = '?id=' + this.lastSelect.retrieve('id');

        var req = this.fields.getValue();
        this.main.empty();

        new Request.JSON({url: _path + 'admin/system/backup/remove' + id, onComplete: function () {
            delete this.lastSelect;
            this.addGrp.hide();
            delete this.lastSelect;
            this.loadItems();
        }.bind(this)}).post(req);

    },

    startBackup: function (pId) {

        var failed = function () {
            jarves.helpsystem.newBubble(_('Error during creating backup'),
                _('There was a error during the creating of the backup. Please check the log window to get more informations. Maybe you should consider to increase the max_execution_time of your server.'),
                60000);
        };

        new Request.JSON({url: _path + 'admin/system/backup/start',
            onComplete: function (res) {
                if (res != true) {
                    failed();
                }
            }
        }).get({id: pId});
        delete this.startNextBackupId;

    },

    generate: function () {

        this.addGenerateBtn.startTip(_('Starting ...'));
        var id, req = this.fields.getValue();

        if (this.lastSelect) {
            id = '&id=' + this.lastSelect.retrieve('id');
        }
        new Request.JSON({url: _path + 'admin/system/backup/save?andStart=1' + id, onComplete: function (res) {

            this.addGenerateBtn.stopTip(_('Started'));

            this.main.empty();
            this.addGrp.hide();
            this.btnNewBackup.setPressed(false);

            if (res && res.startThroughAdministration) {
                this.startNextBackupId = res.startThroughAdministration;
            }

            this.loadItems();

        }.bind(this)}).post(req);

    },

    setAddButtons: function () {

        this.addSaveBtn.hide();
        this.addGenerateBtn.hide();
        this.addDeleteBtn.hide();

        if (this.lastSelect) {
            this.addDeleteBtn.show();
        }

        if (this.lastSelect) {

            var item = this.lastSelect.retrieve('item');

            if (item.method == 'download') {
                this.addGenerateBtn.show();
            } else {
                this.addSaveBtn.show();
            }

        } else {
            if ((!this.fields || this.fields.getValue('method') == 'download') && !this.lastSelect) {
                this.addGenerateBtn.show();
            } else {
                this.addSaveBtn.show();
            }
        }
    },

    import: function (pFilePath) {

        this.win.clearTitle();
        this.win.addTitle(_('Import'));

        this.deselect();
        this.btnNewBackup.setPressed(false);
        this.btnImport.setPressed(true);
        this.addGrp.hide();
        this.main.empty();

        this.importFile = new jarves.Field({
            type: 'file', label: _('Backup file'), desc: _('Choose the backup file and press Extract.')
        }, this.main);

        this.innerDiv = new Element('div', {style: 'padding: 15px; line-height: 30px;'}).inject(this.main);

        this.importExtractBtn = new jarves.Button(_('Extract')).inject(this.innerDiv);

        this.importProgressDiv = new Element('div', {
            style: 'display: none; padding: 10px; border: 1px solid #ddd; text-align: right; background-color: #f3f3f3; margin-top: 8px;'
        }).inject(this.innerDiv);
        this.importStatus = new jarves.Progress(_('Please wait ...'), true);
        this.importStatus.inject(this.importProgressDiv);

        document.id(this.importStatus).setStyle('margin-top', 7);
        this.importCancelExtractBtn = new jarves.Button(_('Cancel')).inject(this.importProgressDiv);

        if (typeOf(pFilePath) == 'string') {
            this.importFile.setValue(pFilePath);
            this.checkImport();
        }

    },

    checkImport: function () {

        var file = this.importFile.getValue();

        this.importExtractBtn.deactivate();
        this.importProgressDiv.setStyle('display', 'block');
        this.importStatus.setText(_('Extracting backup informations ...'));

        this.importExtractInformationsRq =
            new Request.JSON({url: _path + 'admin/system/backup/extractInfos', noCache: 1,
                onComplete: this.renderBackupInfos.bind(this)
            }).get({file: file});

    },

    renderBackupInfos: function (pInfos) {

        this.importProgressDiv.setStyle('display', 'none');

        if (!pInfos) {
            this.win._alert(_('There was an error during the extracting of the backup file.'));
            return;
        }

        this.importExtractBtn.activate();

        this.importExtractInfos = new Element('div', {
            style: 'padding: 15px; border-top: 1px solid silver;'
        }).inject(this.main);

        new jarves.Button(_('Import following data')).inject(this.importExtractInfos);
        new Element('div', {'style': 'margin-bottom: 15px;'}).inject(this.importExtractInfos);

        var checkboxes = {};

        //domains
        if (pInfos.domains) {
            checkboxes['domains'] = {};
            new Element('h3', {text: _('Domains')}).inject(this.importExtractInfos);
            var ol = new Element('ol').inject(this.importExtractInfos);

            Array.each(pInfos.domains, function (domain, id) {
                var li = new Element('li').inject(ol);
                checkboxes['domains'][id] = new Element('input', {
                    type: 'checkbox',
                    style: 'margin-right: 3px;',
                    checked: true
                }).inject(li);
                new Element('span', {
                    text: '[' + domain.lang + '] "' + domain.domain + '" ' +
                        _('with %d nodes').replace('%d', domain.page_count),
                }).inject(li);
            });
        }

        //nodes
        if (pInfos.nodes) {
            checkboxes['nodes'] = {};
            new Element('h3', {text: _('Nodes')}).inject(this.importExtractInfos);
            var ol = new Element('ol').inject(this.importExtractInfos);

            Array.each(pInfos.nodes, function (node, id) {
                var li = new Element('li').inject(ol);
                checkboxes['nodes'][id] = new Element('input', {
                    type: 'checkbox',
                    style: 'margin-right: 3px;',
                    checked: true
                }).inject(li);
                new Element('span', {
                    text: '"' + node.title + '" ' + _('with %d childs').replace('%d', node.page_count),
                }).inject(li);
                new Element('div', {
                    text: _('Please choose the entry point for this node.'),
                    style: 'color: gray;'
                }).inject(li);

                new jarves.Field({
                    type: 'object',
                    object: 'JarvesBundle::Node'
                }, li, {win: this.win})

            }.bind(this));
        }

        //files

        if (pInfos.countOfAllFiles > 0) {
            checkboxes['files'] = {};
            new Element('h3', {text: _('Files')}).inject(this.importExtractInfos);
            var ol = new Element('ol').inject(this.importExtractInfos);

            Object.each(pInfos.files, function (files, id) {

                var li = new Element('li').inject(ol);
                checkboxes['files'][id] = new Element('input', {
                    type: 'checkbox',
                    style: 'margin-right: 3px;',
                    checked: true
                }).inject(li);
                new Element('span', {
                    html: _('Folder %s with %d files (%f)').replace('%s',
                            '<span style="color: #555;">' + id + '/</span>').replace('%d',
                            pInfos.countOfFiles[id]).replace('%f', jarves.bytesToSize(pInfos.sizeOfFiles[id])),
                }).inject(li);

                var fol = new Element('ol', {style: 'color: #666; line-height: 15px;'}).inject(li);
                Array.each(files, function (file) {
                    new Element('li', {text: file}).inject(fol);
                });

            }.bind(this));
        }

    },

    add: function () {
        this.main.empty();
        this.deselect();

        this.mainTable = new Element('table').inject(this.main);
        this.mainTableBody = new Element('tbody').inject(this.mainTable);

        this.addGrp.show();

        this.btnNewBackup.setPressed(true);
        this.btnImport.setPressed(false);

        this.fields = new jarves.FieldForm(this.mainTableBody, this.fieldDefs, {allTableItems: 1});

        delete this.lastSelect;
        this.setAddButtons();
    },

    deselect: function () {
        if (this.lastSelect) {
            this.lastSelect.removeClass('jarves-backup-item-active');
        }
        delete this.lastSelect;
    }


});