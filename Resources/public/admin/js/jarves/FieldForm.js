/**
 *
 * jarves.FieldForm - builds forms from jarves.Field definitions.
 *
 * This class handles also the visibility of the children container and
 * the 'needValue' and 'againstField' property.
 *
 * @type {Class}
 */

jarves.FieldForm = new Class({
    Implements: [Events, Options],
    Binds: ['fireChange'],

    /**
     * @var {jarves.Field[]}
     */
    fields: {},

    fieldDefinitions: {},
    forcedVisibility: {},

    options: {
        allTableItems: false,
        allSmall: false,
        tableItemLabelWidth: false,
        returnDefault: false,
        saveButton: false,

        /**
         * If true it returns field values which are empty ('').
         * Otherwise, it is not included in the result object (getValue())
         *
         * @var {Boolean}
         */
        withEmptyFields: true,
        tabsInWindowHeader: false
    },

    /**
     * Constructor
     * @param {Element} container
     * @param {Object} fieldDefinition
     * @param {Object} options
     * @param {Object} pRefs
     */
    initialize: function (container, fieldDefinition, options, pRefs) {
        var self = this;

        this.setOptions(options);
        this.refs = pRefs;
        this.main = document.id(container);
        this.definition = fieldDefinition;

        if (fieldDefinition && 0 < Object.getLength(fieldDefinition)) {
            this.parseLevel(fieldDefinition, this.main);
        }

    },

    /**
     * Returns all field instances from type 'tab'.
     * @return {Object}
     */
    getTabButtons: function () {
        var res = {};

        Object.each(this.definition, function (item, key) {

            if (item.type == 'tab') {
                res[key] = this.fields[key];
            }

        }.bind(this));

        return res;
    },

    /**
     * Returns the main DOM element.
     *
     * @return {Element}
     */
    toElement: function () {
        return this.main;
    },

    /**
     * Fires a change event and handles some internal stuff.
     */
    fireChange: function () {
        this.fireEvent('change', this.getValue());

        if (this.options.saveButton !== false) {
            this.options.saveButton.setEnabled(this.isValid());
        }
    },

    /**
     * Goes through every level and serach for jarves.Field definitions.
     * Parse it, creates the jarves.Field and put'm to this.fields[].
     *
     * @param pLevel
     * @param pContainer
     * @param pDependField
     */
    parseLevel: function (pLevel, pContainer, pDependField) {
        var self = this;

        if (pDependField && !pDependField.children) {
            pDependField.children = {};
        }

        Object.each(pLevel, function (field, id) {

            var obj;
            if ('null' !== typeOf(field.id)) {
                id = field.id;
            }

            //json to objects
            Object.each(field, function (item, itemId) {
                if (typeOf(item) != 'string') {
                    return;
                }
                var newItem = false;

                try {

                    //check if json array
                    if (item.substr(0, 1) == '[' && item.substr(item.length - 1) == ']' &&
                        item.substr(0, 2) != '[[' && item.substr(item.length - 2) != ']]') {
                        newItem = JSON.decode(item);
                    }

                    //check if json object
                    if (item.substr(0, 1) == '{' && item.substr(item.length - 1, 1) == '}') {
                        newItem = JSON.decode(item);
                    }

                } catch (e) {
                }

                if (newItem) {
                    field[itemId] = newItem;
                }

            });

            if (typeOf(field.tableItem) == 'null' && this.options.allTableItems && field.type != 'tab') {
                field.tableItem = 1;
            }

            if (typeOf(field.small) == 'null' && this.options.allSmall && field.type != 'tab') {
                field.small = 1;
            }

            if (this.options.tableItemLabelWidth) {
                field.tableItemLabelWidth = this.options.tableItemLabelWidth;
            }

            var target = pContainer.getElement('*[id=' + field.target + ']') ||
                pContainer.getElement('*[id=' + id + ']') ||
                pContainer.getElement('*[id=__default__]');

            if (!target) {
                target = pContainer;
            }

            if (field.type == 'tab') {
                var tab;

                if (!pDependField && !this.firstLevelTabPane) {
                    if (this.options.firstLevelTabPane) {
                        this.firstLevelTabPane = this.options.firstLevelTabPane;
                    } else {
                        if (this.options.tabsInWindowHeader) {
                            this.firstLevelTabPane = new jarves.TabPane(target, true, this.refs.win);
                        } else {
                            this.firstLevelTabPane = new jarves.TabPane(target, field.fullPage ? true : false);
                        }
                    }
                } else if (pDependField) {
                    //this tabPane is not on first level
                    if (!target.tabPane) {
                        target.tabPane = new jarves.TabPane(target, field.fullPage ? true : false);
                    }
                }

                if (pDependField) {
                    pDependField.tabPane.addPane(field.label, field.icon);
                } else {
                    tab = this.firstLevelTabPane.addPane(field.label, field.icon);
                }

                if (field.layout) {
                    tab.pane.set('html', field.layout);
                }

                obj = tab.button;
                obj.getChildrenContainer = function(){
                    return obj.childContainer;
                };
                obj.childContainer = tab.pane;
                obj.parent = pDependField;
                obj.options = field;
                obj.key = id;
                obj.getKey = function() {
                    return obj.key;
                };
                obj.toElement = function () {
                    return tab.button;
                };

                obj.setValue = function () {
                    return true;
                };
                obj.getValue = function () {
                    return true;
                };
                obj.save = function(progressWatch) {
                    progressWatch.done();
                };

                obj.hasParent = function () {
                    return obj.parent;
                };
                obj.setForm = function (form) {
                    obj.fieldForm = form;
                };
                obj.getForm = function () {
                    return obj.fieldForm;
                };

                obj.field = field;
                obj.handleChildsMySelf = true;

            } else {
                obj = new jarves.Field(field, target, id, this);
            }

            if (pDependField) {
                obj.parent = pDependField;
                pDependField.children[id] = obj;
            }

            if (field.children) {

                if (!obj.getChildrenContainer()) {
                    obj.prepareChildContainer();
                }

                this.parseLevel(field.children, obj.getChildrenContainer(), obj);

                if (!obj.handleChildsMySelf) {
                    obj.addEvent('check-depends', function () {

                        Object.each(this.children, function (sub, subid) {
                            if ('null' !== typeOf(sub.id)) {
                                subid = sub.id;
                            }

                            if (sub.field.againstField && sub.field.againstField != id) {
                                return;
                            }

                            self.updateVisibility(this, sub);
                        }.bind(this));

                        self.updateChildrenContainerVisibility(this);
                    }.bind(obj));
                }
                obj.fireEvent('check-depends');
            }

            this.attachField(id, obj, field);

            if (pDependField) {
                pDependField.children[id] = obj;
            }

        }.bind(this));
    },

    refreshVisibility: function(pTarget) {
        var obj = pTarget;
        if (typeOf(pTarget) == 'string') {
            obj = this.getField(pTarget);
        }

        if ('array' === typeOf(obj.field.againstField)) {
            Array.each(obj.field.againstField, function (fieldKey) {
                this.fields[fieldKey].fireEvent('check-depends');
            });
        } else if ('string' === typeOf(obj.field.againstField)) {
            if (this.fields[obj.field.againstField]) {
                this.fields[obj.field.againstField].fireEvent('check-depends');
            }
        } else {
            obj.show();
        }

        this.updateChildrenContainerVisibility(obj);
        this.checkForEmptyTabs();
    },

    attachField: function (id, obj, def) {
        var self = this;
        this.fields[id] = obj;
        this.fieldDefinitions[id] = def || obj.getDefinition();

        obj.addEvent('change', this.fireChange);

        if (!instanceOf(obj, jarves.FieldForm)) {
            obj.setForm(this);

            if (obj.field.againstField) {
                if (typeOf(obj.field.againstField) == 'array') {
                    var check = function () {

                        var visible = false;
                        Array.each(obj.field.againstField, function (fieldKey) {
                            if (self.getVisibility(self.fields[fieldKey], obj)) {
                                visible = true;
                            }
                        });

                        if (visible) {
                            obj.show();
                        } else {
                            obj.hide();
                        }

                        self.updateChildrenContainerVisibility(this);
                    };

                    Array.each(obj.field.againstField, function (fieldKey) {
                        this.fields[fieldKey].addEvent('check-depends', check);
                    }.bind(this));

                    check();

                    Array.each(obj.field.againstField, function (fieldKey) {
                        this.updateChildrenContainerVisibility(this.fields[fieldKey]);
                    }.bind(this));

                } else {
                    if (this.fields[obj.field.againstField]) {
                        this.fields[obj.field.againstField].addEvent('check-depends', function () {
                            this.updateVisibility(this.fields[obj.field.againstField], obj);
                            if (obj.hasParent()) {
                                self.updateChildrenContainerVisibility(obj.getParent());
                            }
                        }.bind(this));
                        this.fields[obj.field.againstField].fireEvent('check-depends');
                    } else {
                        logger('jarves.Field "againstField" does not exist: ', obj.field.againstField, obj);
                    }
                }
            }
        }
    },

    /**
     * Updates the visibility of the children container.
     * @param pObj
     */
    updateChildrenContainerVisibility: function (pObj) {
        if (pObj.handleChildsMySelf) {
            return;
        }

        if (!pObj.childContainer) {
            return;
        }

        var hasVisibleChilds = false;

        Object.each(pObj.children, function (sub) {
            if (!sub.isHidden()) {
                hasVisibleChilds = true;
            }
        });

        if (hasVisibleChilds) {
            pObj.childContainer.setStyle('display', 'block');
        } else {
            pObj.childContainer.setStyle('display', 'none');
        }

    },

    /**
     * Updates the visibility of a field.
     *
     * @param {string|jarves.Field} pTarget
     * @param {jarves.Field} pField
     */
    updateVisibility: function (pTarget, pField) {
        var visible = this.getVisibility(pTarget, pField);
        if (visible) {
            pField.show();
        } else {
            pField.hide();
        }
        this.checkForEmptyTabs();
    },

    isHidden: function(pField) {
        var field = pField;
        if (typeOf(pField) == 'string') {
            field = this.getField(pField);
        }

        if (!field) return;

        return field.isHidden();
    },

    isVisible: function(pField) {
        return !this.isHidden(pField);
    },

    checkForEmptyTabs: function() {
        if (!this.firstLevelTabPane) return;

        Array.each(this.firstLevelTabPane.getTabs(), function(tab) {
            if (tab.button && tab.button.field && tab.button.field.children) {
                var allHidden = true;
                Object.each(tab.button.field.children, function(children, key) {
                    allHidden &= this.isHidden(key);
                }.bind(this));

                if (allHidden) {
                    tab.button.hide();
                } else if (this.isVisible(tab.button.getKey())){
                    tab.button.show();
                }
            }
        }.bind(this));
    },

    setVisibility: function (pTarget, pVisible) {
        if ('null' !== typeOf(this.forcedVisibility[pTarget])) {
            return;
        }

        var field = pTarget;
        if (typeOf(pTarget) == 'string') {
            field = this.getField(pTarget);
        }

        if (!field) return;

        if (pVisible) {
            field.show();
        } else {
            field.hide();
        }
        this.checkForEmptyTabs();
    },

    hideField: function(pTarget) {
        delete this.forcedVisibility[pTarget];
        this.setVisibility(pTarget, false);
        this.forcedVisibility[pTarget] = false;
    },

    showField: function(pTarget) {
        this.forcedVisibility[pTarget] = true;
        this.refreshVisibility(pTarget);
    },

    showAll: function() {
        Object.each(this.forcedVisibility, function(val, key){
            this.refreshVisibility(key);
        }.bind(this));
        this.forcedVisibility = {};
    },

    /**
     * Returns whether a field should be visible or not.
     *
     * @param {jarves.Field} pTarget
     * @param {jarves.Field} pField
     * @return {Boolean}
     */
    getVisibility: function (pTarget, pField) {
        if (pTarget.isHidden()) {
            return false;
        }

        if (typeOf(pField.field.needValue) == 'null') {
            return true;
        }

        if (pField.field.needValue === '') {
            return true;
        }

        if (typeOf(pField.field.needValue) == 'array') {
            if (pField.field.needValue.contains(pTarget.getValue())) {
                return true;
            } else {
                return false;
            }
        } else if (typeOf(pField.field.needValue) == 'function') {
            if (pField.field.needValue.attempt(pTarget.getValue())) {
                return true;
            } else {
                return false;
            }
        } else if (typeOf(pField.field.needValue) == 'string' || typeOf(pField.field.needValue) == 'number') {
            var c = 'javascript:';
            if (typeOf(pField.field.needValue) == 'string' && pField.field.needValue.substr(0, c.length) == c) {

                var evalString = pField.field.needValue.substr(c);
                var value = pTarget.getValue();
                var result = eval(evalString);
                return (result) ? true : false;

            } else {
                if (pField.field.needValue == pTarget.getValue()) {
                    return true;
                } else {
                    return false;
                }
            }
        }
        return false;
    },

    /**
     * Checks all fields whether they are valid or not. This fires
     * 'checkValid()' on each jarves.Field instance, so it displays
     * the user if a field is not valid.
     *
     * @return {Boolean}
     */
    checkValid: function () {
        var ok = true;
        Object.each(this.fields, function (field, id) {
            if (id.substr(0, 2) == '__' && id.substr(id.length - 2) == '__') {
                return;
            }

            if (field.isHidden()) {
                return;
            }

            if (false === field.checkValid()) {
                ok = false;
            }
        });

        return ok;
    },

    /**
     * Invisible validation check. This does not show any information to the user,
     * if a field is invalid.
     *
     * @return {Boolean}
     */
    isValid: function () {
        var ok = true;
        Object.each(this.fields, function (field, id) {
            if (id.substr(0, 2) == '__' && id.substr(id.length - 2) == '__') {
                return;
            }

            if (instanceOf(field, jarves.Field) && field.isHidden()) {
                return;
            }

            if (false === field.isValid()) {
                ok = false;
            }
        });

        return ok;
    },

    /**
     * Returns all fields, which are invalid.
     *
     * @return {Object}
     */
    getInvalidFields: function () {

        var fields = {};
        Object.each(this.fields, function (field, id) {

            if (id.substr(0, 2) == '__' && id.substr(id.length - 2) == '__') {
                return;
            }

            if (field.isHidden()) {
                return;
            }

            if (false === field.isValid()) {
                fields[id] = field;
            }

        });

        return fields;
    },

    /**
     *
     * @param {Object} values
     * @param {String} path
     * @returns {*}
     */
    getArrayValue: function(values, path) {
        if (typeOf(values) === 'null') {
            this.setValue(null, true);
            return;
        }

        values = Object.clone(values);
        path = path.replace('[', '.').replace(']', '');
        var keys = path.split('.');
        var notFound = false;
        Array.each(keys, function(key) {
            if (notFound) {
                return;
            }
            if ('*' === key) {
                //
            } else if (values[key]) {
                values = values[key];
            } else {
                notFound = true;
            }

        });

        if (!notFound) {
            return values;
        }
    },

    /**
     * Returns the value that was set via setValue. `getValue` instead retrieves all
     * real values from all jarves.Fields.
     *
     * @returns {Object}
     */
    getOriginValue: function() {
        return this.value;
    },

    /**
     * Returns all fields as a flatten object.
     *
     * @return {Object}
     */
    getFields: function () {
        return this.fields;
    },

    getFieldDefinitions: function() {
        return this.fieldDefinitions;
    },

    getFieldDefinition: function(pId) {
        return this.fieldDefinitions[pId];
    },

    /**
     * Returns a field instance.
     *
     * @param {String} pField
     * @return {jarves.Field}
     */
    getField: function (pField) {
        return this.fields[pField];
    },

    /**
     *
     * @param {jarves.ProgressWatchManager} progressWatchManager
     */
    getValues: function(progressWatchManager) {
        Object.each(this.fields, function (obj, id) {
            obj.setProgressWatch(progressWatchManager.newProgressWatch({}, obj));
        });

        Object.each(this.fields, function (obj, id) {
            obj.save(obj.getProgressWatch());
        });
    },

    /**
     * Resets the patch status. Next getValue() only returns changed that will be made from now on.
     */
    resetPatch: function() {
        this.value = this.getValue();
    },

    /**
     * Set the value of all fields.
     *
     * @param values
     * @param internal
     */
    setValue: function (values, internal) {
        if (typeOf(values) == 'string') {
            try {
                values = JSON.decode(values);
            } catch (e){
                //(tf('Can not decode JSON `%s`', pValues), e);
            }
        }

        values = values || {};

        this.value = Object.clone(values);

        Object.each(this.fields, function (obj, id) {
            var value, selection;

            if (instanceOf(obj, jarves.FieldForm)) {
                obj.setValue(values, internal);
                return;
            }
            id = id.replace('[', '.').replace(']', '');

            selection = instanceOf(obj, jarves.Field) ? obj.getDefinition().selection : null;

            if (!selection || !selection.length || 1 === selection.length) {
                if (selection && 1 === selection.length) {
                    id = selection[0];
                }
                value = -1 !== id.indexOf('.') ? this.getArrayValue(values, id) : values[id];
            } else {
                value = {};
                Array.each(selection, function(idx) {
                    idx = idx.split('.')[0];
                    value[idx] = values[idx];
                });
            }

            obj.setValue(value, internal);
        }.bind(this));

        this.value = Object.clone(this.getValue());

        if (true !== internal) {
            //todo, should be === ?
            this.fireEvent('change', this.value);
            this.fireEvent('setValue', this.value);
        }

    },

    /**
     * Returns the value of a field.
     *
     * @param {String} [fieldKey]
     * @param {Boolean} [patch] return only values that has been changed since the last setValue() call.
     * @return {*}
     */
    getValue: function (fieldKey, patch) {
        var val;

        var res = {};

        if (fieldKey) {

            if (this.fields[fieldKey]) {
                res = this.fields[fieldKey].getValue();
            }
            else {
                return null;
            }

        } else {
            Object.each(this.fields, function (field, id) {
                if (instanceOf(field, jarves.FieldForm)) {
                    res = Object.merge(res, field.getValue());
                    return;
                }

                if (id.substr(0, 2) == '__' && id.substr(id.length - 2) == '__') {
                    return;
                }

                if (field.isHidden()) {
                    return;
                }

                id = id.replace('[', '.').replace(']', '');
                val = field.getValue();

                if (id.indexOf('.') != -1) {
                    var items = id.split('.');
                    var key = '';
                    var last = {};
                    var newRes = last;

                    items.each(function (item, pos) {
                        key = item;

                        if (pos == items.length - 1) {

                            if (typeOf(val) !== 'null'
                                && (val !== '' || this.options.withEmptyFields)
                                && (val !== field.options['default'] || field.options.returnDefault)
                                ) {
                                last[key] = val;
                            }

                        } else {
                            last[key] = {};
                            last = last[key];
                        }
                    }.bind(this));
                    res = Object.merge(res, newRes);
                } else {

                    if (typeOf(val) !== 'null'
                        && (val !== '' || this.options.withEmptyFields)
                        && (val !== field.options['default'] || field.options.returnDefault)
                        ) {

                        res[id] = val;
                    }
                }
            }.bind(this));
        }

        if (patch) {
            var patchValue = {};

            Object.each(res, function(v, k) {
                if (!this.value || this.isDifferent(v, this.value[k])) {
                    console.log(k, this.value ? this.value[k] : null, ' => ', v);
                    patchValue[k] = v;
                }
            }.bind(this));

            return patchValue;
        }

        return res;
    },

    /**
     *
     * @param {jarves.ProgressWatchManager} saveManager
     */
    save: function(saveManager) {
        Object.each(this.fields, function (obj) {
            obj.fieldFormProgressWatch = saveManager.newProgressWatch({}, obj);
        });

        Object.each(this.fields, function(obj, id) {
            obj.save(obj.fieldFormProgressWatch);
            (function() {
                if (!obj.fieldFormProgressWatch.isDone()) {
                    console.log(id, 'seems to be still saving data ...', obj);
                }
            }).delay(15000);
        });
    },

    isDifferent: function(a, b) {
        if (typeOf(a) !== typeOf(b)) {
            return true;
        }

        var changed;
        if ('object' === typeOf(a)) {
            changed = false;
            if (Object.getLength(a) !== Object.getLength(b)) {
                return true;
            }
            Object.each(a, function(v, k) {
                if (changed) return false;
                changed = this.isDifferent(v, b[k]);
            }.bind(this));
            return changed;
        }

        if ('array' === typeOf(a)) {
            changed = false;
            if (a.length !== b.length) {
                return true;
            }
            Array.each(a, function(v, k) {
                if (changed) return false;
                changed = this.isDifferent(v, b[k]);
            }.bind(this));
            return changed;
        }


        return a !== b;
    }
});
