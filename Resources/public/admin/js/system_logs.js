var jarves_system_logs = new Class({

    initialize: function(pWin) {
        this.win = pWin;

        this.win.addEvent('close', function() {
            if (this.lastLiveLogTimer) {
                clearTimeout(this.lastLiveLogTimer);
            }
        }.bind(this));

        this._renderLayout();
    },

    _renderLayout: function() {
        var p = new Element('div', {
            style: 'position: absolute; left: 0px; top: 0px; right: 0px; bottom: 31px;'
        }).inject(this.win.content);

        var bottomBar = new jarves.ButtonBar(this.win.content);

        this.logsTop = new Element('div', {
            style: 'position: absolute; left: 0px; top: 0px; right: 0px; height: 65px; padding: 5px;'
        }).inject(p);

        this.btnDiv = new Element('div', {style: 'position: absolute; right: 15px; top: 15px;'}).inject(this.logsTop);

        this.btnClearLogs = new jarves.Button(_('Clear logs')).addEvent('click', this.clearLogs.bind(this)).inject(this.btnDiv);

        this.btnRefresh = new jarves.Button(_('Refresh')).addEvent('click', this.reloadLogsItems.bind(this)).inject(this.btnDiv);

        this.btnDiv2 = new Element('div', {
            style: 'padding: 0px 17px; float: right;'
        }).inject(this.btnDiv);

        this.liveLog = new jarves.Checkbox(this.btnDiv2).addEvent('change', this.toggleLiveLog.bind(this));

        this.logRequestsTableContainer = new Element('div', {
            style: 'position: absolute; left: 0px; top: 77px; right: 0px; bottom: 31px; overflow: auto;'
        }).inject(p);


        this.logRequestsTable = new jarves.Table().inject(this.logRequestsTableContainer);
        this.logRequestsTable.setColumns([
            [_('Date'), 160],
            [_('Profile'), 40],
            [_('Request'), 80],
            [_('User'), 120],
            [_('IP'), 80],
            [_('Path'), 200],
            [_('Debug')],
            [_('Info/Notice'), 80],
            [_('Warning')],
            [_('Error')],
            [_('Critical')],
            [_('Alert/Emerg.')]
        ]);

        new Element('label', {
            'for': this.win.id + 'jarves-logs-liveLogCheckbox',
            text: _('Live log')
        }).inject(this.btnDiv2);

        var myPath = _path + 'bundles/jarves/admin/images/icons/';

        this.logsRequestCtrlPrevious = new Element('img', {
            src: myPath + 'control_back.png'
        }).addEvent('click', function() {
                this.loadLogRequestItems(parseInt(this.logsCurrentPage) - 1);
            }.bind(this)).inject(bottomBar.box);

        this.logsRequestCtrlText = new Element('span', {
            text: 1,
            style: 'padding: 0px 3px 5px 3px; position: relative; top: -4px;'
        }).inject(bottomBar.box);

        this.logsRequestCtrlNext = new Element('img', {
            src: myPath + 'control_play.png'
        }).addEvent('click', function() {
                this.loadLogRequestItems(parseInt(this.logsCurrentPage) + 1);
            }.bind(this)).inject(bottomBar.box);

        this.loadLogRequestItems();
    },

    toggleLiveLog: function() {
        if (!this.liveLog.getValue() && this.lastLiveLogTimer) {
            clearTimeout(this.lastLiveLogTimer);
        } else {
            this.reloadLogsItems(true);
        }
    },

    openLogs: function(requestId) {
        var dialog = new jarves.Dialog(this.win, {
            withButtons: true,
            cancelButton: false,
            applyButtonLabel: 'OK',
            minWidth: '80%',
            minHeight: '80%',
            absolute: true
        });

        this.currentRequestId = requestId;

//        this.logsLevelSelect = new jarves.Field({
//            type: 'select',
//            label: _('Level'),
//            inputWidth: 200,
//            objectItems: [
//                {all: t('All')},
//                {100: t('Debug (100)')},
//                {200: t('Info (200)')},
//                {250: t('Notice (250)')},
//                {300: t('Warning (300)')},
//                {400: t('Error (400)')},
//                {500: t('Critical (500)')},
//                {550: t('Alert (550)')},
//                {600: t('Emergency (600)')}
//            ]
//        }).addEvent('change', function() {
//                this.loadLogRequestItems(1);
//            }.bind(this)).inject(dialog.getContentContainer());

        new Element('h2', {
            text: t('Logs for request #' + requestId.substr(0, 9))
        }).inject(dialog.getContentContainer());

        new Element('div', {
            text: t('All log entries except debug/info/notices.'),
            style: 'color: gray'
        }).inject(dialog.getContentContainer());

        this.logsTableContainer = new Element('div', {
            style: 'position: absolute; left: 0px; top: 90px; right: 0px; bottom: 31px; overflow: auto;'
        }).inject(dialog.getContentContainer());

        this.logsTable = new jarves.Table().inject(this.logsTableContainer);
        this.logsTable.setColumns([
            [_('Date'), 160],
            [_('Request'), 80],
            [_('Level'), 100],
            [_('Message')],
            [_('Actions'), 200]
        ]);

        document.id(this.logsTable).addClass('selectable');

        this.loadLogsItems(1);

        dialog.show();
    },

    clearLogs: function() {
        this.btnClearLogs.startTip(_('Clearing logs ...'));

        new Request.JSON({url: _pathAdmin + 'admin/system/tools/logs?_method=delete', noCache: 1, onComplete: function() {
            this.btnClearLogs.stopTip(_('Cleared'));
            this.loadLogRequestItems(1);
        }.bind(this)}).post();

    },

    renderLogRequestCtrls: function() {
        this.logsRequestCtrlPrevious.setStyle('opacity', 1);
        this.logsRequestCtrlNext.setStyle('opacity', 1);

        if (this.logRequestsCurrentPage == 1) {
            this.logsRequestCtrlPrevious.setStyle('opacity', 0.3);
        }

        if (this.logRequestsCurrentPage == this.logRequestsMaxPages) {
            this.logsRequestCtrlNext.setStyle('opacity', 0.3);
        }

        this.logsRequestCtrlText.set('text', this.logRequestsCurrentPage+'/'+this.logRequestsMaxPages);
    },

    reloadLogsItems: function(pAgain) {
        this.loadLogRequestItems(this.logsCurrentPage, pAgain);
    },

    reloadLogRequestItems: function(pAgain) {
        this.loadLogRequestItems(this.logRequestsCurrentPage, pAgain);
    },

    loadLogRequestItems: function(pPage, pAgain) {
        if (!pPage) {
            pPage = 1;
        }

        if (this.lastrq) {
            this.lastrq.cancel();
        }

        this.lastrq = new Request.JSON({url: _pathAdmin + 'admin/system/tools/requests', noCache: 1,
            onComplete: function(response) {

                var data = response.data;
                this.logRequestsCurrentPage = pPage;
                this.logRequestsMaxPages = data.maxPages;
                this.renderLogRequestCtrls();

                this.renderLogRequestItems(data.items);

                if (pAgain == true && this.liveLog.getValue()) {
                    this.lastLiveLogTimer = this.reloadLogRequestItems.delay(1000, this, true);
                }

            }.bind(this)}).get({page: pPage});
    },

    loadLogsItems: function(pPage) {
        if (!pPage) {
            pPage = 1;
        }

        if (this.lastrq) {
            this.lastrq.cancel();
        }

        this.lastrq = new Request.JSON({url: _pathAdmin + 'admin/system/tools/logs', noCache: 1,
            onComplete: function(response) {

                var data = response.data;
                this.logsCurrentPage = pPage;
//                this.logsMaxPages = data.maxPages;
                //this.renderLogCtrls();

                this.renderLogItems(data.items);

            }.bind(this)}).get({requestId: this.currentRequestId}); //, level: this.logsLevelSelect.getValue()});
    },

    openProfile: function(profileToken) {
        var url = 'app_dev.php/_profiler/'+profileToken+'';

        var dialog = new jarves.Dialog(this.win, {
            withButtons: true,
            absolute: true,
            minWidth: '90%',
            minHeight: '90%',
            applyButtonLabel: 'OK',
            cancelButton: false
        });

        var h2 = new Element('h2', {
            text: 'Profile for request #' + profileToken
        }).inject(dialog.getContentContainer());

        var container = new Element('div', {
            'class': 'jarves-Full',
            style: 'overflow: hidden; top: 60px;'
        }).inject(dialog.getContentContainer());

        var iframe = new Element('iframe', {
            frameborder: 0,
            style: 'height: 100%; width: 100%; border: 0',
            src: _path + url
        }).inject(container);

        dialog.show();
    },

    renderLogRequestItems: function(items) {

        this.logRequestsTable.empty();
        Object.each(items, function(item) {

            var row = [], a = '', profileStatus, debugCount, infoNotices, warnings, errors, criticals, alertEmergency, counts, path;

            //date
            //requestId
            //warning
            //error
            //critical
            //alert/emergency

            var micro = ((item.date + '').split('.')[1] || '0').substr(0, 3);
            row.push(new Element('span', {html: new Date(item.date * 1000).format('db') + '<span style="color: gray">.'+micro+'</span>'}));

            profileStatus = new Element('span', {
                'class': item.profileToken ? 'icon-checkmark-6' : 'icon-cancel-3',
                title: item.profileToken ? t('A complete profile report is available.') : t('Only important logs are available'),
                styles: {
                    color: item.profileToken ? 'green' : 'gray'
                }
            });

            row.push(profileStatus);

            a = new Element('a', {
                text: item.profileToken || item.id.substr(0, 10),
                title: item.profileToken || item.id,
                href: 'javascript: ;'
            }).addEvent('click', function() {
                    if (item.profileToken) {
                        this.openProfile(item.profileToken);
                    } else {
                        this.openLogs(item.id);
                    }
                }.bind(this));

            row.push(a);

            counts = item.counts ? JSON.decode(item.counts) : [];
            if (counts && Object.getLength(counts) > 0) {
                debugCount = counts[100] || 0;
                infoNotices = (counts[200] || 0) + '/' + (counts[250] || 0);

                warnings = counts[300] > 0 ? '<span style="color: orange">'+counts[300]+'</span>' : 0;
                errors = counts[400] > 0 ? '<span style="color: red">'+counts[400]+'</span>' : 0;
                criticals = counts[500] > 0 ? '<span style="color: red">'+counts[500]+'</span>' : 0;

                alertEmergency = '';
                if (counts[550] > 0) {
                    alertEmergency = '<span style="color: red">'+counts[550]+'</span>'
                } else {
                    alertEmergency = (counts[550] || 0);
                }
                if (counts[600] > 0) {
                    alertEmergency = '<span style="color: red">'+counts[600]+'</span>'
                } else {
                    alertEmergency = (counts[600] || 0);
                }
            } else {
                debugCount = 0;
                infoNotices = '0/0';
                warnings = 0;
                errors = 0;
                criticals = 0;
                alertEmergency = '0/0';
            }

            if (!item.path) {
                item.path = '';
            }

            path = new Element('span', {
                title: item.path,
                text: item.path.length > 27 ? item.path.substr(0, 27)+'...' : item.path
            });

            row.push(item.username);
            row.push(item.ip);
            row.push(path);
            row.push(new Element('span', {html: debugCount}));
            row.push(new Element('span', {html: infoNotices}));
            row.push(new Element('span', {html: warnings}));
            row.push(new Element('span', {html: errors}));
            row.push(new Element('span', {html: criticals}));
            row.push(new Element('span', {html: alertEmergency}));

            this.logRequestsTable.addRow(row);
        }.bind(this));
    },

    renderLogItems: function(items) {
        var level = {
            all: t('All'),
            100: t('Debug (100)'),
            200: t('Info (200)'),
            250: t('Notice (250)'),
            300: t('Warning (300)'),
            400: t('Error (400)'),
            500: t('Critical (500)'),
            550: t('Alert (550)'),
            600: t('Emergency (600)')
        };

        this.logsTable.empty();
        var lastRequestId;
        Object.each(items, function(item) {

            var row = [], a = '';

            var micro = ((item.date + '').split('.')[1] || '0').substr(0, 3);
            row.push(new Element('span', {html: new Date(item.date * 1000).format('db') + '<span style="color: gray">.'+micro+'</span>'}));

            if (item.requestId) {
                if (item.requestId != lastRequestId) {
                    a = new Element('a', {
                        text: item.requestId.substr(0, 10),
                        title: item.requestId,
                        href: 'javascript: ;'
                    }).addEvent('click', function() {
                            this.loadRequestDetails(item);
                        }.bind(this));
                    lastRequestId = item.requestId;
                } else {
                    a = new Element('div', {
                        text: '"',
                        styles: {
                            textAlign: 'center'
                        }
                    })
                }
            }
            row.push(a);
            row.push(level[item.level] || item.level);
            row.push(item.message);

            var action = new Element('div');
            new jarves.Button(t('Client')).inject(action);
            new jarves.Button(t('Stack trace')).inject(action);
            row.push(action);

            this.logsTable.addRow(row);
        }.bind(this));
    }/*,

     loadRequestDetails: function(item) {
     var dialog = new jarves.Dialog(null, {
     autoClose: true,
     withButtons: true,
     cancelButton: false,
     absolute: true,
     minWidth: '80%',
     minHeight: '80%',
     applyButtonLabel: t('OK')
     });

     this.lastrq = new Request.JSON({url: _pathAdmin + 'admin/system/tools/request', noCache: 1,
     onFailure: function() {
     dialog.getContentContainer().set('text', 'Failed');
     },
     onComplete: function(response) {
     if (!response.data) {
     dialog.getContentContainer().set('text', 'Deleted');
     } else {

     var fields = {
     '__tab1__': {
     label: 'General',
     type: 'tab',
     fullPage: true,
     children: {
     id: {
     label: 'ID',
     type: 'info'
     },
     time: {
     label: 'Time',
     type: 'info'
     },
     username: {
     label: 'Username',
     type: 'info'
     },
     ip: {
     label: 'IP',
     type: 'info'
     },
     orm: {
     label: 'ORM',
     type: 'info'
     },
     queryCount: {
     label: 'SQL Query count',
     type: 'info'
     }
     }
     },
     '__tab2__': {
     label: 'Exceptions',
     type: 'tab',
     children: {
     exceptions: {
     type: 'html',
     tableItem: false,
     noWrapper: true,
     height: '100%',
     options: {
     iframe: true
     }
     }
     }
     }
     };

     var request = response.data;
     var micro = ((request.date+'').split('.')[1] || '0').substr(0, 3);
     request.time = (new Date(request.date*1000)).format('db')+'.'+micro;

     var orm = request.orm ? JSON.decode(request.orm) : {};
     request.orm = "%s updates, %d deletes, %d adds.".sprintf(
     orm.updates || 0,
     orm.deleted || 0,
     orm.adds || 0
     );

     var queries = request.queries ? JSON.decode(request.queries) : [];
     request.queryCount = queries.length;

     var form = new jarves.FieldForm(dialog.getContentContainer(), fields, {
     allTableItems: true
     });

     form.setValue(request);

     }
     }.bind(this)}).get({request: item.requestId});

     dialog.show();
     }*/
});