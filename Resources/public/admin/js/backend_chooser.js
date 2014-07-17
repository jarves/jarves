var jarves_backend_chooser = new Class({

    Implements: [Events, Options],

    options: {
        cookie: 'kaFieldChooser',
        value: false,

        objects: [], //
        objectOptions: {}

        /*
         <objectId>: {
         <objectbrowserOptions>
         }
         files:

         */
    },

    objectChooserInstance: {},
    pane2ObjectId: [],

    initialize: function (pWin) {
        this.win = pWin;

        this.setOptions(this.win.params);

        this.value = this.win.params.value;

        this.options.multi = (this.options.multi) ? true : false;

        this.cookie = (this.win.params.cookie) ? this.win.params.cookie : '';
        this.cookie = 'kFieldChooser_' + this.cookie + '_';

        if (!this.options.browserOptions) {
            this.options.browserOptions = {};
        }

        this.bottomBar = this.win.addBottomBar();
        this.bottomBar.addButton(t('Close'), this.win.close.bind(this.win));
        this.bottomBar.addButton(t('Choose'), function () {
            this.choose();
        }.bind(this)).setButtonStyle('blue');

        this._createLayout();
    },

    saveCookie: function () {

        Cookie.write(this.cookie + 'lastTab', this.currentPane);
    },

    _createLayout: function () {

        this.tapPane = new jarves.TabPane(this.win.content, true);

        this.tapPane.addEvent('change', this.changeTab.bind(this));

        /*
         if (this.options.pages) {
         this.createPages();
         if (this.win.params.domain) {
         this.renderDomain(this.win.params.domain);
         } else {
         if (this.options.only_language) {//only view pages from this langauge and doesnt appear the language-selectbox
         this.language = this.options.only_language;
         this.loadPages();
         } else {
         this.createLanguageBox();
         }
         }
         }*/

        var needDomainSelection = false;
        var needLanguageSelection = false;

        if (this.options.objects) {
            Array.each(this.options.objects, function (objectKey) {

                var object = jarves.getObjectDefinition(objectKey);

                this.createObjectChooser(objectKey);

                if (object.multiLanguage) {
                    needLanguageSelection = true;
                }
                if (object.domainDepended) {
                    needDomainSelection = true;
                }

            }.bind(this));
        }

        var domainRight = 1;

        if (needLanguageSelection) {
            this.sLanguage = new jarves.Select(this.win.titleGroups);

            document.id(this.sLanguage).setStyles({
                'position': 'absolute',
                'right': 1,
                'top': 0,
                'width': 110
            });
            domainRight = +134;

            this.sLanguage.addEvent('change', this.changeLanguage.bind(this));

            this.sLanguage.add('', t('Unassigned language'));

            Object.each(jarves.settings.langs, function (lang, id) {
                this.sLanguage.add(id, lang.langtitle + ' (' + lang.title + ', ' + id + ')');
            }.bind(this));
        }

        if (needDomainSelection) {
            this.sDomain = new jarves.Select(this.win.titleGroups);

            document.id(this.sDomain).setStyles({
                'position': 'absolute',
                'right': domainRight,
                'top': 0,
                'width': 110
            });

            this.sDomain.addEvent('change', this.changeDomain.bind(this));

            Object.each(jarves.settings.domains, function (domain) {
                this.sDomain.add(domain.id, '[' + domain.lang + '] ' + domain.domain);
            }.bind(this));
        }

        this.changeTab(0);
    },

    changeTab: function (pTabIndex) {

        var objectKey = this.pane2ObjectId[pTabIndex];
        if (!objectKey) {
            return;
        }

        var definition = jarves.getObjectDefinition(objectKey);

        if (definition.multiLanguage) {
            this.sLanguage.setStyle('visibility', 'visible');
        }
        else if (this.sLanguage) {
            this.sLanguage.setStyle('visibility', 'hidden');
        }

        if (definition.domainDepended) {
            this.sDomain.setStyle('visibility', 'visible');
        }
        else if (this.sDomain) {
            this.sDomain.setStyle('visibility', 'hidden');
        }

    },

    changeDomain: function () {

    },

    changeLanguage: function () {

    },

    createObjectChooser: function (objectKey) {
        objectKey = jarves.normalizeObjectKey(objectKey);
        var objectDefinition = jarves.getObjectDefinition(objectKey);

        var bundle = this.tapPane.addPane(objectDefinition.label || objectDefinition._key, objectDefinition.icon);
        this.pane2ObjectId[bundle.id] = objectKey;
        bundle.pane.addClass('jarves-BackendChooser-pane');

        var objectOptions = this.options.browserOptions[objectKey];

        if (this.options.objects.length == 1 && !objectOptions) {
            objectOptions = this.options.browserOptions;
        }

        if (!objectOptions) {
            objectOptions = {};
        }

        objectOptions.multi = this.options.multi;

        var win = new jarves.Window(null, null, null, null, true, bundle.pane);

        if (objectDefinition.browserInterface == 'custom' && objectDefinition.browserInterfaceClass) {

            var chooserClass = jarves.getClass(objectDefinition.browserInterfaceClass);
            if (!chooserClass) {
                this.win._alert(t("Can't find chooser class '%class%' in object '%object%'.")
                    .replace('%class%', objectDefinition.browserInterfaceClass)
                    .replace('%object%', objectKey)
                );
            } else {
                this.objectChooserInstance[objectKey] = new chooserClass(
                    win.getContentContainer(),
                    objectOptions,
                    win
                );
            }
        } else if (objectDefinition.nested) {

            objectOptions.type = 'tree';
            objectOptions.object = objectKey;
            objectOptions.scopeChooser = true;
            objectOptions.noWrapper = true;
            this.objectChooserInstance[objectKey] = new jarves.Field(objectOptions, win.getContentContainer());

        } else {
            this.objectChooserInstance[objectKey] = new jarves.ObjectTable(
                win.getContentContainer(),
                objectOptions,
                win,
                objectKey
            );
        }

        if (this.objectChooserInstance[objectKey] && this.objectChooserInstance[objectKey].addEvent) {
            this.objectChooserInstance[objectKey].addEvent('select', function () {
                this.deselectAll(objectKey);
            }.bind(this));

            this.objectChooserInstance[objectKey].addEvent('instantSelect', function () {
                this.choose(objectKey);
            }.bind(this));
        }
    },

    deselectAll: function (pWithoutThisObjectKey) {
        Object.each(this.objectChooserInstance, function (obj, objectKey) {

            if (obj && objectKey != pWithoutThisObjectKey && obj.deselect) {
                obj.deselect();
            }

        });
    },

    choose: function (pObjectKey) {
        if (!pObjectKey) {
            pObjectKey = this.pane2ObjectId[this.tapPane.index];
        }

        if (pObjectKey && this.objectChooserInstance[pObjectKey] && this.objectChooserInstance[pObjectKey].getValue) {

            var selected = this.objectChooserInstance[pObjectKey].getValue();

            if (typeOf(selected) == 'undefined') {
                return false;
            }

            if (typeOf(selected) == 'object') {
                selected = jarves.getObjectUrlId(pObjectKey, selected);
                selected = 'object://' + pObjectKey + '/' + selected;
            }

            this.saveCookie();
            this.saveCookie();
            this.fireEvent('select', selected);
            this.win.close();
        }
    }

});
