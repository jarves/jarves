jarves.Content = new Class({
    Extends: jarves.Base,
    Binds: ['onOver', 'onOut', 'remove', 'fireChange'],

    drop: null,

    /**
     * @var {jarves.ContentAbstract}
     */
    contentObject: null,
    currentType: null,
    currentTemplate: null,

    boxId: null,
    sortableId: null,

    contentContainer: null,

    /**
     *
     * @param {*} value
     * @param {Element} container
     * @param {Array} drop
     */
    initialize: function(value, container, drop) {
        this.drop = drop;
        this.renderLayout(container);
        this.setValue(value);

        this.clipboardListener = this.showPasteState.bind(this);
        window.addEvent('clipboard', this.clipboardListener);
    },

    getSlot: function() {
        return this.main.getParent('.jarves-slot').kaSlotInstance;
    },

    /**
     * @returns {jarves.Editor}
     */
    getEditor: function() {
        return this.getSlot().getEditor();
    },

    setBoxId: function(boxId) {
        this.boxId = boxId;
    },

    setSortId: function(sortableId) {
        this.sortId = sortableId;
    },

    getBoxId: function() {
        return this.boxId;
    },

    getSortId: function() {
        return this.sortId;
    },

    /**
     * Returns the actual contentType from jarves.ContentTypes.*
     *
     * @returns {jarves.ContentAbstract}
     */
    getContentObject: function() {
        return this.contentObject;
    },

    renderLayout: function(container) {
        this.main = new Element('div', {
            'class': 'jarves-content '
        }).inject(container);

        this.main.addListener('dragstart', function(e) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('application/json', JSON.encode(this.getValue()));
            //this.main.set('draggable');
        }.bind(this));

        this.main.addListener('dragend', function(e) {
            if ('move' === e.dataTransfer.dropEffect) {
                this.destroy();
            }
        }.bind(this));

        this.main.kaContentInstance = this;

        this.actionBar = new Element('div', {
            'class': 'jarves-normalize jarves-content-actionBar'
        }).inject(this.main);

        this.contentWrapper = new Element('div', {
            'class': 'jarves-content-wrapper'
        }).inject(this.main);

        this.placer = new Element('div', {
            'class': 'jarves-content-placer'
        }).inject(this.main);

        new Element('a', {
            text: '+',
            'class': 'jarves-content-placer-place'
        }).inject(this.placer);

        this.addActionBarItems();
    },

    destroy: function() {
        if (this === this.getEditor().getSelected()) {
            this.getEditor().deselect();
        }
        this.getContentObject().destroy();
        this.main.destroy();
        window.removeEvent('clipboard', this.clipboardListener);
    },

    fireChange: function() {
        this.updateUI();
        this.fireEvent('change');
    },

    addActionBarItems: function() {
        this.typeIcon = new Element('span', {
            'class': 'jarves-content-actionBar-typeIcon'
        }).inject(this.actionBar);

        var inspectorBtn = new Element('a', {
            'class': 'icon-wrench',
            href: 'javascript: ;',
            title: t('Open Settings')
        }).addEvent('click', function(e) {
            e.stop();
            this.getEditor().openInspector(this);
        }.bind(this)).inject(this.actionBar);

        var moveBtn = new Element('span', {
            html: '&#xe0c6;',
            'class': 'icon jarves-content-actionBar-move',
            title: t('Move content')
        }).inject(this.actionBar);

        moveBtn.addEvent('mouseover', function() {
            this.main.set('draggable', true);
        }.bind(this));

        moveBtn.addEvent('mouseout', function() {
            this.main.set('draggable');
        }.bind(this));

        new Element('a', {
            href: 'javascript: ;',
            title: t('Copy content'),
            'class': 'icon-copy'
        }).addEvent('click', function(e) {
                e.stop();
                jarves.setClipboard('Content', 'content', this.getValue());
            }.bind(this)).inject(this.actionBar);

        this.actionBarItemVisibility = new Element('a', {
            href: 'javascript: ;',
            title: t('Hide/Show'),
            'class': 'icon-eye'
        }).addEvent('click', function(e) {
                e.stop();
                this.toggleVisibility();
            }.bind(this)).inject(this.actionBar);

        this.actionBarItemPaste = new Element('a', {
            href: 'javascript: ;',
            title: t('Paste content'),
            'class': 'icon-arrow-down-11'
        }).addEvent('click', function(e) {
                e.stop();
                if (jarves.isClipboard('content')) {
                    var value = jarves.getClipboard().value;
                    if (value.id) {
                        delete value.id;
                    }
                    var content = this.getSlot().addContent(value);
                    content.inject(this, 'after');
                }
            }.bind(this)).inject(this.actionBar);

        new Element('a', {
            html: '&#xe26b;',
            href: 'javascript: ;',
            title: t('Remove content'),
            'class': 'icon'
        }).addEvent('click', function(e) {
                e.stop();
                this.remove();
            }.bind(this)).inject(this.actionBar);

    },

    showVisibilityState: function() {
        var opacity = this.value.hide ? 0.5 : null;

        this.actionBarItemVisibility.setStyle('opacity', opacity);
        this.main.getChildren().setStyle('opacity', opacity);
        this.actionBar.setStyle('opacity', null);
    },

    showPasteState: function() {
        var opacity = !jarves.isClipboard('content') ? 0.5 : null;
        this.actionBarItemPaste.setStyle('opacity', opacity);
    },

    toggleVisibility: function() {
        this.value.hide = !this.value.hide;

        this.updateUI();
    },

    remove: function() {
        this.getEditor().deselect();
        this.main.destroy();
    },

    /**
     *
     * @returns {Element}
     */
    getContentContainer: function() {
        return this.contentContainer;
    },

    /**
     * @param {Boolean} visible
     * @param {jarves.ProgressWatch} progressWatch
     */
    setPreview: function(visible, progressWatch) {
        if (!this.getContentObject().isPreviewPossible()) {
            return false;
        }

        this.preview = visible;
        this.updateUI();
    },

    /**
     * @param {jarves.ProgressWatch} [progressWatch]
     */
    loadPreview: function(progressWatch) {
        if (!this.getContentObject().isPreviewPossible()) {
            return false;
        }
        delete this.currentTemplate;

        var value;

        if (this.isOpenInspector()) {
            value = this.getPreviewValue();
        } else {
            value = this.getValue();
        }

        if (this.lastRq) {
            this.lastRq.cancel();
        }

        var req = Object.toQueryString({
            template: value.template,
            type: value.type,
            nodeId: this.getEditor().getNodeId(),
            domainId: this.getEditor().getDomainId()
        });

//        this.getEditor().deactivateLinks(this.contentContainer);
        this.lastRq = new Request.JSON({url: _pathAdmin + 'admin/content/preview?' + req, noCache: true,
            onFailure: function() {
                this.contentWrapper.set('html', '-- loading preview failed --');
                if (progressWatch) {
                    progressWatch.error();
                }
            }.bind(this),
            onComplete: function(response) {
                this.contentContainer.dispose();
                this.contentWrapper.set('html', response.data);

                if (progressWatch) {
                    progressWatch.done();
                }
            }.bind(this)}).post({
                content: value.content
            });
    },

    getPreviewValue: function() {
        var contentValue = this.getContentObject().getValue();
        var value = Object.clone(this.value);
        value.template = this.template.getValue();
        value.content = contentValue;

        return value;
    },

    isOpenInspector: function() {
        return this.getEditor().isInspectorVisible() && this.getEditor().getCurrentInspectorContentObject() === this;
    },

    /**
     * @param {jarves.ProgressWatch} [progressWatch]
     */
    loadTemplate: function(progressWatch) {
        var value;

        if (this.isOpenInspector()) {
            value = this.getPreviewValue();
        } else {
            value = this.getValue();
        }

        if (null !== this.currentTemplate && this.currentTemplate == value.template) {
            if (progressWatch) {
                progressWatch.done();
            }
            return false;
        }

        if (this.lastRq) {
            this.lastRq.cancel();
        }

        this.getEditor().activateLinks(this.main);
        this.lastRq = new Request.JSON({url: _pathAdmin + 'admin/content/template', noCache: true,
            onFailure: function() {
                this.contentWrapper.set('html', ' -- loading tempalte failed --');
                if (progressWatch) {
                    progressWatch.error();
                }
            },
            onComplete: function(response) {
                this.main.setStyle('height', this.main.getSize().y);

                var children = this.contentContainer ? this.contentContainer.getChildren() : new Elements();
                children.dispose();
                this.contentWrapper.set('html', response.data);
                this.contentContainer = this.contentWrapper.getElement('.jarves-content-container') || new Element('div').inject(this.contentWrapper);
                children.inject(this.contentContainer);

                this.currentTemplate = value.template;

                this.main.setStyle.delay(50, this.main, ['height']);

                if (progressWatch) {
                    progressWatch.done();
                }
            }.bind(this)}).get({
                template: value.template,
                type: value.type
            });

        return true;
    },

    focus: function() {
        if (this.contentObject) {
            this.contentObject.focus();
            this.nextFocus = false;
        } else {
            this.nextFocus = true;
        }
    },

    /**
     * @param {jarves.ProgressWatch} [progressWatch]
     *
     * @returns {*}
     */
    getValue: function(progressWatch) {
        if (this.selected) {
            this.value = this.value || {};
        }

        if (this.isOpenInspector()) {
            return this.getPreviewValue();
        }

        if (this.contentObject) {
            this.value.content = this.contentObject.getValue();
        }

        if (progressWatch) {
            var content = this.value;

            var self = this;
            progressWatch.addEvent('preDone', function(sp) {
                self.value.content = sp.getValue();
                self.value.boxId = self.getBoxId();
                self.value.sort = self.getSortId();
                this.setValue(self.value);
            });

            if (this.contentObject) {
                this.contentObject.save(progressWatch);
            }
        }

        return this.value;
    },

    updateUI: function() {
        this.showVisibilityState();
        this.showPasteState();

        if (this.getContentObject().isPreviewPossible()) {
            this.loadPreview();
        } else {
            this.loadTemplate();
        }
    },

    setSelected: function(selected) {
        if (selected) {
            this.main.addClass('jarves-content-selected');
            if (this.contentObject && this.contentObject.selected) {
                this.contentObject.selected();
            }
        } else {
            this.main.removeClass('jarves-content-selected');
            if (this.contentObject && this.contentObject.deselected) {
                this.contentObject.deselected();
            }
        }
        this.selected = selected;
    },

    loadDefaultInspector: function(inspectorContainer) {
        inspectorContainer.empty();

        this.template = new jarves.Field({
            label: t('Content Layout'),
            width: 'auto',
            type: 'contentTemplate',
            inputWidth: '100%'
        }, inspectorContainer);

        this.template.addEvent('change', function() {
            return this.updateUI();
        }.bind(this));

        this.template.setValue(this.value.template || null);

        this.inspectorContainer = new Element('div', {
            style: 'padding-top: 5px;'
        }).inject(inspectorContainer);
    },

    initInspector: function(inspectorContainer) {
        this.loadDefaultInspector(inspectorContainer);

        if (this.contentObject && this.contentObject.initInspector) {
            this.contentObject.initInspector(this.inspectorContainer);
        }
    },

    openInspector: function() {
        this.getEditor().openInspector(this);
    },

    applyInspector: function() {
         if (this.contentObject) {
             this.contentObject.applyInspector();
             this.value.template = this.template.getValue();
             this.value.content = this.getContentObject().getValue();
         }
         this.updateUI();
    },

    cancelInspector: function() {
         if (this.contentObject) {
             this.contentObject.cancelInspector();
             this.contentObject.setValue(this.value.content);
         }
         this.updateUI();
    },

    getCurrentType: function() {
        return this.currentType;
    },

    setValue: function(value) {
        this.value = value;

        if (!this.currentType || !this.contentObject || value.type != this.currentType || !this.currentTemplate || this.currentTemplate != value.template) {

            if (null === this.currentTemplate || this.currentTemplate != value.template) {
                var progressWatch = new jarves.ProgressWatch({
                    onDone: function() {
                        this.setValue(this.value);
                    }.bind(this)
                });
                this.loadTemplate(progressWatch);
                return;
            }

            if (!jarves.ContentTypes) {
                throw 'No jarves.ContentTypes loaded.';
            }

            var clazz = jarves.ContentTypes[value.type] || jarves.ContentTypes[value.type.capitalize()];
            if (clazz) {
                this.contentObject = new clazz(this, this.options);
            } else {
                console.error(tf('jarves.ContentType `%s` not found.', value.type));
            }

            this.contentObject.addEvent('change', this.fireChange);
            this.currentType = value.type;

            if (this.lastAddedIcon) {
                this.typeIcon.removeClass(this.lastAddedIcon);
            }
            this.lastAddedIcon = clazz.icon;
            this.typeIcon.addClass(this.lastAddedIcon);
            this.typeIcon.set('title', clazz.label);

            if (this.contentObject.openInspectorOnInit()) {
                this.openInspector();
            }

            if (this.nextFocus) {
                this.focus();
            }
        }

        this.showVisibilityState();
        this.showPasteState();

        this.contentObject.setValue(value.content);
        this.loadPreview();

        if (this.selected) {
            this.setSelected(true);
        }
    }

});