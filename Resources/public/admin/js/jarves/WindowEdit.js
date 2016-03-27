jarves.WindowEdit = new Class({
    Implements: [Events, Options],
    Binds: ['showVersions'],

    inline: false,

    options: {
        saveLabel: '',
        renderLanguageSelector: true,
        entryPoint: null
    },

    fieldToTabOIndex: {}, //index fieldkey to main-tabid
    winParams: {}, //copy of pWin.params in constructor

    ready: false,

    initialize: function(win, container, options) {
        this.win = win;
        this.setOptions(options);

        this.winParams = Object.clone(this.win.getParameter());

        if (!this.windowAdd && !this.getPrimaryKey()) {
            this.win.alert('No item given. A edit object window can not be called directly.', function() {
                this.win.close();
            }.bind(this));
            return;
        }

        if (!container) {
            this.container = this.win.content;
            this.container.setStyle('overflow', 'visible');
        } else {
            this.inline = true;
            this.container = container;
        }

        this.container.empty();

        this.bCheckClose = this.checkClose.bind(this);
        this.bCheckTabFieldWidth = this.checkTabFieldWidth.bind(this);

        this.win.addEvent('close', this.bCheckClose);
        this.win.addEvent('resize', this.bCheckTabFieldWidth);

        if (this.getEntryPoint()) {
            this.load();
        }
    },

    /**
     * @return {Object}
     */
    getPrimaryKey: function() {
        return this.options.primaryKey || this.winParams.item;
    },

    getObjectKey: function() {
        return this.classProperties['object'];
    },

    getContentContainer: function() {
        return this.container;
    },

    destroy: function() {
        this.win.removeEvent('close', this.bCheckClose);
        this.win.removeEvent('resize', this.bCheckTabFieldWidth);

        if (this.languageTip) {
            this.languageTip.stop();
            delete this.languageTip;
        }

        delete this.tabPane;

        Object.each(this._buttons, function(button, id) {
            button.stopTip();
        });

        if (this.topTabGroup) {
            this.topTabGroup.destroy();
        }

        if (this.actionGroup) {
            this.actionGroup.destroy();
            delete this.actionGroup;
        }

        if (this.actionBar) {
            this.actionBar.destroy();
            delete this.actionBar;
        }

        if (this.versioningSelect) {
            this.versioningSelect.destroy();
        }

        if (this.languageSelect) {
            this.languageSelect.destroy();
        }

        delete this.versioningSelect;
        delete this.languageSelect;

        this.container.empty();

        this.fireEvent('destroy');
    },

    getModule: function() {
        if (!this.module) {
            if (this.getEntryPoint().indexOf('/') > 0) {
                this.module = this.getEntryPoint().substr(0, this.getEntryPoint().indexOf('/'));
            } else {
                this.module = this.getEntryPoint();
            }
        }
        return this.module;
    },

    getEntryPoint: function() {
        var entryPointDefinition = jarves.entrypoint.get(this.options.entryPoint);
        if (entryPointDefinition.object) {
            return 'object/' + entryPointDefinition.object;
        }

        return this.options.entryPoint;
    },

    load: function() {

        this.container.set('html', '<div style="text-align: center; padding: 50px; color: silver">' + t('Loading definition ...') + '</div>');

        new Request.JSON({url: _pathAdmin + this.getEntryPoint() + '/', noCache: true, onComplete: function(pResponse) {

            if (!pResponse.error && pResponse.data && pResponse.data._isClassDefinition) {
                this.render(pResponse.data);
            } else {
                this.container.set('html', '<div style="text-align: center; padding: 50px; color: red">' + t('Failed. No correct class definition returned. %s').replace('%s', 'admin/' + this.getEntryPoint() + '?_method=options') + '</div>');
            }

        }.bind(this)}).post({_method: 'options'});
    },

    generateItemParams: function(version) {
        var req = {};

        if (version) {
            req.version = version;
        }

        if (this.winParams && this.getPrimaryKey()) {
            this.classProperties.primary.each(function(prim) {
                req[ prim ] = this.getPrimaryKey()[prim];
            }.bind(this));
        }

        return req;
    },

    loadItem: function() {
        if (!this.classProperties) {
            this.selectItem = true;
            return;
        }

        var id = jarves.getObjectUrlId(this.classProperties['object'], this.getPrimaryKey());

        if (this.lastRq) {
            this.lastRq.cancel();
        }

        this.win.setLoading(true, null, this.container.getCoordinates(this.win));

        this.lastRq = new Request.JSON({url: _pathAdmin + this.getEntryPoint() + '/' + id,
            noCache: true, onComplete: function(res) {
                this._loadItem(res.data);
            }.bind(this)}).get({withAcl: true});
    },

    _loadItem: function(pItem) {
        this.item = pItem;

        this.setValue(pItem, true);
        this.saveBtn.setEnabled(pItem._editable);
        this.hideNotEditableFields(pItem._notEditable);

        this.renderVersionItems();

        this.win.setLoading(false);
        this.fireEvent('load', pItem);

        var first = this.fieldForm.getFirstField();
        if (first && !jarves.isMobile()) {
            first.focus();
        }

//        this.ritem = this.retrieveData(true);
    },

    hideNotEditableFields: function(fields) {
        this.fieldForm.showAll();

        if (fields && 'array' === typeOf(fields)) {
            Array.each(fields, function(field) {
                this.fieldForm.hideField(field);
            }.bind(this));
        }
    },

    setValue: function(value, internal) {

        value = value || {};

        this.fieldForm.setValue(value, internal);

        if (this.getTitleValue()) {
//            this.win.setTitle(this.getTitleValue());
        }

        if (this.languageSelect && this.languageSelect.getValue() != value.lang) {
            this.languageSelect.setValue(value.lang);
            this.changeLanguage();
            this.itemLanguage = value.lang;
        }
    },

    /**
     * Returns the vlaue of the field for the window title.
     * @return {String}
     */
    getTitleValue: function() {

        var value = this.fieldForm.getValue();

        var titleField = this.classProperties.titleField;
        if (!this.classProperties.titleField) {
            Object.each(this.fieldForm.getFieldDefinitions(), function(field, fieldId) {
                if (field.type != 'tab' && field.type != 'childrenSwitcher') {
                    if (!titleField) {
                        titleField = fieldId;
                    }
                }
            });
        }

        if (!this.fieldForm.getFieldDefinition(titleField)) {
            logger(tf('Field %s ($titleField) for the window title does not exists in the $fields variable', titleField));
        }

        if (titleField && this.fields[titleField]) {
            value = jarves.getObjectFieldLabel(value, this.fieldForm.getFieldDefinition(titleField), titleField, this.classProperties['object']);
            return value;
        }
        return '';
    },

    renderPreviews: function() {

        if (!this.classProperties.previewPlugins) {
            return;
        }

        //this.previewBtn;

        this.previewBox = new Element('div', {
            'class': 'jarves-Select-chooser'
        });

        this.previewBox.addEvent('click', function(e) {
            e.stop();
        });

        this.previewBox.inject(this.win.getTitleGroupContainer());

        this.previewBox.setStyle('display', 'none');

        //this.classProperties.previewPlugins

        document.body.addEvent('click', this.closePreviewBox.bind(this));

        if (!this.classProperties.previewPluginPages) {
            return;
        }

        Object.each(this.classProperties.previewPlugins, function(item, pluginId) {

            var title = jarves.getConfig(this.getModule()).plugins[pluginId][0];

            new Element('div', {
                html: title,
                href: 'javascript:;',
                style: 'font-weight:bold; padding: 3px; padding-left: 15px;'
            }).inject(this.previewBox);

            var index = pluginId;
            if (pluginId.indexOf('/') === -1) {
                index = this.getModule() + '/' + pluginId;
            }

            Object.each(this.classProperties.previewPluginPages[index], function(pages, domain_id) {

                Object.each(pages, function(page, page_id) {

                    var domain = jarves.getDomain(domain_id);
                    if (domain) {
                        new Element('a', {
                            html: '<span style="color: gray">[' + domain.lang + ']</span> ' + page.path,
                            style: 'padding-left: 21px',
                            href: 'javascript:;'
                        }).addEvent('click', this.doPreview.bind(this, page_id, index)).inject(this.previewBox);
                    }

                }.bind(this));

            }.bind(this));

        }.bind(this));

    },

    preview: function(e) {
        this.togglePreviewBox(e);
    },

    doPreview: function(pPageRsn, pPluginId) {
        this.closePreviewBox();

        if (this.lastPreviewWin) {
            this.lastPreviewWin.close();
        }

        var url = this.previewUrls[pPluginId][pPageRsn];

        if (this.versioningSelect.getValue() != '-') {
            url += '?jarves_framework_version_id=' + this.versioningSelect.getValue() + '&jarves_framework_code=' + pPluginId;
        }

        this.lastPreviewWin = window.open(url, '_blank');

    },

    setPreviewValue: function() {
        this.closePreviewBox();
    },

    closePreviewBox: function() {
        this.previewBoxOpened = false;
        this.previewBox.setStyle('display', 'none');
    },

    togglePreviewBox: function(e) {

        if (this.previewBoxOpened == true) {
            this.closePreviewBox();
        } else {
            if (e && e.stop) {
                document.body.fireEvent('click');
                e.stop();
            }
            this.openPreviewBox();
        }
    },

    openPreviewBox: function() {

        this.previewBox.setStyle('display', 'block');

        this.previewBox.position({
            relativeTo: this.previewBtn,
            position: 'bottomRight',
            edge: 'upperRight'
        });

        var pos = this.previewBox.getPosition();
        var size = this.previewBox.getSize();

        var bsize = window.getSize($('desktop'));

        if (size.y + pos.y > bsize.y) {
            this.previewBox.setStyle('height', bsize.y - pos.y - 10);
        }

        this.previewBoxOpened = true;
    },

    loadVersions: function() {

        var req = this.generateItemParams();
        new Request.JSON({url: _pathAdmin + this.getEntryPoint() + '/', noCache: true, onComplete: function(res) {

            if (res && res.data.versions) {
                this.item.versions = res.data.versions;
                this.renderVersionItems();
            }

        }.bind(this)}).get(req);

    },

    renderVersionItems: function() {
        if (this.classProperties.versioning != true) {
            return;
        }

        this.versioningSelect.empty();
        this.versioningSelect.chooser.setStyle('width', 210);
        this.versioningSelect.add('-', _('-- LIVE --'));

        /*new Element('option', {
         text: _('-- LIVE --'),
         value: ''
         }).inject( this.versioningSelect );*/

        if (typeOf(this.item.versions) == 'array') {
            this.item.versions.each(function(version, id) {
                this.versioningSelect.add(version.version, version.title);
            }.bind(this));
        }

        if (this.item.version) {
            this.versioningSelect.setValue(this.item.version);
        }

    },

    render: function(pValues) {
        this.classProperties = pValues;

        this.container.empty();

        this.win.setLoading(true, null, {left: 265});

        this.fields = {};

        this.renderVersions();

        this.renderPreviews();

        this.renderActionBar();

        this.renderMultilanguage();

        this.renderFields();

        this.fireEvent('render');

        if (this.winParams) {
            this.loadItem();
        }

        this.ready = true;
    },

    isReady: function() {
        return this.ready;
    },

    renderFields: function() {

        if (this.classProperties.fields && typeOf(this.classProperties.fields) != 'array') {

            this.form = new Element('div', {
                'class': 'jarves-windowEdit-form'
            }).inject(this.getContentContainer(), 'top');

            if (this.classProperties.layout) {
                this.form.set('html', this.classProperties.layout);
            }

            this.tabPane = new jarves.TabPane(this.form, true);

            this.fieldForm = new jarves.FieldForm(this.form, this.classProperties.fields, {
                firstLevelTabPane: this.tabPane,
//                allTableItems: true,
                tableItemLabelWidth: '35%'
            }, {win: this.win});

            this.fields = this.fieldForm.getFields();

            this._buttons = this.fieldForm.getTabButtons();

            if (this.fieldForm.firstLevelTabBar) {
                this.topTabGroup = this.fieldForm.firstLevelTabBar.buttonGroup;
            }
        }

        //generate index, fieldkey => main-tabid
        Object.each(this.classProperties.fields, function(item, key) {
            if (item.type == 'tab') {
                this.setFieldToTabIdIndex(item.children, key);
            }
        }.bind(this));

        //generate index, fieldkey => main-tabid
        //@obsolete
        Object.each(this.classProperties.tabFields, function(items, key) {
            this.setFieldToTabIdIndex(items, key);
        }.bind(this));

    },

    setFieldToTabIdIndex: function(childs, tabId) {
        Object.each(childs, function(item, key) {
            this.fieldToTabOIndex[key] = tabId;
            if (item.children) {
                this.setFieldToTabIdIndex(item.children, tabId);
            }
        }.bind(this));
    },

    renderVersions: function() {
        if (this.classProperties.versioning == true) {
            var versioningSelectRight = 5;
            if (this.languageSelect) {
                versioningSelectRight = 150;
            }

            this.versioningSelect = new jarves.Select(this.win.getTitleGroupContainer());
            this.versioningSelect.setStyle('width', 120);

            this.versioningSelect.addEvent('change', this.changeVersion.bind(this));
        }
    },

    setLanguage: function(lang) {
        this.language = lang;
        if (this.languageSelect) {
            this.languageSelect.setValue(lang);
        }
    },

    getLanguage: function() {
        return this.language;
    },

    renderMultilanguage: function () {
        if (this.options.renderLanguageSelector && this.classProperties.multiLanguage) {

            if (this.classProperties.asNested) {
                return false;
            }

            this.win.extendHead();

            this.languageSelect = new jarves.Select();
            this.languageSelect.inject(this.saveBtn, 'before');
            this.languageSelect.setStyle('width', 120);

            this.languageSelect.addEvent('change', this.changeLanguage.bind(this));

            this.languageSelect.add('', t('-- Select Language --'));

            Object.each(jarves.settings.langs, function (lang, id) {
                this.languageSelect.add(id, lang.langtitle + ' (' + lang.title + ', ' + id + ')');
            }.bind(this));

            if (this.winParams && this.getPrimaryKey()) {
                this.languageSelect.setValue(this.getPrimaryKey().lang);
            } else if (this.language) {
                this.languageSelect.setValue(this.language);
            }

        }
     },

    changeVersion: function() {
        var value = this.versioningSelect.getValue();
        if (value == '-') {
            value = null;
        }

        this.loadItem(value);
    },

    changeLanguage: function() {
        Object.each(this.fields, function(item, fieldId) {

            if (item.field.type == 'select' && item.field.multiLanguage) {
                item.field.lang = this.languageSelect.getValue();
                item.renderItems();
            }
        }.bind(this));

        if (this.languageTip && this.languageSelect.getValue() != '') {
            this.languageTip.stop();
            delete this.languageTip;
        }
    },

    changeTab: function(pTab) {
        this.currentTab = pTab;
        Object.each(this._buttons, function(button, id) {
            button.setPressed(false);
            this._panes[ id ].setStyle('display', 'none');
        }.bind(this));
        this._panes[ pTab ].setStyle('display', 'block');
        this._buttons[ pTab ].setPressed(true);

        this._buttons[ pTab ].stopTip();
    },

    reset: function() {
        this.setValue(this.item, true);
    },

    remove: function() {
        this.win.confirm(tf('Really delete %s?', this.getTitleValue()), function(answer) {

            this.win.setLoading(true, null, this.container.getCoordinates(this.win));
            var itemPk = jarves.getObjectUrlId(this.classProperties['object'], this.getPrimaryKey());

            this.lastDeleteRq = new Request.JSON({url: _pathAdmin + this.getEntryPoint() + '/' + itemPk,
                onComplete: function(pResponse) {
                    this.win.setLoading(false);
                    this.fireEvent('remove', this.getPrimaryKey());
                    jarves.getAdminInterface().objectChanged(this.classProperties['object']);
                    this.destroy();
                }.bind(this)}).post({_method: 'delete'});

        }.bind(this));
    },

    getSidebar: function() {
        return this.options.sidebar || this.win.getSidebar();
    },

    renderActionBar: function(container) {
        container = this.getSidebar();

        this.actionGroup = new jarves.ButtonGroup(container);
        this.saveBtn = this.actionGroup.addButton(t('Save'), '#icon-checkmark-6', function() {
            this.save();
        }.bind(this));

//        if (this.win.isInline()) {
//            this.closeBtn = this.actionGroup.addButton(t('Close'), '#icon-cancel', function() {
//                this.checkClose();
//            }.bind(this));
//        }

        this.saveBtn.setButtonStyle('blue')

        this.removeBtn = this.actionGroup.addButton(t('Remove'), jarves.mediaPath(this.classProperties.removeIcon), this.remove.bind(this));
        this.removeBtn.setButtonStyle('red');

        this.resetBtn = this.actionGroup.addButton(t('Reset'), '#icon-escape', this.reset.bind(this));

        //        if (this.classProperties.workspace) {
        //            this.showVersionsBtn = this.actionBarGroup1.addButton(t('Versions'), '#icon-history', this.showVersions);
        //        }

        if (true) {
            this.previewBtn = this.actionGroup.addButton(t('Preview'), '#icon-eye');
        }

        this.checkTabFieldWidth();
    },

    showVersions: function() {

        //for now, we use a dialog

        var dialog = this.win.newDialog();

        new jarves.ObjectVersionGraph(dialog.content, {
            object: jarves.getObjectUrlId(this.classProperties['object'], this.getPrimaryKey())
        });

    },

    checkTabFieldWidth: function() {

        if (!this.topTabGroup) {
            return;
        }

        if (!this.cachedTabItems) {
            this.cachedTabItems = document.id(this.topTabGroup).getElements('a');
        }

        var actionsMaxLeftPos = 5;
        if (this.versioningSelect) {
            actionsMaxLeftPos += document.id(this.versioningSelect).getSize().x + 10
        }

        if (this.languageSelect) {
            actionsMaxLeftPos += document.id(this.languageSelect).getSize().x + 10
        }

        var actionNaviWidth = this.actionsNavi ? document.id(this.actionsNavi).getSize().x : 0;

        var fieldsMaxWidth = this.win.titleGroups.getSize().x - actionNaviWidth - 17 - 20 - (actionsMaxLeftPos + document.id(this.topTabGroup).getPosition(this.win.titleGroups).x);

        if (this.tooMuchTabFieldsButton) {
            this.tooMuchTabFieldsButton.destroy();
        }

        this.cachedTabItems.removeClass('jarves-tabGroup-item-last');
        this.cachedTabItems.inject(document.hiddenElement);
        this.cachedTabItems[0].inject(document.id(this.topTabGroup));
        var curWidth = this.cachedTabItems[0].getSize().x;

        var itemCount = this.cachedTabItems.length - 1;

        if (!this.overhangingItemsContainer) {
            this.overhangingItemsContainer = new Element('div', {'class': 'jarves-windowEdit-overhangingItemsContainer'});
        }

        var removeTooMuchTabFieldsButton = false, atLeastOneItemMoved = false;

        this.cachedTabItems.each(function(button, id) {
            if (id == 0) {
                return;
            }

            curWidth += button.getSize().x;
            if ((curWidth < fieldsMaxWidth && id < itemCount) || (id == itemCount && curWidth < fieldsMaxWidth + 20)) {
                button.inject(document.id(this.topTabGroup));
            } else {
                atLeastOneItemMoved = true;
                button.inject(this.overhangingItemsContainer);
            }

        }.bind(this));

        this.cachedTabItems.getLast().addClass('jarves-tabGroup-item-last');

        if (atLeastOneItemMoved) {

            this.tooMuchTabFieldsButton = new Element('a', {
                'class': 'jarves-tabGroup-item jarves-tabGroup-item-last'
            }).inject(document.id(this.topTabGroup));

            new Element('img', {
                src: _path + 'bundles/jarves/admin/images/jarves.mainmenu-additional.png',
                style: 'left: 1px; top: 6px;'
            }).inject(this.tooMuchTabFieldsButton);

            this.tooMuchTabFieldsButton.addEvent('click', function() {
                if (!this.overhangingItemsContainer.getParent()) {
                    this.overhangingItemsContainer.inject(this.win.border);
                    jarves.openDialog({
                        element: this.overhangingItemsContainer,
                        target: this.tooMuchTabFieldsButton,
                        offset: {y: 0, x: 1}
                    });

                    /*jarves.openDialog({
                     element: this.chooser,
                     target: this.box,
                     onClose: this.close.bind(this)
                     });*/
                }
            }.bind(this));

        } else {

            this.cachedTabItems.getLast().addClass('jarves-tabGroup-item-last');
        }

    },

    removeTooltip: function() {
        this.stopTip();
        this.removeEvent('click', this.removeTooltip);
    },

    /**
     *
     * @param [withoutEmptyCheck]
     * @param [patch]
     * @returns {*}
     */
    retrieveData: function(withoutEmptyCheck, patch) {
        if (!withoutEmptyCheck && !this.fieldForm.checkValid()) {
            var invalidFields = this.fieldForm.getInvalidFields();

            Object.each(invalidFields, function(item, fieldId) {

                var properTabKey = this.fieldToTabOIndex[fieldId];
                if (!properTabKey) {
                    return;
                }
                var tabButton = this.fields[properTabKey];

                if (tabButton && !tabButton.isPressed()) {

                    tabButton.startTip(t('Invalid input!'));
                    tabButton.toolTip.loader.set('src', _path + 'bundles/jarves/admin/images/icons/error.png');
                    tabButton.toolTip.loader.setStyle('position', 'relative');
                    tabButton.toolTip.loader.setStyle('top', '-2px');
                    document.id(tabButton.toolTip).setStyle('top', document.id(tabButton.toolTip).getStyle('top').toInt() + 2);

                    tabButton.addEvent('click', this.removeTooltip);
                } else {
                    tabButton.stopTip();
                }

                item.highlight();
            }.bind(this));

            return false;
        }

        var req = this.fieldForm.getValue(null, patch);

        if (this.languageSelect) {
            if (!withoutEmptyCheck && this.languageSelect.getValue() == '') {

                if (!this.languageTip) {
                    this.languageTip = new jarves.Tooltip(this.languageSelect, _('Please fill!'), null, null, _path + 'bundles/jarves/admin/images/icons/error.png');
                }
                this.languageTip.show();

                return false;
            } else if (!withoutEmptyCheck && this.languageTip) {
                this.languageTip.stop();
            }
            req['lang'] = this.languageSelect.getValue();
        } else if (this.classProperties.multiLanguage) {
            req['lang'] = this.getLanguage();
        }

        if (this.itemLanguage == req.lang) {
            delete req.lang;
        }

        return req;
    },

    hasUnsavedChanges: function() {
        var currentData = this.retrieveData(true, true);

        return currentData && 0 !== Object.getLength(currentData);
    },

    checkClose: function() {
        var hasUnsaved = this.hasUnsavedChanges();

        if (hasUnsaved) {
            this.win.interruptClose = true;
            this.win._confirm(t('There are unsaved data. Want to continue?'), function(pAccepted) {
                if (pAccepted) {
                    this.win.close();
                }
            }.bind(this));
        } else {
            this.win.close();
        }
    },

    /**
     *
     * @param [patch] Default is false|null
     * @returns {{}}
     */
    buildRequest: function(patch) {
        var req = {};

        var data = this.retrieveData(null, patch);

        if (!data) {
            return;
        }

//        this.ritem = data;

        if (this.getPrimaryKey()) {
            req = Object.merge(this.getPrimaryKey(), data);
        } else {
            req = data;
        }

        return data;
    },

    handleFailure: function(xhr, response) {

        if (response && response.error == 'RouteNotFoundException') {
            this.saveBtn.failedLoading();
            return this.win.alert(t('RouteNotFoundException. You setup probably the wrong `editEntrypoint`'));
        }

        if (response && response.error == 'Jarves\\Exceptions\\Rest\\ValidationFailedException') {
            this.saveBtn.failedLoading(t('Validation failed'));

            Object.each(response.data.fields, function(errors, field) {
                if (this.fields[field]) {
                    this.fields[field].showInvalid(errors.join("\n"));
                } else {
                    this.win.alert(tf("Field `%s` has validation failures and can not be found.\n\nErrors: \n%s", field, errors.join("\n")));
                }
            }.bind(this));
            return;
        }

        if (response && response.error == 'DuplicateKeysException') {
            this.win.alert(t('Duplicate keys. Please change the values of marked fields.'));

            Array.each(response.data.fields, function(field) {
                if (this.fields[field]) {
                    this.fields[field].showInvalid();
                }
            }.bind(this));

            this.saveBtn.failedLoading(t('Duplicate keys'));
            return;
        }

        this.saveBtn.failedLoading();
    },

    save: function(andClose) {

        if (this.lastSaveRq) {
            this.lastSaveRq.cancel();
        }

        var request = this.buildRequest(this.classProperties.usePatch);

        if (typeOf(request) != 'null') {

            // data seems valid, now trigger the save() method at all fields, to make sure next getValue()
            // returns values we want to save

            this.saveBtn.startLoading(t('Saving ...'));
            var progressWatchManager = new jarves.ProgressWatchManager({
                onAllSuccess: function() {
                    this.doSave(andClose);
                }.bind(this),
                onError: function(progressWatch) {
                    //progressWatch.getContext() let the field appear
                    this.saveBtn.failedLoading(t('Failed'));
                }.bind(this),
                onAllProgress: function(progress) {
                    this.saveBtn.setProgress(progress);
                }.bind(this)
            });
            this.fieldForm.save(progressWatchManager);
        }
    },

    doSave: function(andClose) {
        var objectId = jarves.getObjectUrlId(this.classProperties['object'], this.getPrimaryKey());
        var request = this.buildRequest(this.classProperties.usePatch);
        var method = this.classProperties.usePatch ? 'patch' : 'put';

        this.lastSaveRq = new Request.JSON({url: _pathAdmin + this.getEntryPoint() + '/' + objectId + '?_method=' + method,
            noErrorReporting: [
                'Jarves\\Exceptions\\Rest\\ValidationFailedException',
                'DuplicateKeysException',
                'ObjectItemNotModified'
            ],
            noCache: true,
            progressButton: this.saveBtn,
            onFailure: this.handleFailure.bind(this),
            onSuccess: function(response) {

                if (false === response.data) {
                    this.saveBtn.doneLoading(t('No changes'));
                } else {
                    this.saveBtn.doneLoading(t('Saved'));
                }
                this.saveBtn.setProgress(false);

                if (typeOf(response.data) == 'object') {
                    this.options.primaryKey = response.data; //our new primary keys
                }

                if (this.classProperties.loadSettingsAfterSave == true) {
                    jarves.loadSettings();
                }

                this.fieldForm.resetPatch();

                this.fireEvent('save', [request, response]);
                jarves.getAdminInterface().objectChanged(this.classProperties['object']);

                if ((!andClose || this.inline ) && this.classProperties.versioning == true) {
                    this.loadVersions();
                }

                if (this.classProperties.multiLanguage) {
                    this.itemLanguage = request.lang;
                }
            }.bind(this)}
        ).post(request);
    }
});