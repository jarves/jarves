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

jarves.Window = new Class({

    Binds: ['close'],
    Implements: [Events, Options],

    entryPoint: '',
    module: '',

    inline: false,
    link: {},
    params: {},

    children: null,

    options: {

    },

    initialize: function (entryPointPath, options, instanceId, parameter, isInline, parentWindowId) {
        this.params = parameter || {};
        this.setOptions(options);
        this.originParams = Object.clone(this.params);
        
        this.id = instanceId;
        this.entryPoint = entryPointPath;
        this.inline = isInline;
        this.parent = parentWindowId;

        if (this.inline) {
            if (typeOf(this.parent) == 'number' && jarves.wm.getWindow(this.parent)) {
                jarves.wm.getWindow(this.parent).setChildren(this);
            }
        }

        this.active = true;
        this.isOpen = true;

        this.createWin();

        if (entryPointPath) {
            this.loadContent();
            this.addHotkey('esc', !this.isInline(), false, function (e) {
                (function () {
                    this.close(true);
                }).delay(50, this);
            }.bind(this));
        }
    },

    /**
     *
     * @returns {boolean}
     */
    isInline: function () {
        return this.inline;
    },

    /**
     *
     * Returns all parameters or only a specific.
     *
     * @param {String} [key]
     * @returns {*}
     */
    getParameter: function (key) {
        return key && this.params ? this.params[key] : this.params;
    },

    getParameters: function() {
        return this.params;
    },

    hasParameters: function() {
        return this.params && Object.toQueryString(this.params);
    },

    getOriginParameters: function() {
        return this.originParams;
    },

    /**
     *
     * @param {*} pParameter
     */
    setParameters: function (pParameters) {
        this.params = pParameters || {};
        jarves.wm.reloadHashtag();
    },

    /**
     *
     * @param key
     * @param value
     */
    setParameter: function (key, value) {
        this.params = this.params || {};
        this.params[key] = value;
        jarves.wm.reloadHashtag();
    },

    /**
     *
     * @returns {jarves.Window}
     */
    getParent: function () {
        if (instanceOf(this.parent, jarves.Window)) {
            return this.parent;
        }
        return 'number' === typeOf(this.parent) ? jarves.wm.getWindow(this.parent) : this.parent;
    },

    isInFront: function () {

        if (!this.children) {
            return this.inFront;
        }

        return this.children.isInFront();
    },

    setChildren: function (pWindow) {
        this.children = pWindow;
    },

    getChildren: function () {
        return this.children;
    },

    removeChildren: function () {
        delete this.children;
    },

    onResizeComplete: function () {
    },

    softReload: function () {
    },

    iframeOnLoad: function () {

        if (this.inline) {
            var opener = jarves.wm.getOpener(this.id);
            //opener.inlineContainer.empty();
            //this.content.inject( opener.inlineContainer );

            this.getContentContainer().setStyles({'top': 5, 'bottom': 5, left: 5, right: 5});
            var borderSize = opener.border.getSize();

            opener.inlineContainer.setStyle('width', 530);

            //            this.iframe.contentWindow.document.body.style.height = '1px';
            //            this.iframe.contentWindow.document.body.style.width = '1px';

            var inlineSize = {x: this.iframe.contentWindow.document.html.scrollWidth + 50,
                y: this.iframe.contentWindow.document.html.scrollHeight + 50};

            //            this.iframe.contentWindow.document.body.style.height = inlineSize.y+'px';
            //            this.iframe.contentWindow.document.body.style.width = inlineSize.x+'px';

            if (inlineSize.x > borderSize.x) {
                opener.border.setStyle('width', inlineSize.x);
            }

            if (inlineSize.y + 35 > borderSize.y) {
                opener.border.setStyle('height', inlineSize.y + 35);
            }

            if (inlineSize.y < 450) {
                inlineSize.y = 450;
            }

            opener.inlineContainer.setStyles({
                height: inlineSize.y - 25,
                width: inlineSize.x
            });

        }
    },

    setLoading: function (pState, pText, pOffset) {
        if (pState == true) {

            if (!pText) {
                pText = t('Loading ...');
            }

            if (this.loadingObj) {
                this.loadingObj.destroy();
                delete this.loadingObj;
            }

            if (this.loadingFx) {
                delete this.loadingFx;
            }

            this.loadingObj = new jarves.Loader(this.border, {
                overlay: true,
                absolute: true
            });

            var div = new Element('div', {
                'class': 'jarves-jarves-Window-loader-content gradient',
                html: "<br/>" + pText
            }).inject(this.loadingObj.td);

            document.id(this.loadingObj).setStyles({'top': 25});
            this.loadingObj.transBg.setStyles({'top': 25});

            document.id(this.loadingObj).setStyles(pOffset);
            this.loadingObj.transBg.setStyles(pOffset);

            this.loadingObj.getLoader().inject(div, 'top');
            this.loadingObj.getLoader().setStyle('line-height', 25);

            this.loadingObj.transBg.setStyle('opacity', 0.05);
            div.setStyles({
                'opacity': 0,
                'top': 30
            });

            this.loadingFx = new Fx.Morph(div, {
                duration: 500, transition: Fx.Transitions.Quint.easeOut
            });

            this.loadingObj.show();

            this.loadingFx.start({
                'top': 0,
                opacity: 1
            });

        } else {
            if (this.loadingObj) {

                this.loadingFx.cancel();
                this.loadingObj.destroyOverlay();

                this.loadingFx.addEvent('complete', function () {

                    if (this.loadingObj) {
                        this.loadingObj.destroy();
                        delete this.loadingObj;
                        delete this.loadingFx;
                    }

                }.bind(this));

                this.loadingFx.start({
                    'top': -30,
                    opacity: 0
                });

            }
        }

    },

    getOpener: function () {
        return jarves.wm.getOpener(this.id);
    },

    toBlockMode: function (pOpts, pCallback) {
        if (!pOpts.id > 0) {
            return;
        }

        this.blockModeOverlay = new Element('div', {
            style: ''
        }).inject(this.blockModeContainer);
    },

    /**
     *
     * @param text
     * @param callback
     * @returns {jarves.Dialog}
     */
    alert: function (text, callback) {
        return this._alert(text, callback);
    },

    _alert: function (text, callback) {
        return this._prompt(text, null, callback, {
            'alert': 1
        });
    },

    /**
     *
     * @param text
     * @param callback
     * @returns {jarves.Dialog}
     * @private
     */
    _confirm: function (text, callback) {
        return this.confirm(text, callback);
    },

    /**
     *
     * @param text
     * @param callback
     * @returns {jarves.Dialog}
     */
    confirm: function (text, callback) {
        return this._prompt(text, null, callback, {
            'confirm': 1
        });
    },

    _passwordPrompt: function (pDesc, pDefaultValue, pCallback, pOpts) {
        if (!pOpts) {
            pOpts = {};
        }
        pOpts.pw = 1;
        return this._prompt(pDesc, pDefaultValue, pCallback, pOpts);
    },

    prompt: function(pText, pDefaultValue, pCallback) {
        return this._prompt(pText, pDefaultValue, pCallback);
    },

    /**
     *
     * @param description
     * @param defaultValue
     * @param callback
     * @param options
     * @returns {jarves.Dialog}
     * @private
     */
    _prompt: function (description, defaultValue, callback, options) {
        var res = false;
        if (!options) {
            options = {};
        }
        if (options['confirm'] == 1) {
            res = true;
        }

        var main = this.newDialog(description);

        if (options['alert'] != 1 && options['confirm'] != 1) {
            var input = main.input = new Element('input', {
                'class': 'text',
                'type': (options.pw == 1) ? 'password' : 'text',
                value: defaultValue
            }).inject(main.content);

            input.focus();
        }

        var ok = false;

        if (options['alert'] != 1) {

            if (callback) {
                var closeEvent = function () {
                    callback(false);
                };
                main.addEvent('closed', closeEvent);
            }

            new jarves.Button(t('Cancel')).addEvent('click', function () {
                main.close(true);
            }.bind(this)).inject(main.bottom);

            ok = new jarves.Button(t('OK')).addEvent('keyup',function (e) {
                e.stopPropagation();
                e.stop();
            })
                .addEvent('click', function (e) {
                    if (e) {
                        e.stop();
                    }
                    if (input && input.value != '') {
                        res = input.value;
                    }
                    if (callback) {
                        main.removeEvent('closed', closeEvent);
                    }
                    main.close(true);
                    if (callback) {
                        callback(res);
                    }
                }.bind(this))
                .setButtonStyle('blue')
                .inject(main.bottom);
        }

        if (options && options['alert'] == 1) {

            if (callback) {
                main.addEvent('closed', callback);
            }

            ok = new jarves.Button('OK')
                .addEvent('click', function (e) {
                    if (e) {
                        e.stop();
                    }
                    main.close(true);
                }.bind(this))
                .setButtonStyle('blue')
                .inject(main.bottom);
        }

        if (options['alert'] != 1 && options['confirm'] != 1) {
            input.addEvent('keyup', function (e) {
                if (e.key == 'enter') {
                    e.stopPropagation();
                    e.stop();
                    if (ok) {
                        ok.fireEvent('click');
                    }
                }
            });
        }

        if (ok && !input) {
            ok.focus();
        }

        main.center(true);

        return main;
    },

    /**
     * Creates a new dialog over the current window.
     *
     * @param  {*} text A string (non html) or an element, that will be injected in the content area.
     * @param  {Boolean} absoluteContent If we position this absolute or inline.
     *
     * @return {jarves.Dialog}
     */
    newDialog: function (text, absoluteContent) {
        return new jarves.Dialog(this, {
            content: text,
            autoDisplay: true,
            absolute: absoluteContent
        });
    },

    parseTitle: function (html) {
        html = html.replace('<img', ' » <img');
        html = html.stripTags();
        if (html.indexOf('»') !== -1) {
            html = html.substr(3);
        }
        return html;
    },

    getTitle: function () {
        if (this.titleText) {
            return this.titleText.get('text');
        }
        return '';
    },

    getFullTitle: function () {
        if (this.titleTextContainer) {
            return this.parseTitle(this.titleTextContainer.get('html'));
        }
        return '';
    },

    setTitle: function (title) {
        this.clearTitle();

        if (!this.titleTextPath) {
            this.titleText = new Element('span', {
                text: title,
                'class': 'icon-arrow-right-5 icon-arrow-19'
            }).inject(this.titleAdditional);
        } else {
            this.titleText.set('text', title);
        }
        jarves.wm.updateWindowBar();

    },

    toBack: function () {
        this.title.removeClass('jarves-jarves-Window-inFront');

        if (!this.isInline() && (!this.children || !this.children.isInline())) {
            this.border.setStyle('display', 'none');
        }

        this.inFront = false;
    },

    clearTitle: function () {
        this.titleAdditional.empty();
        jarves.wm.updateWindowBar();
    },

    addTitle: function (text) {
        new Element('span', {
            text: text,
            'class': 'icon-arrow-right-5 icon-arrow-19'
        }).inject(this.titleAdditional);

        jarves.wm.updateWindowBar();
    },

    toFront: function (onlyZIndex) {
        if (this.active) {
            this.title.addClass('jarves-jarves-Window-inFront');
            if (this.border.getStyle('display') != 'block') {
                this.border.setStyles({
                    'display': 'block'
                });
            }

            if (this.getParent() && instanceOf(this.getParent(), jarves.Window)) {
                this.getParent().toFront(true);
            }

            if (!this.isInline()) {
                jarves.wm.zIndex++;
                this.border.setStyle('z-index', jarves.wm.zIndex);
            }

            if (onlyZIndex) {
                return true;
            }

            if (this.getChildren()) {
                this.getChildren().toFront();
                this.getChildren().highlight();
                return false;
            }

            jarves.wm.setFrontWindow(this);
            this.isOpen = true;
            this.inFront = true;

            this.border.setStyle('display', 'block');

            this.deleteOverlay();
            jarves.wm.updateWindowBar();

            this.fireEvent('toFront');

            return true;
        }
    },

    addHotkey: function (key, controlOrMeta, alt, callback) {
        if (!this.hotkeyBinds) {
            this.hotkeyBinds = [];
        }

        var bind = function (e) {
            if (document.activeElement) {
                if (document.activeElement.get('tag') != 'body' && !document.activeElement.hasClass('jarves-Button')) {
                    return;
                }
            }
            if (this.isInFront() && (!this.inOverlayMode)) {

                if (controlOrMeta && (!e.control && !e.meta)) {
                    return;
                }
                if (alt && !e.alt) {
                    return;
                }
                if (e.key == key) {
                    callback(e);
                }
            }
        }.bind(this);

        this.hotkeyBinds.push(bind);

        document.body.addEvent('keydown', bind);

    },

    removeHotkeys: function () {
        Array.each(this.hotkeyBinds, function (bind) {
            document.removeEvent('keydown', bind);
        })
    },

    _highlight: function () {
        [this.title, this.bottom].each(function (item) {
            if (!item) return;
            item.set('tween', {duration: 50, onComplete: function () {
                item.tween('opacity', 1);
            }});
            item.tween('opacity', 0.3);
        });
    },

    highlight: function () {

        (function () {
            this._highlight();
        }.bind(this)).delay(1);
        (function () {
            this._highlight()
        }.bind(this)).delay(150);
        (function () {
            this._highlight()
        }.bind(this)).delay(300);
    },

    setBarButton: function (pButton) {
        this.barButton = pButton;
    },

    minimize: function () {

        this.isOpen = false;

        jarves.wm.updateWindowBar();

        var cor = this.border.getCoordinates();
        var quad = new Element('div', {
            styles: {
                position: 'absolute',
                left: cor.left,
                top: cor.top,
                width: cor.width,
                height: cor.height,
                border: '3px solid gray'
            }
        }).inject(this.border.getParent());

        quad.set('morph', {duration: 300, transition: Fx.Transitions.Quart.easeOut, onComplete: function () {
            quad.destroy();
        }});

        var cor2 = this.barButton.getCoordinates(this.border.getParent());
        quad.morph({
            width: cor2.width,
            top: cor2.top,
            left: cor2.left,
            height: cor2.height
        });
        this.border.setStyle('display', 'none');
        this.onResizeComplete();
    },

    maximize: function (pDontRenew) {

        if (this.inline || this.isPopup()) {
            return;
        }

        if (this.maximized) {
            //this.borderDragger.attach();

            this.border.setStyles(this.oldDimension);
            this.maximizer.removeClass('icon-shrink-3');
            this.maximizer.addClass('icon-expand-4');
            this.maximized = false;
            this.border.removeClass('jarves-Window-border-maximized');

            Object.each(this.sizer, function (sizer) {
                sizer.setStyle('display', 'block');
            });

            this.bottom.set('class', 'jarves-Window-win-bottom');
        } else {
            //this.borderDragger.detach();
            this.border.addClass('jarves-Window-border-maximized');

            this.oldDimension = this.border.getCoordinates(this.border.getParent());
            this.border.setStyles({
                width: '100%',
                height: '100%',
                left: 0,
                top: 0
            });
            this.maximizer.removeClass('icon-expand-4');
            this.maximizer.addClass('icon-shrink-3');
            this.maximized = true;

            Object.each(this.sizer, function (sizer) {
                sizer.setStyle('display', 'none');
            });

            this.bottom.set('class', 'jarves-Window-win-bottom-maximized');
        }

        this.onResizeComplete();
        this.fireEvent('resize');
    },

    close: function (pInternal) {

        //search for dialogs
        if (this.border) {
            var dialogs = this.border.getChildren('.jarves-jarves-Window-prompt');
            if (!dialogs || !dialogs.length) {
                dialogs = this.border.getChildren('.jarves-dialog-overlay');
            }
            if (dialogs.length > 0) {

                var lastDialog = dialogs[dialogs.length - 1];
                if (lastDialog.kaDialog) {
                    lastDialog = lastDialog.kaDialog;
                }

                if (lastDialog.canClosed === false) {
                    return;
                }
                lastDialog.closeAnimated(true);

                delete lastDialog;
                return false;
            }
        }

        //search for children windows
        if (this.getChildren()) {
            this.getChildren().highlight();
            return false;
        }

        if (pInternal) {
            this.interruptClose = false;
            this.fireEvent('close');
            if (this.interruptClose == true) {
                return false;
            }
        }

        if (this.onClose) {
            this.onClose();
        }

        if (this.border) {
            if (this.getEntryPoint() == 'users/users/edit/') {
                jarves.loadSettings();
            }
            this.border.getElements('a.jarves-Window-win-buttonWrapper').each(function (button) {
                if (button.toolTip && button.toolTip.main) {
                    button.toolTip.main.destroy();
                }
            });
        }

        this.inFront = false;

        if (this.dialogContainer) {
            this.addEvent('postClose', function () {
                this.destroy();
            }.bind(this));
            this.dialogContainer.closeAnimated();
        } else {
            this.destroy();
        }

        jarves.wm.close(this);
        this.fireEvent('closed');
    },

    destroy: function () {
        this.removeHotkeys();

        if (window['contentCantLoaded_' + this.customId]) {
            delete window['contentCantLoaded_' + this.customId];
        }

        if (window['contentLoaded_' + this.customId]) {
            delete window['contentLoaded_' + this.customId];
        }

        if (this.custom) {
            delete this.custom;
        }

        if (this.customCssAsset) {
            this.customCssAsset.destroy();
            delete this.customCssAsset;
        }

        if (this.customJsAsset) {
            this.customJsAsset.destroy();
            delete this.customJsAsset;
        }

        if (this.customJsClassAsset) {
            this.customJsClassAsset.destroy();
            delete this.customJsClassAsset;
        }

        this.border.destroy();
    },

    getEntryPoint: function () {
        return this.entryPoint;
    },

    getId: function () {
        return this.id;
    },

    getEntryPointDefinition: function () {
        return this.entryPointDefinition;
    },

    getModule: function () {
        if (!this.module) {
            if (this.getEntryPoint().indexOf('/') > 0) {
                this.module = this.getEntryPoint().substr(0, this.getEntryPoint().indexOf('/'));
            } else {
                this.module = this.getEntryPoint();
            }
        }
        return this.module;
    },

    isPopup: function () {
        return this.isPopup;
    },

    loadContent: function () {

        if (this.getContentContainer()) {
            this.getContentContainer().empty();
        }

        this.entryPointDefinition = jarves.entrypoint.get(this.getEntryPoint());

        if (!this.entryPointDefinition) {
            this.close(true);
            logger(tf('Entry point `%s` not found.', this.getEntryPoint()));
            return;
        }

        if (!this.entryPointDefinition.multi) {
            var win = jarves.wm.checkOpen(this.getEntryPoint(), this.id);
            if (win) {
                if (win.softOpen) {
                    win.softOpen(this.params);
                }
                win.toFront();
                this.close(true);
                return;
            }
        }

        var title = jarves.getConfig( this.getModule() )['label'] || jarves.getConfig( this.getModule() )['name'];

        new Element('span', {
            text: title
        }).inject(this.titleTextContainer);

        var path = Array.clone(this.entryPointDefinition._path);
        path.pop();
        Array.each(path, function (label) {
            this.addTitle(label);
        }.bind(this));
//
//            new Element('img', {
//                src: _path + 'bundles/jarves/admin/images/jarves-jarves-Window-title-path.png'
//            }).inject(this.titleTextContainer);
//
//            new Element('span', {
//                text: t(label)
//            }).inject(this.titleTextContainer);
//
//        }.bind(this));

        if (!this.inline && !this.isPopup()) {
            this.createResizer();
        }

        this.addTitle(this.entryPointDefinition.label);

        this.content.empty();
        new Element('div', {
            style: 'text-align: center; padding: 15px; color: gray',
            text: t('Loading content ...')
        }).inject(this.content);

        if (this.entryPointDefinition.type == 'iframe') {
            this.content.empty();
            this.iframe = new IFrame('iframe_kwindow_' + this.id, {
                'class': 'jarves-Window-iframe',
                frameborder: 0
            }).addEvent('load', function () {
                    this.iframe.contentWindow.win = this;
                    this.iframe.contentWindow.jarves = jarves;
                    this.iframe.contentWindow.wm = jarves.wm;
                    this.iframe.contentWindow.fireEvent('kload');
                }.bind(this)).inject(this.content);
            this.iframe.set('src', _path + this.entryPointDefinition.src);
        } else if (this.entryPointDefinition.type == 'custom') {
            this.renderCustom();
        } else if (this.entryPointDefinition.type == 'combine') {
            this.renderCombine();
        } else if (this.entryPointDefinition.type == 'list') {
            this.renderList();
        } else if (this.entryPointDefinition.type == 'add') {
            this.renderAdd();
        } else if (this.entryPointDefinition.type == 'edit') {
            this.renderEdit();
        }

        if (this.entryPointDefinition.type != 'combine') {
            if (this.dialogContainer) {
                this.dialogContainer.center(true);
            }
        }

        jarves.wm.updateWindowBar();

        if (this.entryPointDefinition.noMaximize === true) {
            this.maximizer.destroy();
        }

        if (this.entryPointDefinition.print === true) {
            this.printer = new Element('img', {
                'class': 'jarves-Window-win-printer',
                src: _path + 'bundles/jarves/admin/images/icons/printer.png'
            }).inject(this.border);
            this.printer.addEvent('click', this.print.bind(this));
        }

    },

    updateInlinePosition: function () {
        if (this.inline && this.getOpener() && this.getOpener().inlineContainer) {
            this.border.position({ relativeTo: this.getOpener().inlineContainer });
        }
    },

    print: function () {
        var size = this.border.getSize();
        var popup = window.open('', '',
            'width=' + size.x + ',height=' + size.y + ',menubar=yes,resizeable=yes,status=yes,toolbar=yes');
        var clone = this.content.clone();
        popup.document.open();
        popup.document.write('<head><title>Drucken</title></head><body></body>');
        clone.inject(popup.document.body);
        popup.document.close();

        Array.each(document.styleSheets, function (s, index) {
            var w = new Element('link', {
                rel: 'stylesheet',
                type: 'text/css',
                href: s.href,
                media: 'screen'
            }).inject(popup.document.body);
        });
        popup.print();
    },

    renderEdit: function () {
        this.edit = new jarves.WindowEdit(this, null, {entryPoint: this.getEntryPoint()});
        this.edit.addEvent('destroy', function(){
            this.close(true);
        }.bind(this))
    },

    renderAdd: function () {
        this.add = new jarves.WindowAdd(this, null, {entryPoint: this.getEntryPoint()});
    },

    renderCombine: function () {
        this.combine = new jarves.WindowCombine(this, null, {entryPoint: this.getEntryPoint()});
    },

    renderList: function () {
        this.list = new jarves.WindowList(this, null, {entryPoint: this.getEntryPoint()});
    },

    renderCustom: function () {
        var id = 'text';

        var code = this.getEntryPoint().substr(this.getModule().length + 1);

        var javascript = code.replace(/\//g, '_');

        var noCache = (new Date()).getTime();

        this.customCssAsset =
            new Asset.css(_path + 'bundles/' + this.getModule().toLowerCase().replace(/bundle$/, '') + '/admin/css/' + javascript + '.css?noCache=' +
                noCache);

        this.customId = parseInt(Math.random() * 100) + parseInt(Math.random() * 100);

        window['contentCantLoaded_' + this.customId] = function (pFile) {
            this.content.empty();
            this._alert(t('Custom javascript file not found') + "\n" + pFile, function () {
                this.close();
            }.bind(this));
        }.bind(this);

        window['contentLoaded_' + this.customId] = function () {
            this.content.empty();
            var clazz = this.getEntryPoint().replace(/\//g, '_');
            var clazzLC = this.getEntryPoint().replace(/\//g, '_').toLowerCase();
            if (window[clazz]) {

            } else if (window[clazzLC]) {
                clazz = clazzLC;
            } else {
                this.alert(tf('Javascript class `%s` not found.', clazz));
                return;
            }
            this.custom = new window[ clazz ](this);

            if (this.dialogContainer) {
                this.dialogContainer.center(true);
            }
        }.bind(this);

        this.customJsClassAsset =
            new Asset.javascript(_pathAdmin + 'admin/backend/custom-js?bundle=' + this.getModule() + '&code=' +
                javascript +
                '&onLoad=' + this.customId);
    },

    toElement: function () {
        return this.border;
    },

    createWin: function () {
        this.border = new Element('div', {
            'class': 'jarves-admin jarves-Window-border'
        });

        this.border.windowInstance = this;

        this.win = this.border;
        this.title = new Element('div', {'class': 'jarves-Window-win-title'}).inject(this.win);

        this.mainLayout = new jarves.Layout(this.win, {
            layout: [
                {columns: [null], height: 1},
                {columns: [null], height: '100%'}
            ]
        });

        this.mainLayout.getCell(1, 1).setStyle('height', 'auto');


        this.titlePath = new Element('span', {'class': 'jarves-jarves-Window-titlepath'}).inject(this.title);
        this.titleTextContainer = new Element('span', {'class': 'jarves-jarves-Window-titlepath-main'}).inject(this.titlePath);

        this.titleAdditional = new Element('span', {'class': 'jarves-jarves-Window-titlepath-additional'}).inject(this.titlePath);

        this.titleGroups =
            new Element('div', {'class': 'jarves-Window-win-titleGroups'}).inject(this.mainLayout.getCell(1, 1));

        this.mainLayout.getCell(2, 1).addClass('jarves-Window-win-content-container');
        this.content = new Element('div', {'class': 'jarves-Window-win-content'}).inject(this.mainLayout.getCell(2, 1));
        this.inFront = true;

        if (this.isInline() && instanceOf(this.getParent(), jarves.Window)) {
            this.dialogContainer = new jarves.Dialog(this.getParent(), {
                absolute: true,
                noBottom: true,
                autoDisplay: true,
                autoClose: true,
                width: this.options.width || '75%',
                height: this.options.height || '92%',
                minWidth: this.options.minWidth,
                minHeight: this.options.minHeight,
                withSmallCloseButton: true
            });
            this.border.inject(this.dialogContainer.getContentContainer());
            this.dialogContainer.addEvent('preClose', function() {
                if (!this.close(true)) {
                    this.dialogContainer.abortClosing();
                }
            }.bind(this));
        } else if (this.isInline()) {
            this.border.inject(this.getParent());
        } else {
            this.border.inject(jarves.adminInterface.desktopContainer);
        }
    },

    hideTitleGroups: function () {
        this.mainLayout.getRow(2).setStyle('display', 'none');
    },

    showTitleGroups: function () {
        this.mainLayout.getRow(2).setStyle('display', 'table-row');
    },

    setStatusText: function (pVal) {
        this.bottom.set('html', pVal);
    },

    getTitleContaner: function () {
        return this.title;
    },

    /**
     * @returns {jarves.Layout}
     */
    getMainLayout: function() {
        return this.mainLayout;
    },

    hideHead: function() {
        this.mainLayout.hideRow(1);
    },

    extendHead: function () {
        this.mainLayout.showRow(1);
    },

    addTabGroup: function () {
        return new jarves.TabGroup(this.getTitleGroupContainer());
    },

    addSmallTabGroup: function () {
        return new jarves.SmallTabGroup(this.getTitleGroupContainer());
    },

    getTitleGroupContainer: function () {
        return this.titleGroups;
    },

    enableTitleActionBar: function() {
        this.getTitleGroupContainer().addClass('jarves-ActionBar');
    },

    getContentContainer: function () {
        return this.content;
    },

    addSidebar: function() {
        if (!this.sidebar) {
            this.sidebar = new Element('div', {
                'class': 'jarves-Window-sidebar'
            }).inject(this.border);

            this.sidebarContainer = new Element('div', {
                'class': 'jarves-scrolling jarves-Window-sidebar-container'
            }).inject(this.sidebar);

            this.sidebarSplitter = new jarves.LayoutSplitter(this.sidebar, 'left');

            this.sidebarSplitter.addEvent('resize', function() {
                document.id(this.mainLayout).setStyle('right', this.sidebar.getStyle('width').toInt() + 40);
                var width = this.sidebarContainer.getSize().x;
                if (width < 50) {
                    this.sidebarContainer.addClass('jarves-Window-sidebar-container-small');
                    if (width < 43) {
                        this.sidebar.setStyle('width', 43);
                    }
                } else {
                    this.sidebarContainer.removeClass('jarves-Window-sidebar-container-small');
                }
                this.fireEvent('resize');
                this.fireEvent('resizeSidebar', width);
            }.bind(this));

            this.setSidebarWidth(150);

            if (Modernizr.touch) {
                Hammer(this.sidebarContainer).on('touch', function(event) {
                    this.wasSideBarSmall = (this.sidebarContainer.getSize().x < 50);
                }.bind(this));

                Hammer(this.sidebarContainer).on('drag', function(event) {
                    if (!this.wasSideBarSmall && event.gesture.deltaX < 0) {
                        return;
                    }
                    if (this.wasSideBarSmall && event.gesture.deltaX > 0) {
                        return;
                    }
                    this.sidebar.setStyle(Modernizr.prefixed('transform'), 'translate(' +  (event.gesture.deltaX) + 'px, 0)');
                }.bind(this));

                Hammer(this.sidebarContainer).on('release', function(event) {
                    this.sidebar.setStyle(Modernizr.prefixed('transform'), 'translate(0, 0)');
                    if (!this.wasSideBarSmall) {
                        if (event.gesture.deltaX > 30) {
                            this.shrinkSidebar();
                        }
                    } else {
                        if (event.gesture.deltaX < -30) {
                            this.unShrinkSidebar();
                        }
                    }
                }.bind(this));
            }
        }

        return this.sidebarContainer;
    },

    shrinkSidebar: function() {
        var width = this.sidebar.getSize().x;
        if (width !== 43) {
            this.lastSidebarWidth = width;
            this.setSidebarWidth(43);
            this.sidebarSplitter.fireEvent('resize');
        }
    },

    unShrinkSidebar: function() {
        if (this.sidebar.getStyle('width').toInt() <= 45) {
            this.setSidebarWidth(this.lastSidebarWidth);
            delete this.lastSidebarWidth;
            this.sidebarSplitter.fireEvent('resize');
        }
    },

    setSidebarWidth: function(width) {
        document.id(this.sidebar).setStyle('width', width);
        document.id(this.mainLayout).setStyle('right', width + 40);
    },

    /**
     *
     * @returns {Element}
     */
    getSidebar: function() {
        return this.sidebarContainer || this.addSidebar();
    },

    /**
     *
     * @returns {jarves.ButtonGroup}
     */
    addButtonGroup: function () {
        return new jarves.ButtonGroup(this.getTitleGroupContainer());
    },

    /**
     *
     * @returns {Element}
     */
    addBottomBar: function () {
        this.bottomBar = new Element('div', {
            'class': 'jarves-Window-bottom'
        }).inject(this.content, 'after');

        this.bottomBar.addButton = function (pTitle, pOnClick) {
            var button = new jarves.Button(pTitle).inject(this.bottomBar);
            if (pOnClick) {
                button.addEvent('click', pOnClick);
            }
            return button;
        }.bind(this);

        this.content.addClass('jarves-Window-win-content-with-bottom');
        return this.bottomBar;
    },

    setBlocked: function (pBlocked) {
        if (pBlocked) {
            this.blockedOverlay = this.createOverlay();
        }
        else if (this.blockedOverlay) {
            this.blockedOverlay.destroy();
            delete this.blockedOverlay;
        }
    },

    createOverlay: function () {
        var overlay = new Element('div', {
            'class': 'jarves-jarves-Window-overlay',
            styles: {
                opacity: 0.5,
                position: 'absolute',
                'background-color': '#666',
                left: 0, right: 0, 'top': 21, bottom: 0
            }
        });

        overlay.inject(this.border);

        return overlay;
    },

    deleteOverlay: function () {
        if (jarves.performance) {
            this.content.setStyle('display', 'block');
            this.getTitleGroupContainer().setStyle('display', 'block');
        }

        this.inOverlayMode = false;
    },

    createResizer: function () {
        this.sizer = {};

        ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'].each(function (item) {
            this.sizer[item] = new Element('div', {
                'class': 'jarves-jarves-Window-sizer jarves-jarves-Window-sizer-' + item
            }).inject(this.border);
        }.bind(this));

        this.border.dragX = 0;
        this.border.dragY = 0;

        var minWidth = ( this.entryPointDefinition.minWidth > 0 ) ? this.entryPointDefinition.minWidth : 400;
        var minHeight = ( this.entryPointDefinition.minHeight > 0 ) ? this.entryPointDefinition.minHeight : 300;

        Object.each(this.sizer, function (item, key) {
            item.setStyle('opacity', 0.01);

            var height, width, x, y, newHeight, newWidth, newY, newX, max;

            var options = {
                handle: item,
                style: false,
                modifiers: {
                    x: !['s', 'n'].contains(key) ? 'dragX' : null,
                    y: !['e', 'w'].contains(key) ? 'dragY' : null
                },
                snap: 0,
                onBeforeStart: function (pElement) {
                    pElement.dragX = 0;
                    pElement.dragY = 0;
                    height = pElement.getStyle('height').toInt();
                    width = pElement.getStyle('width').toInt();
                    y = pElement.getStyle('top').toInt();
                    x = pElement.getStyle('left').toInt();

                    newWidth = newHeight = newY = newX = null;

                    max = jarves.adminInterface.desktopContainer.getSize();
                },
                onDrag: function (pElement, pEvent) {

                    if (key === 'n' || key == 'ne' || key == 'nw') {
                        newHeight = height - pElement.dragY;
                        newY = y + pElement.dragY;
                    }

                    if (key === 's' || key == 'se' || key == 'sw') {
                        newHeight = height + pElement.dragY;
                    }

                    if (key === 'e' || key == 'se' || key == 'ne') {
                        newWidth = width + pElement.dragX;
                    }

                    if (key === 'w' || key == 'sw' || key == 'nw') {
                        newWidth = width - pElement.dragX;
                        newX = x + pElement.dragX;
                    }

                    if (newWidth !== null && (newWidth > max.x || newWidth < minWidth)) {
                        newWidth = newX = null;
                    }

                    if (newHeight !== null && (newHeight > max.y || newHeight < minHeight)) {
                        newHeight = newY = null;
                    }

                    if (newX !== null && newX > 0) {
                        pElement.setStyle('left', newX);
                    }

                    if (newY !== null && newY > 0) {
                        pElement.setStyle('top', newY);
                    }

                    if (newWidth !== null) {
                        pElement.setStyle('width', newWidth);
                    }

                    if (newHeight !== null) {
                        pElement.setStyle('height', newHeight);
                    }

                }

            };

            new Drag(this.border, options);
        }.bind(this));
    },

    setContentStick: function(stick) {
        if (stick) {
            this.content.addClass('jarves-Window-win-content-stick');
        } else {
            this.content.removeClass('jarves-Window-win-content-stick');
        }
    }

});
