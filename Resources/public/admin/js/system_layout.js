var jarves_system_layout = new Class({

    initialize: function (pWin) {

        this.win = pWin;
        this._createLayout();

    },

    _createLayout: function () {

        this.win.content.set('text', 'Todo');
        return;

        this.topNavi = this.win.addSmallTabGroup();

        this.buttons = {};

        this.buttons['layouts'] = this.topNavi.addButton(_('Layouts'), this.changeType.bind(this, 'layouts'));
        this.buttons['contents'] = this.topNavi.addButton(_('Container'), this.changeType.bind(this, 'contents'));
        this.buttons['navigations'] =
            this.topNavi.addButton(_('Navigations'), this.changeType.bind(this, 'navigations'));

        this.addNavi = this.win.addButtonGroup();
        this.addNavi.addButton(_('Install a theme'), _path + 'bundles/jarves/admin/images/icons/package_add.png',
            this.installTheme.bind(this));
        this.addNavi.addButton(_('Develop a theme'), _path + 'bundles/jarves/admin/images/icons/layout_add.png',
            this.addTheme.bind(this));

        this.panes = {};
        Object.each(this.buttons, function (button, id) {
            this.panes[id] = new Element('div', {
                'class': 'jarves-layout-pane'
            }).inject(this.win.content);
        }.bind(this));

        /* page contents */
        this.page = new Element('div', {
            'class': 'jarves-layout-pane'
        }).inject(this.win.content);

        this.left = new Element('div', {
            'class': 'jarves-layout-left'
        }).inject(this.page);

        this.right = new Element('div', {
            style: 'position: absolute; right: 0px; left: 250px; top: 0px; bottom: 0px;'
        }).inject(this.page);

        /* page contents end */

        this.loader = new jarves.Loader().inject(this.win.content);

        this.changeType('layouts');

    },

    installTheme: function () {
        jarves.wm.open('jarvesbundle/system/module', {themes: 1});
    },

    addTheme: function () {
        this.win._prompt(_('Please enter the extension code for your theme extension: '), '', function (res) {
            if (!res) {
                return;
            }
            jarves.wm.open('jarvesbundle/system/module/add', {name: res});
        })
    },

    changeType: function (pType) {
        Object.each(this.buttons, function (button, id) {

            button.setPressed(false);
            this.panes[id].setStyle('display', 'none');

        }.bind(this));

        this.buttons[pType].setPressed(true);
        this.panes[pType].setStyle('display', 'block');

        this.right.empty();

        this.load(pType);
        return;
        switch (pType) {
            case 'layouts':
                this.loadLayouts();
                break;
            case 'contents':
                this.loadContents();
                break;
            case 'navigations':
                this.loadNavigations();
                break;
        }
    },

    loadFile: function (pFile) {
        var file = pFile;
        this.right.empty();
        if (file == '') {
            return;
        }
        var loader = new jarves.Loader().inject(this.right);
        loader.show();

        this._layoutFiles.each(function (item) {
            item.set('class', '');
        });
        this._layoutFiles.get(pFile).set('class', 'active');

        new Request.JSON({url: _path + 'admin/system/layout/loadFile', noCache: 1, onComplete: function (res) {
            loader.hide();
            loader.hide();
            this._renderFile(res);
        }.bind(this)}).post({file: file});
    },

    _renderFile: function (pFile) {
        this.loadedFile = pFile;

        var p = new Element('div', {
            style: 'position: absolute; left: 0px; top: 0px; bottom: 30px; right: 0px;'
        }).inject(this.right);

        this.cssPage = new Element('div', {
            style: 'position: absolute; left: 0px; top: 63px; height: 50px; right: 11px; overflow: auto;'
        }).inject(p);

        this.cssPageOl = new Element('ol', {style: 'margin: 0px;'}).inject(this.cssPage);

        var infos = new Element('div', {
            style: 'position: absolute; left: 0px; top: 0px; height: 55px; right: 0px; padding: 10px; padding-bottom: 0px;'
        }).inject(p);

        new jarves.Field({
            label: _('File'), small: true, value: pFile.path, disabled: true
        }).inject(infos);

        new jarves.Field({
            label: _('Title'), small: true, value: pFile.title, disabled: true
        }).inject(infos);

        var bottom = new Element('div', {
            'class': 'jarves-system-layout-codemirror',
            style: 'position: absolute; top: 120px; left: 6px; right: 14px; bottom: 11px; padding: 0px;'
        }).inject(p);
        this.fileContainer = bottom;

        this.editor = CodeMirror(bottom, {
            value: pFile.content,
            onChange: this.extractCssFiles.bind(this),
            lineNumbers: true,
            mode: "htmlmixed"
        });

        bottomBar = new Element('div', {
            'class': 'jarves-windowEdit-actions',
            style: 'bottom: 0px; background-color: none; border: 0px;'
        }).inject(this.right);

        this.saveBtn = new jarves.Button(_('Save'));
        this.saveBtn.addEvent('click', this.save.bind(this)).inject(bottomBar)
        this.extractCssFiles();
    },

    extractCssFiles: function () {
        this.cssPageOl.empty();
        /*//var regex = /\{addCss\s+file='?(.*)'?\s*\}/gi;
         //var regex = /(addCss\s+file='[\w|\/]*)/gi;
         //var regex = /(addCss file='[\w|\/|\.]*)/gi;
         //var regex = /(\w*\.css)/i;
         //var regex = /(class=".*")/gi;
         var regex = /\{addCss\s+file=["|']?[^\}"']*["|']\}/gi;
         var sub = this.textarea.value.replace('','');
         var sub = '{addCss file="th_blueSkybasecss"}{addCss file="th_blueSky/two_columns.css"}';
         */

        var value = (this.editor) ? this.editor.getValue() : this.fileContainer.get('text');

        var matches = value.match(/\{addCss\s+file=["|']?[^\}"']*["|']\}/gi);
        /*logger("test");
         var matches = regex.exec(sub);
         logger(matches);
         logger("test");*/
        if (matches) {
            matches.each(function (match) {
                var path = match.match(/file=["|']([^"']*)["|']/)[1];
                if (!path || path == '') {
                    return;
                }
                var li = new Element('li', {
                    text: path
                }).inject(this.cssPageOl);
                new Element('span', {
                    html: _('[edit]'),
                    style: 'cursor: pointer;'
                }).addEvent('click',
                    function () {
                        jarves.wm.open('jarvesbundle/files/edit', {file: {path: '/' + path}});
                    }).inject(li);
            }.bind(this));
        }
    },

    save: function () {
        this.saveBtn.startTip(_('Save ...'));
        var req = {};
        req.content = this.editor.getCode();
        req.file = this.loadedFile.path;

        new Request.JSON({url: _path + 'admin/system/layout/save', noCache: 1, onComplete: function (res) {
            this.saveBtn.stopTip(_('Saved'));
        }.bind(this)}).post(req);
    },

    toSelect: function (pRes) {
        this.files = pRes;
        this.left.empty();

        this._layoutFiles = new Hash({});
        Object.each(pRes, function (theme, themeTitle) {

            new Element('a', {
                html: _(themeTitle),
                style: 'font-weight: bold;'
            }).inject(this.left);

            var div = new Element('div', {
                'class': 'jarves-layout-theme-items'
            }).inject(this.left);

            Object.each(theme, function (layoutFile, layoutTitle) {
                this._layoutFiles.include(layoutFile, new Element('a', {
                    html: _(layoutTitle)
                }).addEvent('click', this.loadFile.bind(this, layoutFile)).inject(div));
            }.bind(this));

        }.bind(this));
    },

    load: function (pType) {
        this.loader.show();
        new Request.JSON({url: _path + 'admin/system/layout/load', noCache: 1, onComplete: function (res) {
            this.toSelect(res);
            this.loader.hide();
        }.bind(this)}).get({type: pType });
    },

    loadLayouts: function () {
        this.loader.show();
        new Request.JSON({url: _path + 'admin/system/layout/loadLayouts', noCache: 1, onComplete: function (res) {
            this.toSelect(res);
            this.loader.hide();
        }.bind(this)}).get();
    }
});
