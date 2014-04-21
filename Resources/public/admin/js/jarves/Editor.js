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

    /**
     *
     * @param {Object} options
     * @param {Element} container
     * @param {jarves.FieldAbstract} [contentField]
     */
    initialize: function(options, container, contentField) {
        this.setOptions(options);

        this.contentField = contentField;
        this.container = document.id(container || document.documentElement);

        this.searchSlots();

        this.container.addEvent('click:relay(.jarves-content-placer)', this.clickPlacer.bind(this));
        this.container.addEvent('click:relay(.jarves-content)', this.click.bind(this));
        this.container.addEvent('mousemove', this.mouseMove.bind(this));
        top.window.fireEvent('jarvesEditorLoaded', this);

        document.id(this.contentField.getWin().getMainLayout()).addEvent('click', this.click.bind(this));
    },

    getContainer: function() {
        return this.container;
    },

    mouseMove: function(e) {
        if (this.lastCheckPlacerTimer) {
            clearTimeout(this.lastCheckPlacerTimer);
        }

        this.lastCheckPlacerTimer = this.checkPlacer.delay(10, this, [e]);
    },

    getNodeId: function() {
        if (this.getContentField() && this.getContentField().getNodeId) {
            return this.getContentField().getNodeId();
        }
    },

    getDomainId: function() {
        if (this.getContentField() && this.getContentField().getDomainId) {
            return this.getContentField().getDomainId();
        }
    },

    checkPlacer: function(e) {
        this.placerDimensions = [];
        Array.each(this.container.getElements('.jarves-content-placer'), function(placer) {
            this.placerDimensions.push({
                dimension: placer.getElement('a.jarves-content-placer-place').getCoordinates(this.container.documentElement),
                element: placer
            });
        }.bind(this));

        var range = 25;
        var posY = e.page.y;
        var posX = e.page.x;

        Array.each(this.placerDimensions, function(placer) {
            var valid = true;

            valid &= placer.dimension.top-range < posY;
            valid &= placer.dimension.left-range < posX;
            valid &= placer.dimension.right+range > posX;
            valid &= placer.dimension.bottom+range > posY;

            if (valid) {
                placer.element.addClass('jarves-content-placer-visible');
            } else {
                placer.element.removeClass('jarves-content-placer-visible');
            }
        });
    },

    click: function(e, element) {
        if (element) {
            e.stopPropagation();
            this.disableNextContainerClick = true;
            this.selectElement(element);

            //forward click to parent document
            var evObj = document.createEvent('MouseEvents');
            evObj.initMouseEvent('click', true, false);
            document.body.dispatchEvent(evObj);
        } else if (!this.disableNextContainerClick) {
            this.deselect();
        } else {
            delete this.disableNextContainerClick;
        }

        if (this.inspector) {
            this.closeInspector();
        }
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
     * @param {jarves.Slot} slot
     * @param {Element} placerElement
     * @param {Array} [limitTypes]
     */
    showAddContent: function(slot, placerElement, limitTypes) {
        var dialog = new jarves.Dialog(null, {
            autoClose: true,
            maxWidth: 520
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

        contentPosition.y += this.getContentField().getContainerOffsetY();

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

    /**
     * @returns {Array}
     */
    getValue: function() {
        var value = [];
        Array.each(this.slots, function(slot) {
            if (slot.kaSlotInstance) {
                value = value.concat(slot.kaSlotInstance.getValue());
            }
        });

        return value;

    },

    /**
     * @param {jarves.ProgressWatchManager} saveManager
     */
    save: function(saveManager) {
        var contents = [];
        Array.each(this.slots, function(slot) {
            if (slot.kaSlotInstance) {
                contents = contents.concat(slot.kaSlotInstance.getContents()); //merges so we have one big contents array
            }
        });

        if (0 === contents.length) {
            saveManager.allSuccess();
            return;
        }

        contents.each(function(content) {
            content.editorProgressWatch = saveManager.newProgressWatch({}, content);
        });

        contents.each(function(content) {
             content.save(content.editorProgressWatch);
        });
    },

    setValue: function(contents) {
        var boxContents = {};

        if ('array' === typeOf(contents)) {
            contents.sortOn('sort');
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
        if (this.options.standalone) {
            this.highlightSave(this.hasChanges());
        }
    },

    initSlot: function(domSlot) {
        domSlot.slotInstance = new jarves.Slot(domSlot, this.options, this);
        domSlot.slotInstance.addEvent('change', this.checkChange);
    }

});