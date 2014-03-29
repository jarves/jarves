jarves.Editor = new Class({

    Binds: ['onOver', 'onOut', 'contentMouseDown', 'contentSidebarMouseDown', 'checkChange'],
    Implements: [Options, Events],

    options: {
        node: {},
        id: '',
        standalone: false
    },

    container: null,
    slots: [],
    lastMouseOveredElement: null,
    placerDimensions: null,

    initialize: function(pOptions, pContainer) {
        this.setOptions(pOptions);

        this.container = document.id(pContainer || document.documentElement);

        this.adjustAnchors();
        this.searchSlots();

        this.container.addEvent('click:relay(.jarves-content-placer)', this.clickPlacer.bind(this));
        this.container.addEvent('click:relay(.jarves-content)', this.click.bind(this));
//        this.container.addEvent('mousemove', this.mouseMove.bind(this));
        this.container.addEvent('click', this.click.bind(this));

        top.window.fireEvent('jarvesEditorLoaded', this);
    },

//    mouseMove: function(e) {
//        if (this.lastCheckPlacerTimer) {
//            clearTimeout(this.lastCheckPlacerTimer);
//        }
//
//        this.lastCheckPlacerTimer = this.checkPlacer.delay(10, this, [e]);
//    },
//
//    checkPlacer: function(e) {
//        this.placerDimensions = [];
//        Array.each(this.container.getElements('.jarves-content-placer'), function(placer) {
//            this.placerDimensions.push({
//                dimension: placer.getElement('a.jarves-content-placer-place').getCoordinates(this.container.documentElement),
//                element: placer
//            });
//        }.bind(this));
//
//        var range = 18;
//        var posY = e.page.y;
//        var posX = e.page.x;
//
//        Array.each(this.placerDimensions, function(placer) {
//            var valid = true;
//
//            valid &= placer.dimension.top-range < posY;
//            valid &= placer.dimension.left-range < posX;
//            valid &= placer.dimension.right+range > posX;
//            valid &= placer.dimension.bottom+range > posY;
//
//            if (valid) {
//                placer.element.addClass('jarves-content-placer-visible');
//            } else {
//                placer.element.removeClass('jarves-content-placer-visible');
//            }
//        });
//    },

    click: function(e, element) {
        if (element) {
            e.stopPropagation();
            this.disableNextContainerClick = true;
            this.selectElement(element);
        } else if (!this.disableNextContainerClick) {
            this.deselect();
        } else {
            delete this.disableNextContainerClick;
        }

        if (this.inspector) {
            this.closeInspector();
        }

        //forward click to parent document
        var evObj = document.createEvent('MouseEvents');
        evObj.initMouseEvent('click', true, false);
        document.body.dispatchEvent(evObj);
    },

    clickPlacer: function(e, element) {
        if (element) {
            e.stop();
            var slotElement = element.getParent('.jarves-slot');

            if (slotElement) {
                this.showAddContent(slotElement.kaSlotInstance, element);
            }
        }
    },

    /**
     *
     * @param {jarves.Slot} slot
     * @param {Element} placerElement
     * @param {Array} [limitTypes]
     */
    showAddContent: function(slot, placerElement, limitTypes) {
        var dialog = new jarves.Dialog(null, {
            autoClose: true,
            maxWidth: 530
        });
        var container = dialog.getContentContainer();

        var cb = function(type, value) {
            dialog.close();
            var content = {
                type: type,
                content: value
            };

            var dummy = new Element('div');

            var parentElement = placerElement.getParent();
            if (parentElement.hasClass('jarves-content')) {
                document.id(dummy).inject(parentElement, 'after');
            } else if (parentElement.hasClass('jarves-slot')) {
                var placerInSlot = parentElement.getChildren('.jarves-content-placer');
                if (placerInSlot && 0 < placerInSlot.length) {
                    document.id(dummy).inject(placerInSlot[0], 'after');
                } else {
                    document.id(dummy).inject(parentElement);
                }
            } else {
                document.id(dummy).inject(placerElement, 'after');
            }

            var instance = slot.addContent(content, true, null, true);

            document.id(instance).inject(dummy, 'after');
            dummy.destroy();

            slot.fireChange();
        };

        new Element('h3', {
            'class': 'light',
            text: t('Content elements')
        }).inject(container);

        this.contentElementsContainer = new Element('div', {
            'class': 'jarves-Editor-content-items-container'
        }).inject(container);

        Object.each(jarves.ContentTypes, function(content, type) {
            this.addContentTypeIcon(type, content, cb);
        }.bind(this));

        new Element('div', {'class': 'jarves-clear'}).inject(this.contentElementsContainer);

        this.pluginsContainer = new Element('div').inject(container);
        Object.each(jarves.settings.configs, function(config, bundleName) {
            this.addPlugins(bundleName, config, cb);
        }.bind(this));

        new Element('div', {'class': 'jarves-clear'}).inject(this.pluginsContainer);

//        var content = slot.kaSlotInstance.addContent(value, true);
//        if (contentElement) {
//            content.inject(contentElement, 'after');
//        } else {
//            content.inject(slot, 'top');
//        }

        dialog.show();
    },

    addPlugins: function(bundleName, config, cb) {
        if (config.plugins) {
            var a;

            new Element('h3', {
                'class': 'light',
                text: config.label || bundleName
            }).inject(this.pluginsContainer);

            var container = new Element('div', {
                'class': 'jarves-Editor-content-items-container'
            }).inject(this.pluginsContainer);

            Object.each(config.plugins, function(plugin, pluginId) {
                a = new Element('div', {
                    text: plugin.label || plugin.id,
                    'class': 'jarves-editor-content-item ' + (plugin.icon || 'icon-cube-2')
                }).inject(container);

                a.addEvent('click', function(){
                    cb('plugin', {bundle: bundleName, plugin: pluginId});
                });
            }.bind(this));


            new Element('div', {'class': 'jarves-clear'}).inject(container);
        }
    },

    addContentTypeIcon: function(type, content, cb) {
        var self = this;

        var a = new Element('div', {
            text: content.label,
            'class': 'jarves-editor-content-item ' + (content.icon || '')
        }).inject(this.contentElementsContainer);

        a.addEvent('click', function(){
            cb(type, '');
        });

        a.kaContentType = type;
    },

    /**
     * @return {jarves.Window}
     */
    getWin: function() {
        return this.getContentField().getWin();
    },

    /**
     *
     * @param {Element} element
     */
    selectElement: function(element) {
        this.select(element.kaContentInstance);
    },

    getSelected: function() {
        return this.lastContent;
    },

    /**
     *
     * @param {jarves.Content} content
     */
    openInspector: function(content) {
        if (this.lastInspectorContent === content) return;

        if (this.inspector) {
            this.closeInspector();
        }

        this.inspector = new Element('div', {
            'class': 'jarves-Editor-inspector'
        });

        this.inspector.inject(this.getContentField().getWin());

        this.inspector.addEvent('click', function(e) {
            e.stop();
        });

        var type = content.getCurrentType();
        var clazz = jarves.ContentTypes[type] || jarves.ContentTypes[type.capitalize()];

        var title = 'Content Element';
        var iconClass = '';
        if (clazz) {
            title = clazz.label;
            iconClass = clazz.icon;
        }

        this.inspectorTitle = new Element('h3', {
            'class': 'light ' + iconClass + ' jarves-Editor-inspector-title',
            text: tf('%s - Settings', title)
        }).inject(this.inspector);

        this.inspectorContainer = new Element('div').inject(this.inspector);

        this.inspectorActionBar = new Element('div', {
            'class': 'jarves-ActionBar'
        }).inject(this.inspector);

        this.inspectorCancelButton = new jarves.Button(t('Cancel')).inject(this.inspectorActionBar);
        this.inspectorSaveButton = new jarves.Button(t('Apply')).setButtonStyle('blue').inject(this.inspectorActionBar);

        this.inspectorCancelButton.addEvent('click', this.closeInspector.bind(this, null));
        this.inspectorSaveButton.addEvent('click', this.applyInspector.bind(this));

        this.inspector.makeDraggable({
            handle: this.inspectorTitle
        });

        content.initInspector(this.getInspectorContainer());

        this.lastInspectorContent = content;
        this.updateInspectorPosition();
        this.inspector.addClass('jarves-Editor-inspector-visible');
    },

    applyInspector: function() {
        this.lastInspectorContent.applyInspector();
        this.closeInspector(true);
    },

    updateInspectorPosition: function() {
        var win = this.getContentField().getWin();
        var winSize = document.id(win).getSize();
        var contentElement = document.id(this.lastInspectorContent);
        var contentPosition = contentElement.getPosition();
        contentPosition.y += this.getContentField().getFrame().getPosition(win).y; //relative to current window
        if ('iframe' === this.getContentField().getFrame().get('tag')) {
            contentPosition.y -= this.getContentField().getFrame().contentWindow.document.body.getScroll().y;
        }
        var contentSize = document.id(this.lastInspectorContent).getSize();
        var inspectorSize = this.inspector.getSize();

        var positionTop = contentPosition.y - 20;
        var positionLeft = contentPosition.x + contentSize.x - 20;

        if (positionTop+inspectorSize.y > winSize.y) {
            positionTop = positionTop - (positionTop+inspectorSize.y - winSize.y)
        }

        if (positionTop < 0) positionTop = 0;

        if (positionLeft + inspectorSize.x > winSize.x) {
            //fit left side?
            if (inspectorSize.x < contentPosition.x) {
                positionLeft = contentPosition.x - inspectorSize.x - 20;
            } else {
                //nope, doesnt fit. Move to very right minus some padding
                positionLeft = winSize.x - inspectorSize.x - 20;
            }
        }

        this.inspector.setStyle('top', positionTop);
        this.inspector.setStyle('left', positionLeft);
    },

    closeInspector: function(fromApply) {
        if (!this.isInspectorVisible()) return;

        this.inspector.removeClass('jarves-Editor-inspector-visible');
        if (!fromApply) {
            this.lastInspectorContent.cancelInspector();
        }
        delete this.lastInspectorContent;
        this.inspector.destroy();
    },

    /**
     * @returns {jarves.Content}
     */
    getCurrentInspectorContentObject: function() {
        return this.lastInspectorContent;
    },

    /**
     * @returns {HTMLElement}
     */
    getInspectorContainer: function() {
        return this.inspectorContainer;
    },

    /**
     * @returns {HTMLElement}
     */
    getInspector: function() {
        return this.inspector;
    },

    /**
     * @returns {boolean}
     */
    isInspectorVisible: function() {
        return this.inspector && this.inspector.hasClass('jarves-Editor-inspector-visible');
    },

    /**
     * @param {jarves.Content} content
     */
    select: function(content) {
        if (this.lastContent === content) return;

        this.deselect();
//
//        this.inspectorContainer.setStyle('color');
//        this.inspectorContainer.setStyle('text-align');
//
//        if (content.value) {
//            this.inspectorTitle.set('text', tf('Inspector (%s)', content.value.type));
//        } else {
//            this.inspectorTitle.set('text', t('Inspector'));
//        }
        content.setSelected(true);

        this.lastContent = content;
    },


    deselect: function() {
        if (this.lastContent) {
            this.lastContent.setSelected(false);
            delete this.lastContent;
        }

//        this.nothingSelected();
    },

    getId: function() {
        return this.options.id;
    },

    getNode: function() {
        return this.options.node;
    },

    getNodeId: function() {
        return this.options.node.id;
    },

    getTheme: function() {
        return this.options.node.theme || this.options.domain.theme;
    },

    getLayout: function() {
        return this.options.node.layout;
    },

    getDomainId: function() {
        return this.options.node.domainId;
    },

    onOver: function(event, element) {
        if (this.lastHoveredContentInstance) {
            this.lastHoveredContentInstance.onOut();
        }

        if (element.getDocument().body.hasClass('jarves-editor-dragMode')) {
            return;
        }

        if (element && element.kaContentInstance) {
            element.kaContentInstance.onOver(event);
            this.lastHoveredContentInstance = element.kaContentInstance;
        }
    },

    onOut: function(event, element) {
        if (element && element.kaContentInstance) {
            element.kaContentInstance.onOut(event);
            delete this.lastHoveredContentInstance;
        }
    },

    adjustAnchors: function() {

        var params = {
            '_jarves_editor': 1,
            '_jarves_editor_id': this.options.id,
            '_jarves_editor_domain': this.options.domain.id,
            '_jarves_editor_options': {
                standalone: this.options.standalone
            }
        };
        params = Object.toQueryString(params);

        this.container.getElements('a').each(function(a) {
            if (a.href) {
                a.href = a.href + ((a.href.indexOf('?') > 0) ? '&' : '?') + params
            }
        }.bind(this));
    },

    /**
     *
     * @param {jarves.ProgressWatchManager} saveManager
     * @returns {Array}
     */
    getValue: function(saveManager) {
        this.slots = this.container.getElements('.jarves-slot');

        var contents = [];
        Array.each(this.slots, function(slot) {
            if (slot.kaSlotInstance) {
                contents = contents.concat(slot.kaSlotInstance.getContents());
            }
        });

        contents.each(function(content) {
            content.editorProgressWatch = saveManager.newProgressWatch({
            }, content);
        });

        contents.each(function(content) {
             content.getValue(content.editorProgressWatch);
        });

//        var resultManager = new jarves.ProgressWatchManager({
//            onDone: function(progressWatch) {
//                contents = contents.concat(progressWatch.getValue());
//            },
//            onAllDone: function() {
//                saveManager.allDone(contents);
//            },
//            onAllProgress: function(progress) {
//                saveManager.allProgress(progress);
//            }
//        });
//
//        Array.each(this.slots, function(slot) {
//            if (slot.kaSlotInstance) {
//                slot.editorProgressWatch = resultManager.newProgressWatch();
//            }
//        });
//
//        Array.each(this.slots, function(slot) {
//            if (slot.kaSlotInstance) {
//                slot.kaSlotInstance.getValue(slot.editorProgressWatch);
//            }
//        });
//
//        return contents;
    },

    setValue: function(contents) {
        var boxContents = {};

        if ('array' === typeOf(contents)) {
            Array.each(contents, function(content) {
                if (!boxContents[content.boxId]) {
                    boxContents[content.boxId] = [];
                }

                boxContents[content.boxId].push(content);
            });
        }

        Array.each(this.slots, function(slot) {
            var instance = slot.kaSlotInstance;
            if (instance) {
                instance.setValue(boxContents[instance.getBoxId()] || null);
            }
        });
    },

    deactivateLinks: function(container) {

        if (!this.deactivateLinkFn) {
            this.deactivateLinkFn = function(event){
                event.stop();
            };
        }
        (container || this.container).addEvent('click:relay(a)', this.deactivateLinkFn);
    },

    activateLinks: function(container) {
        (container || this.container).removeEvent('click:relay(a)', this.deactivateLinkFn);
    },

    setContentField: function(contentField) {
        this.contentField = contentField;
    },

    /**
     * @returns {jarves.FieldTypes.Content}
     */
    getContentField: function() {
        return this.contentField;
    },

    getUrl: function() {
        return _pathAdmin + 'object/jarves/node/' + this.options.node.id + '?_method=patch';
    },

    save: function() {
        if (this.lastSaveRq) {
            this.lastSaveRq.cancel();
        }

        var contents = this.getValue();

        this.lastSaveRq = new Request.JSON({url: this.getUrl(), onComplete: function(pResponse) {

        }.bind(this)}).post({content: contents});
    },

    highlightSave: function(pHighlight) {
        if (this.saveBtn) {
            if (!pHighlight && this.lastTimer) {
                clearInterval(this.lastTimer);
                delete this.lastTimer;
                this.saveBtn.tween('color', '#ffffff');
                return;
            } else if (this.lastTimer) {
                return;
            }

            this.timerIdx = 0;

            this.lastTimer = (function() {
                if (++this.timerIdx % 2) {
                    this.saveBtn.tween('color', '#2A8AEC');
                } else {
                    this.saveBtn.tween('color', '#ffffff');
                }
            }).periodical(500, this);
        }
    },

    setPreview: function(visible) {
        var currentHeight = this.container.getSize().y;
        var currentScroll = this.container.getScroll();
        this.container.setStyle('height', currentHeight);

        var progressWatchManager = new jarves.ProgressWatchManager({
            allDone: function() {
                (function() {
                    this.container.setStyle('height');
                    this.container.scroll(currentScroll.x, currentScroll.y);
                }.bind(this)).delay(300);
            }.bind(this)
        });

        var watcher = {};

        Array.each(this.slots, function(slot, idx) {
            watcher[idx] = progressWatchManager.newProgressWatch();
        });

        Array.each(this.slots, function(slot, idx) {
            slot.kaSlotInstance.setPreview(visible, watcher[idx]);
        });
    },

    searchSlots: function() {
        this.slots = this.container.getElements('.jarves-slot');

        Array.each(this.slots, function(slot) {
            this.initSlot(slot);
        }.bind(this));
    },

    hasChanges: function() {
        this.slots = this.container.getElements('.jarves-slot');

        var hasChanges = false;

        Array.each(this.slots, function(slot) {
            if (slot.kaSlotInstance) {
                hasChanges |= slot.kaSlotInstance.hasChanges();
            }
        });

        return hasChanges;
    },

    checkChange: function() {
        this.highlightSave(this.hasChanges());
    },

    initSlot: function(domSlot) {
        domSlot.slotInstance = new jarves.Slot(domSlot, this.options, this);
        domSlot.slotInstance.addEvent('change', this.checkChange);
    }

});