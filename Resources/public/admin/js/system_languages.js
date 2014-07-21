var jarves_system_languages = new Class({

    initialize: function (pWin) {
        this.win = pWin;
        this._createLayout();
    },

    _createLayout: function () {

        this.win.content.empty();

        this.info = new Element('div', {
            style: 'padding: 4px; font-weight: bold; color: gray; text-align: center;',
            html: _('The native language is english. Do not translate the english language, unless you want to adjust some phrases.')
        }).inject(this.win.content);

        this.main = new Element('div', {
            'class': 'jarves-system-languages-main'
        }).inject(this.win.content);

        var actionBar = new Element('div', {
            'class': 'jarves-ActionBar'
        }).inject(this.win.getTitleGroupContainer());

        this.languageSelect = new jarves.Select();
        this.languageSelect.addEvent('change', this.loadOverview.bind(this));
        this.languageSelect.inject(actionBar);

        Object.each(jarves.settings.langs, function (lang, id) {
            this.languageSelect.add(id, lang.langtitle + ' (' + lang.title + ', ' + id + ')');
        }.bind(this));

        this.languageSelect.setValue(window._session.lang || 'en');

        this.win.setLoading(true);

        this.loadOverview();

    },

    loadOverview: function () {
        this.main.empty();

        this.extensionsDivs = {};
        this.progressBars = {};
        this.translateBtn = {};

        Object.each(jarves.settings.configs, function (config, id) {
            var title = config.title;

            var div = new Element('div', {
                'class': 'jarves-system-cat'
            }).inject(this.main);

            new Element('div', {
                text: config['class'],
                style: 'font-weight: bold;'
            }).inject(div);

            this.extensionsDivs[config.name] = new Element('div', {
                style: 'height: 38px; position: relative;'
            }).inject(div);
            this.renderExtensionOverview(config.name);

        }.bind(this));

        this.win.setLoading(false);
    },

    renderExtensionOverview: function (pExtensionId) {
        var div = this.extensionsDivs[ pExtensionId ];
        div.empty();

        var table = new Element('table', {
            width: '100%'
        }).inject(div);
        var tr = new Element('tr').inject(table);

        var left = new Element('td').inject(tr);
        var right = new Element('td', {
            width: 100
        }).inject(tr);
        this.progressBars[pExtensionId] = new jarves.Progress(t('Extracting ...'), true);
        this.progressBars[pExtensionId].inject(left);

        this.translateBtn[pExtensionId] = new jarves.Button(t('Translate')).inject(right);
        this.translateBtn[pExtensionId].addEvent('click', function () {
            jarves.wm.open('jarvesbundle/system/languages/edit', {lang: this.languageSelect.getValue(), bundle: pExtensionId});
        }.bind(this));
        this.translateBtn[pExtensionId].deactivate();

        this.loadExtensionOverview(pExtensionId);

    },

    loadExtensionOverview: function (pExtensionId) {

        this.lastRequests = new Request.JSON({url: _pathAdmin + 'admin/system/bundle/editor/language/overview', noCache: 1,
            onComplete: function (pResponse) {

                if (!pResponse.data) {

                    this.progressBars[pExtensionId].setText(
                        'Error.'
                    );
                } else {
                    this.progressBars[pExtensionId].setUnlimited(false);
                    this.progressBars[pExtensionId].setValue((pResponse.data.countTranslated / pResponse.data.count) *
                        100);

                    this.progressBars[pExtensionId].setText(
                        _('%1 of %2 translated')
                            .replace('%1', pResponse.data.countTranslated)
                            .replace('%2', pResponse.data['count'])
                    );
                }

                this.translateBtn[pExtensionId].activate();
            }.bind(this)}).get({bundle: pExtensionId, lang: this.languageSelect.getValue()});

    }
});
