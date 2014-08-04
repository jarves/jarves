var jarves_system_module_publish = new Class({

    initialize: function (pWin) {
        this.win = pWin;
        this.module = this.win.params.name;
        this.loader = new jarves.Loader().inject(this.win.content);
        this.loader.show();

        this.topGroup = this.win.addButtonGroup();
        if (jarves.settings.system.communityId > 0) {
            this.uploadBtn =
                this.topGroup.addButton(_('Upload this version'), _path + 'bundles/jarves/admin/images/icons/add.png',
                    this.add.bind(this));
        }
        this.createPkg = this.topGroup.addButton(_('Create package'), _path + 'bundles/jarves/admin/images/icons/compress.png',
            this.getPackage.bind(this));

        this.loadInfo();
        this.downloadUrl = new Element('div', {
            style: 'padding: 3px; color: gray;'
        }).inject(this.win.content);
    },

    loadInfo: function () {

        new Request.JSON({url: _pathAdmin +
            'admin/system/bundle/getPublishInfo', noCache: 1, onComplete: function (res) {
            this.loader.hide();
            this.info = res;
            this.renderInfo();
        }.bind(this)}).post({name: this.module});
    },

    getPackage: function () {
        if (this.loader) {
            this.loader.destroy();
        }

        this.loader = new jarves.Loader().inject(this.win.content);
        this.loader.show();

        new Request.JSON({url: _pathAdmin + 'admin/system/bundle/getPackage', noCache: 1, onComplete: function (res) {
            this.loader.hide();
            if (res) {
                this.downloadUrl.set('html',
                    '<a target="_blank" href="' + _path + res['file'] + '">' + res['file'] + '</a>');
            } else {
                this.win._alert(_('Unknown error'));
            }
        }.bind(this)}).post({name: this.module});
    },

    add: function () {
        this.win._confirm(_('Really upload this version ?'), function (pGo) {
            if (!pGo) {
                return;
            }
            this.askPw();
        }.bind(this));
    },

    askPw: function (p) {
        if (p) {
            p = p + '<br />';
        } else {
            p = "";
        }

        var _msg = _('Please enter your commit message. Leave blank to commit without a comment.');
        this.commitMessage = new Element('textarea', {
            text: _msg,
            style: 'width:220px; height: 120px; color: silver;'
        }).addEvent('focus',
            function () {
                if (this.value == _msg) {
                    this.value = '';
                    this.setStyle('color', '#444444');
                }
            }).addEvent('blur', function () {
                if (this.value == '') {
                    this.value = _msg;
                    this.setStyle('color', 'silver');
                }
            });

        var dialog = this.win._passwordPrompt(p +
            _('Please enter your password (%s)').replace('%s', jarves.settings.system.communityEmail), '',
            this.checkPw.bind(this));

        new Element('h3', {text: _('Publish to version %s').replace('%s', this.info.config.version)}).inject(dialog,
            'top');

        var title = new Element('div', {
            'class': 'jarves-jarves-Window-prompt-text',
            text: _('Commit message')
        }).inject(dialog.getElement('input'), 'after');

        this.commitMessage.inject(title, 'after');
        dialog.center();
    },

    checkPw: function (pPw) {
        if (!pPw) {
            return;
        }
        this.loader.show();
        new Request.JSON({url: _pathAdmin + 'admin/system/bundle/publish', noCache: 1, onComplete: function (res) {
            this.loader.hide();
            if (res == 0) {
                this.askPw(_('Access denied'));
            } else if (res && res['status'] == 'ok') {
                this.win._alert(_('Extension successfully published.'));
            } else {
                this.win._alert(_('Publish error.') + '<br />' + res['status']);
            }
        }.bind(this)}).post({pw: pPw, message: this.commitMessage.value, name: this.module});
    },

    _add: function (pGo) {
        this.win._alert('Done');
    },
    renderInfo: function () {
        var p = new Element('div').inject(this.win.content);

        if (this.info.serverVersion == this.info.config.version &&

            (this.module != 'admin' && this.module != 'users' && this.module != 'jarves')

            ) {
            this.uploadBtn.hide();
        }

        var table = new Element('table', {width: '100%'}).inject(p);
        var tbody = new Element('tbody', {'class': 'jarves-Table-body'}).inject(table);

        var tr = new Element('tr', {'class': 'two'}).inject(tbody);
        new Element('td', {text: 'Title (en)'}).inject(tr);
        new Element('td', {text: this.info.config.title.en}).inject(tr);

        var tr = new Element('tr', {'class': 'two'}).inject(tbody);
        new Element('td', {text: 'Extension'}).inject(tr);
        new Element('td', {text: this.module}).inject(tr);

        var tr = new Element('tr', {'class': 'one'}).inject(tbody);
        new Element('td', {text: 'Version'}).inject(tr);
        new Element('td', {text: this.info.config.version}).inject(tr);

        var tr = new Element('tr', {'class': 'two'}).inject(tbody);
        new Element('td', {text: 'Server version'}).inject(tr);
        new Element('td', {text: this.info.serverVersion}).inject(tr);

        new Element('div', {style: 'padding: 5px;', text: _('Files:')}).inject(p);

        var iter = function (pFiles, pTo) {
            myfiles = (typeOf(pFiles) == 'array') ? pFiles : $H(pFiles);
            myfiles.each(function (pitem, key) {
                if (typeOf(pitem) == 'array' || typeOf(pitem) == 'object') {
                    new Element('div', {
                        text: key
                    }).inject(pTo);
                    var to = new Element('div', {
                        style: 'padding-left: 20px;'
                    }).inject(pTo);
                    iter(pitem, to);
                } else {
                    var to = new Element('div', {
                        text: pitem
                    }).inject(pTo);
                }
            });
        }

        var files = new Element('div', {
            style: 'border: 1px solid silver;padding: 5px; color: #444; overflow: auto; position: absolute; left: 5px; right: 5px; bottom: 5px; top: 115px'
        }).inject(p);

        iter(this.info.files, files);
    }

})
