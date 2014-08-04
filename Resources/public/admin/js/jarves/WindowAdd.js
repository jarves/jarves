jarves.WindowAdd = new Class({
    Extends: jarves.WindowEdit,

    initialize: function(win, container, options) {
        this.windowAdd = true;
        this.parent(win, container, options);
    },

    loadItem: function() {

        //ist in render() am ende also lösche unnötigen balast
        this.win.setLoading(false);

        this.removeBtn.hide();

        if (this.previewBtn) {
            this.previewBtn.hide();
        }
        if (this.showVersionsBtn) {
            this.showVersionsBtn.hide();
        }
        if (this.resetBtn) {
            this.resetBtn.hide();
        }

        this.openAddItem();
        this.fieldForm.resetPatch();

        var first = this.fieldForm.getFirstField();
        if (first) {
            first.focus();
        }
    },

    /**
     * Opens a first step overlay, that points then to the actual form if only nestedAddWithPositionSelection is set.
     * If addMultiple is set, we use $addMultipleFields $addMultipleFixedFields for the insertion and ignore the
     * actual form.
     * If nothing is set, this method does nothing.
     *
     */
    openAddItem: function() {

        if ((this.classProperties.asNested && this.classProperties.nestedAddWithPositionSelection) || this.classProperties.addMultiple) {

            //show dialog with
            this.createNewFirstDialog();


            this.addItemLayout = new jarves.LayoutHorizontal(this.addDialogFieldContainer, {
                columns: [null, this.classProperties.addMultipleFieldContainerWidth]
            });
            new jarves.LayoutSplitter(this.addItemLayout.getColumn(1), 'right');

            if (this.classProperties.addMultiple) {
                if (this.tabPane) {
                    this.tabPane.hide();
                }

                if (this.classProperties.nestedAddWithPositionSelection) {

                    this.addDialogLayoutPositionChooser = this.addNestedObjectPositionChooser(this.addItemLayout.getColumn(1));

                    this.addDialogFieldContainerNested = new Element('div', {
                        'style': 'position: absolute; left: 6px; top: 0; right: 0; bottom: 0; overflow: auto;'
                    }).inject(this.addItemLayout.getColumn(2));

                    this.populateAddMultipleForm(this.addDialogFieldContainerNested);
                } else {
                    this.populateAddMultipleForm(this.addDialogFieldContainer);
                }
            } else {
//                this.addDialogFieldContainer.setStyle('position', 'relative');
                this.addDialogLayoutPositionChooser = this.addNestedObjectPositionChooser(this.addItemLayout.getColumn(1));
                this.form.inject(this.addItemLayout.getColumn(2));

                this.addItemLayout.getColumn(1)
            }

            if (this.addDialogLayoutPositionChooser) {

                this.addDialogLayoutPositionChooser.addEvent('positionChoose', function(dom, direction, pk, chooser, tree) {
                    this.addItemToAdd = {
                        position: direction == 'after' ? 'next' : 'first',
                        pk: pk,
                        objectKey: dom.objectKey,
                        tree: tree
                    };
                    this.checkAddItemForm();
                }.bind(this));

            }

            //            if (!this.classProperties.addMultiple && this.classProperties.nestedAddWithPositionSelection) {

            //                this.openAddItemNextButton = new jarves.Button(tc('addNestedObjectChoosePositionDialog', t('Next')))
            //                    .inject(this.openAddItemPageBottom);
            //
            //                this.openAddItemNextButton.setButtonStyle('blue');
            //                this.openAddItemNextButton.setEnabled(false);

            //            } else

            //            if (this.classProperties.addMultiple) {
            //
            //                this.openAddItemSaveButton = new jarves.Button(tc('addMultipleItems', t('Add')))
            //                    .addEvent('click', function () {
            //                        this.multipleAdd();
            //                    }.bind(this))
            //                    .inject(this.openAddItemPageBottom);
            //
            //                this.openAddItemSaveButton.setButtonStyle('blue');
            //                //this.openAddItemSaveButton.setEnabled(false);
            //            }

            this.renderSelectPositionText();

        }
    },

    multipleAdd: function(pClose) {

        if (!this.addMultipleFieldForm.checkValid()) {
            return false;
        }

        var request = this.addMultipleFieldForm.getValue();

        this.saveBtn.startLoading(t('Adding ...'));
        if (this.lastAddRq) {
            this.lastAddRq.cancel();
        }

        request._multiple = true;

        if (this.addItemToAdd) {
            request._position = this.addItemToAdd.position;
            request._pk = this.addItemToAdd.pk;
            request._targetObjectKey = this.addItemToAdd.objectKey;
        }

        this.lastAddRq = new Request.JSON({url: _pathAdmin + this.getEntryPoint() + '/:multiple',
            noErrorReporting: [
                'Jarves\\Exceptions\\Rest\\ValidationFailedException',
                'DuplicateKeysException',
                'ObjectItemNotModified'
            ],
            noCache: true,
            onProgress: function(event) {
                this.saveBtn.setProgress(parseInt(event.loaded / event.total * 100));
            }.bind(this),
            onFailure: this.handleFailure.bind(this),
            onSuccess: function(response) {

                var error_found = false;
                var rows_to_destroy = [];
                var errors = [];
                Array.each(response.data, function(result, index) {
                   if (result.error) {
                       result.error.index = index;
                       errors.push(result.error);
                       error_found = true;
                   } else {
                       rows_to_destroy.push(index);
                   }
                });

                Array.each(rows_to_destroy.reverse(), function(index) {
                    this.addMultipleFieldForm.getField('_items').getFieldObject().removeRow(index);
                }.bind(this));

                if (error_found) {
                    var div = new Element('div');
                    new Element('h2', {text: t('There was a error in one of your values.')}).inject(div);
                    new Element('div', {
                        text: t('Valid values has been removed from the form. Please review the existing ones.')
                    }).inject(div);

                    Array.each(errors, function(error){
                        new Element('h3', {
                            text: '#'+error.index+': '+error.exception
                        }).inject(div);
                        new Element('div', {
                            text: error.message,
                            style: 'border-bottom: 1px solid #ddd; margin-bottom: 5px; padding-bottom: 5px;'
                        }).inject(div);
                    });
                    this.win.alert(div);

                    this.saveBtn.failedLoading(t('Failed'));
                    return;
                }

                this.winParams.item = response.data[0]; //our new primary keys for the first item

                this.saveBtn.doneLoading(t('Saved'));

                if (this.classProperties.loadSettingsAfterSave == true) {
                    jarves.loadSettings();
                }

                var args = [request, response];
                if (this.addItemToAdd) {
                    args.push(this.addItemToAdd.tree);
                }
                this.fireEvent('addMultiple', args);

                window.fireEvent('softReload', this.getEntryPoint());

                if (pClose) {
                    this.win.close();
                }

            }.bind(this)}).post(request);
    },

    renderSelectPositionText: function() {

        if (this.classProperties.nestedAddWithPositionSelection) {
            this.selectPositionText = new Element('div', {
                text: t('Select the position of your new entries!'),
                style: 'position: absolute; top: 0px; left: 5px; color: gray;'
            }).inject(this.openAddItemPageBottom);

            this.addDialogLayoutPositionChooser.addEvent('positionChoose', function() {
                this.selectPositionText.setStyle('display', 'none');
            }.bind(this));

            this.addDialogLayoutPositionChooser.addEvent('positionChoose', function() {
                this.selectPositionText.setStyle('display', 'none');
            }.bind(this));
        }

    },

    checkAddItemForm: function() {
        var valid = true;

        if (!this.addItemToAdd) {
            valid = false;
        }

        if (this.classProperties.addMultiple) {
            if (this.addMultipleFieldForm && !this.addMultipleFieldForm.isValid()) {
                valid = false;
            }

            if (this.saveBtn) {
                this.saveBtn.setEnabled(valid);
            }
        }
    },

    populateAddMultipleForm: function(pContainer) {
        var fields = {};

        if (typeOf(this.classProperties.addMultipleFixedFields) == 'object' && Object.getLength(this.classProperties.addMultipleFixedFields) > 0) {

            Object.each(this.classProperties.addMultipleFixedFields, function(item, key) {
                fields[key] = item;
            });

        }

        if (typeOf(this.classProperties.addMultipleFields) == 'object' && Object.getLength(this.classProperties.addMultipleFields) > 0) {

            fields._items = {
                label: t('Values per entry'),
                type: 'array',
                width: 'auto',
                withOrder: true,
                startWith: 1,
                columns: [],
                fields: {}
            };

            Object.each(this.classProperties.addMultipleFields, function(item, key) {

                var column = {};
                column.label = item.label;
                column.desc = item.desc;
                column.width = item.width;

                if (item.required && (typeOf(item.withAsteriskIfRequired) == 'null' || item.withAsteriskIfRequired)) {
                    column.label += '*';
                }

                fields._items.columns.push(column);

                fields._items.fields[key] = item;
            });

        }

        this.addMultipleFieldForm = new jarves.FieldForm(pContainer, fields, {
            onChange: this.checkAddItemForm.bind(this)
        });
    },

    createNewFirstDialog: function() {

        this.addNestedAddPage = new Element('div', {
            'class': 'jarves-windowEdit-form-addDialog'
        }).inject(this.container);

        this.addDialogLayout = new jarves.LayoutVertical(this.addNestedAddPage, {
            rows: [null, 40],
            gridLayout: true
        });

        this.addDialogFieldContainer = this.addDialogLayout.getContentRow(1);

        this.openAddItemPageBottom = new Element('div', {
            'class': 'jarves-Window-win-buttonBar'
        }).inject(this.addDialogLayout.getContentRow(2));

    },

    addNestedObjectPositionChooser: function(pContainer) {
        var objectOptions = {};
        var fieldObject;

        objectOptions.type = 'tree';
        objectOptions.object = this.classProperties.object;
        objectOptions.scopeChooser = false;
        objectOptions.noWrapper = true;
        objectOptions.selectable = false;
//        objectOptions.moveable = this.classProperties.nestedMoveable;
        objectOptions.moveable = false;

        var lastSelected;

        var choosePosition = function(pChooser, pDom, pDirection, pItem, pTree) {
            if (lastSelected) {
                lastSelected.removeClass('jarves-objectTree-positionChooser-item-active');
            }

            lastSelected = pChooser;
            lastSelected.addClass('jarves-objectTree-positionChooser-item-active');

            fieldObject.fireEvent('positionChoose', [pDom, pDirection, pItem, pChooser, pTree]);
        };

        var addChooser = function(pDom, pDirection, pItem, pTree) {
            var div;

            if (pDirection != 'into') {
                if (pDom.childrenContainer && pDom.childrenContainer.insertedAddChooserAfter) {
                    return;
                }

                div = new Element('div', {
                    styles: {
                        paddingLeft: pDom && pDom.getStyle ? pDom.getStyle('padding-left').toInt() + 18 : 18
                    }
                }).inject(pDom.childrenContainer, 'first' === pDirection ? null : pDirection);

                pDom.childrenContainer.insertedAddChooserAfter = true;
            } else {
                if (pDom.insertedAddChooser || !pDom.span) {
                    return;
                }
                div = pDom.span;
                pDom.insertedAddChooser = true;
            }

            var a = new Element('a', {
                html: ' <------ &nbsp;&nbsp;',
                'class': 'jarves-objectTree-positionChooser-item',
                href: 'javascript:;',
                style: 'text-decoration: none;'
            }).addEvent('click',function() {
                    choosePosition(this, pDom, pDirection, pItem, pTree);
                }).inject(div);
            var span = new Element('span', {
                'class': 'jarves-objectTree-positionChooser-item-text',
                text: pDirection == 'into' ? tc('addNestedObjectChoosePositionDialog', 'Into this!') : tc('addNestedObjectChoosePositionDialog', 'Add here!')
            }).inject(a);

            if ('object' === typeOf(pDom) && 'into' === pDirection) {
                //we have no entries, make this as default
                choosePosition(a, pDom, pDirection, pItem, pTree);
                span.setStyle('padding', '25px');
                span.set('text', tc('addNestedObjectChoosePositionDialog', 'This is the first entry.'));
            }

            return div;
        };

        objectOptions.onChildrenLoaded = function(pItem, pDom, pTree) {
            if (pDom && pDom.childrenContainer) {
                var children = pDom.childrenContainer.getChildren('.jarves-objectTree-item');
                if (children.length > 0) {
                    pDom.childrenContainer.getChildren('.jarves-objectTree-item').each(function(item) {
                        addChooser(item, 'after', item.objectEntry, pTree);
                        addChooser(item, 'into', item.objectEntry, pTree);
                    });
                }
            }

            if (pDom) {
                addChooser(pDom, 'into', pDom.objectEntry, pTree);
            }
        }.bind(this);

        objectOptions.onReady = function(tree) {
            if (tree.isEmpty()) {
                if (tree.addPlacerSet) return;
                addChooser({span: tree.paneObjects}, 'into', null, tree);
                tree.addPlacerSet = true;
            }
        };

        if (this.languageSelect) {
            objectOptions.scopeLanguage = this.languageSelect.getValue();
        }

        var treeContainer = new Element('div', {
            style: 'position: absolute; left: 0; right: 0; top: 0; bottom: 0; overflow: auto;'
        }).inject(pContainer);

        fieldObject = new jarves.Field(objectOptions, treeContainer);
        return fieldObject;

    },

    nestedItemSelected: function(pItem, pDom) {
        //pDom.objectKey
        //pDom.id

        if (pDom.objectKey == this.classProperties.object) {

            if (_this.classProperties.edit) {

                jarves.entrypoint.open(jarves.entrypoint.getRelative(_this.getEntryPoint(), _this.classProperties.editEntrypoint), {
                    item: pItem.values
                }, this);

            }

        } else if (this.classProperties.nestedRootEdit) {
            var entryPoint = jarves.entrypoint.getRelative(this.getEntryPoint(), this.classProperties.nestedRootEditEntrypoint);
            jarves.entrypoint.open(entryPoint);
        }

    },

    save: function(pClose) {

        if (this.lastSaveRq) {
            this.lastSaveRq.cancel();
        }

        if (this.classProperties.addMultiple) {
            return this.multipleAdd();
        }

        var request = this.buildRequest();
        if (typeOf(request) != 'null') {

            if (this.addItemToAdd) {
                request._position = this.addItemToAdd.position;
                request._pk = this.addItemToAdd.pk;
                request._targetObjectKey = this.addItemToAdd.objectKey;
            }


            this.saveBtn.startLoading(t('Adding ...'));

            this.lastSaveRq = new Request.JSON({url: _pathAdmin + this.getEntryPoint()+'/',
                noCache: true,
                noErrorReporting: [
                    'Jarves\\Exceptions\\Rest\\ValidationFailedException',
                    'DuplicateKeysException',
                    'ObjectItemNotModified'
                ],
                progressButton: this.saveBtn,
                onFailure: this.handleFailure.bind(this),
                onSuccess: function(response) {
                    if (typeOf(response.data) == 'object') {
                        this.winParams.item = response.data; //our new primary keys
                    } else {
                        this.winParams.item = jarves.getObjectPk(this.classProperties['object'], request); //maybe we changed some pk
                    }

                    this.saveBtn.doneLoading(t('Added'));

                    if (this.classProperties.loadSettingsAfterSave == true) {
                        jarves.loadSettings();
                    }

                    var args = [request, response];
                    if (this.addItemToAdd) {
                        args.push(this.addItemToAdd.tree);
                    }
                    this.fireEvent('add', args);

                    jarves.getAdminInterface().objectChanged(this.classProperties['object']);

                    if ((!pClose || this.inline ) && this.classProperties.versioning == true) {
                        this.loadVersions();
                    }
                }.bind(this)}).post(request);
        }
    }

});
