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

var jarves_user_acl = new Class({

    groupDivs: {},
    userDivs: {},

    objectDivs: {},

    loadedAcls: [],
    currentObject: false,
    currentConstraint: false,

    currentAcls: [],

    /**
     * @var {jarves.Window}
     */
    win: null,

    initialize: function (window) {
        this.win = window;
        this.createLayout();
    },

    createLayout: function () {
        this.win.content.setStyle('overflow', 'hidden');

        this.win.getTitleGroupContainer().setStyle('height', 42);

        this.left = new Element('div', {
            'class': 'jarves-user-acl-left jarves-List'
        }).inject(this.win.content);

        this.right = new Element('div', {
            'class': 'jarves-user-acl-right'
        }).inject(this.win.content);

        this.query = new jarves.Field({
            type: 'text',
            noWrapper: true,
            options: {
                inputWidth: 200
            },
            inputIcon: '#icon-search-8'
        }, this.win.titleGroups);

        this.query.addEvent('change', function () {
            if (this.timeout) {
                clearTimeout(this.timeout);
            }
            this.timeout = this.loadList.delay(100, this);
        }.bind(this));

        this.tabs = new jarves.TabPane(this.right, true, this.win);

        this.entryPointTab = this.tabs.addPane(t('Entry points'), '');
        this.objectTab = this.tabs.addPane(t('Objects'), '');

        this.tabs.addEvent('change', function() {
            this.updateObjectRulesCounter();
            this.loadObjectRules();
        }.bind(this));

        this.actions = new jarves.ButtonGroup(this.win.titleGroups);
        this.btnSave = this.actions.addButton(t('Save'), null, this.save.bind(this));
        this.btnSave.setButtonStyle('blue');

        document.id(this.actions).setStyles({
            position: 'absolute',
            right: 0,
            top: 5
        });

        this.tabs.hide();
        this.actions.hide();

        this.loadEntryPoints();
        this.loadObjects();

        document.id(this.tabs.buttonGroup).setStyle('margin-left', 16);

        this.loadList();
    },

    loadObjectRules: function (objectKey) {
        if (objectKey) {
            objectKey = jarves.normalizeObjectKey(objectKey);
            //jarves.getObjectDefinition(pObjectKey);
            this.currentObject = objectKey;
        }

        if (!this.currentObject) {
            return;
        }

        this.btnAddExact.setStyle('display', 'none');

        this.objectsExactContainer.empty();

        this.objectList.getElements('.jarves-List-item').removeClass('active');
        this.objectDivs[jarves.normalizeObjectKey(this.currentObject)].addClass('active');

        this.currentDefinition = jarves.getObjectDefinition(this.currentObject);

        if (this.currentDefinition.nested) {

            var options = {
                type: 'tree',
                object: this.currentObject,
                openFirstLevel: true,
                moveable: false,
                withContext: false,
                noWrapper: true,
                onReady: function () {
                    this.renderTreeRules();
                    this.mapObjectTreeEvent();
                }.bind(this),
                onChildrenLoaded: function () {
                    this.renderTreeRules();
                }.bind(this)
            };

            if (this.currentDefinition.nestedRootObject) {

                var objectChooser = new Element('div').inject(this.objectsExactContainer);
                var objectTreeContainer = new Element('div').inject(this.objectsExactContainer);

                var field = new jarves.Select(objectChooser, {
                    object: this.currentDefinition.nestedRootObject
                });

                field.addEvent('change', function () {
                    objectTreeContainer.getChildren().destroy();

                    options.scope = field.getValue();
                    this.lastObjectTree = new jarves.Field(options, objectTreeContainer);
                }.bind(this));

                field.addEvent('ready', function () {
                    field.fireEvent('change', field.getValue());
                });
            } else {
                this.lastObjectTree = new jarves.Field(options, this.objectsExactContainer);
            }

        } else {
            this.btnAddExact.setStyle('display', 'inline');
        }

        //todo, if nested, we'd also display rules of parent object which have sub=1
        this.currentConstraint = -1;

        this.renderObjectRules();
        this.showRules();

    },

    mapObjectTreeEvent: function () {
        var tree = this.lastObjectTree.getFieldObject().getTree();
        if (!tree) return;
        if (document.id(tree).alreadyMapped) return;

        document.id(tree).alreadyMapped = true;
        document.id(tree).addEvent('mousedown:relay(.jarves-objectTree-item)', function(event, target) {
            event.stop();
        });
        document.id(tree).addEvent('mouseover:relay(.jarves-objectTree-item)', function(event, target) {
            delete target.isMouseOut;

            if (target.lastPlusSign) {
                return target.lastPlusSign.fade('show');
            }

            target.lastPlusSign = new Element('a', {
                href: 'javascript:;',
                html: '&#xe42e;',
                style: 'position: absolute; right: 5px; top: 2px;' +
                    'font-family: Icomoon; font-size: 12px; color: black; text-decoration: none;'
            }).inject(target);

            target.set('fade', {link: 'cancel'});

            target.lastPlusSign.addEvent('click', function (e) {
                e.stopPropagation();
                this.openEditRuleDialog(this.currentObject, {constraintType: 1, constraintCode: target.id});
            }.bind(this));
        }.bind(this));

        document.id(tree).addEvent('mouseout:relay(.jarves-objectTree-item)', function (event, target) {
            target.isMouseOut = true;

            target.lastTimer = (function () {
                if (target.lastPlusSign && target.isMouseOut) {
                    target.lastPlusSign.fade('hide');
                }
            }).delay(30);

        });

        this.lastObjectTree.addEvent('select', function (item, dom) {
            if (!dom.rules) {
                this.lastObjectTree.getFieldObject().getTree().deselect();
                this.filterRules();
            } else {
                this.filterRules(1, dom.id, dom);
            }

        }.bind(this));
    },

    renderTreeRules: function () {

        Array.each(this.currentAcls, function (rule) {
            if (jarves.normalizeObjectKey(rule.object) != this.currentObject) {
                return;
            }

            if (rule.constraintType == 1) {

                var item = this.lastObjectTree.getFieldObject().getTree().getItem(rule.constraintCode);

                if (!item) {
                    return false;
                }

                if (!item.rules) {
                    item.rules = [];
                }

                if (item.rules.contains(rule)) {
                    return;
                }

                item.rules.push(rule);

                if (rule.sub && !item.usersAclSubLine) {
                    item.usersAclSubLine = new Element('div', {
                        style: 'position: absolute; top: 15px; bottom: 0px; border-right: 1px solid gray;'
                    }).inject(item);

                    item.usersAclSubLineChildren = new Element('div', {
                        style: 'position: absolute; top: 0px; bottom: 0px; border-right: 1px solid gray;'
                    }).inject(item.getNext());

                    [item.usersAclSubLine, item.usersAclSubLineChildren].each(function (dom) {
                        dom.setStyle('left', item.getStyle('padding-left').toInt() + 13);
                    });
                }

                if (!item.usersAclCounter) {
                    item.usersAclCounter = new Element('span', {
                        text: ' (1)',
                        style: 'color: green;'
                    }).inject(item.span);
                    item.usersAclCounter.ruleCount = 1;
                } else {
                    item.usersAclCounter.set('text', ' (' + (item.usersAclCounter.ruleCount++) + ')');
                }

            }

        }.bind(this));

    },

    renderObjectRules: function () {
        this.currentAcls.sortOn('prio');

        this.objectRulesContainer.empty();

        var ruleCounter = {
            all: 0,
            custom: 0,
            exact: 0
        };

        var modeCounter = {
            0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0
        };

        var ruleGrouped = [true, {}, {}];

        var all = 0;

        Array.each(this.currentAcls, function (rule) {
            if (jarves.normalizeObjectKey(rule.object) != this.currentObject) {
                return;
            }

            all++;
            modeCounter[parseInt(rule.mode)]++;

            if (rule.constraintType == 2) {
                ruleCounter.custom++;
            } else if (rule.constraintType == 1) {
                ruleCounter.exact++;
            } else {
                ruleCounter.all++;
            }

            if (rule.constraintType >= 1) {

                if (!ruleGrouped[rule.constraintType][rule.constraintCode]) {
                    ruleGrouped[rule.constraintType][rule.constraintCode] = [];
                }

                ruleGrouped[rule.constraintType][rule.constraintCode].push(rule);
            }

        }.bind(this));


        this.selectModes.setLabel(-1,
            [tc('usersAclModes', 'All rules') + ' (' + all + ')', 'bundles/jarves/admin/images/icons/tick.png']);
        this.selectModes.setLabel(0,
            [tc('usersAclModes', 'Combined') + ' (' + modeCounter[0] + ')', 'bundles/jarves/admin/images/icons/arrow_in.png']);
        this.selectModes.setLabel(1,
            [tc('usersAclModes', 'List') + ' (' + modeCounter[1] + ')', 'bundles/jarves/admin/images/icons/application_view_list.png']);
        this.selectModes.setLabel(2,
            [tc('usersAclModes', 'View') + ' (' + modeCounter[2] + ')', 'bundles/jarves/admin/images/icons/application_form.png']);
        this.selectModes.setLabel(3,
            [tc('usersAclModes', 'Add') + ' (' + modeCounter[3] + ')', 'bundles/jarves/admin/images/icons/application_form_add.png']);
        this.selectModes.setLabel(4,
            [tc('usersAclModes', 'Edit') + ' (' + modeCounter[4] + ')', 'bundles/jarves/admin/images/icons/application_form_edit.png']);
        this.selectModes.setLabel(5,
            [tc('usersAclModes', 'Delete') + ' (' + modeCounter[5] + ')', 'bundles/jarves/admin/images/icons/application_form_delete.png']);

        if (!this.currentDefinition.nested) {
            this.objectsExactContainer.empty();

            Object.each(ruleGrouped[1], function (rules, code) {

                var div = new Element('div', {
                    'class': 'jarves-List-item'
                }).inject(this.objectsExactContainer);

                div.addEvent('click', function () {
                    this.filterRules(1, code, null)
                }.bind(this));

                var title = new Element('span', {
                    text: 'object://' + this.currentObject + '/' + code
                }).inject(div);

                this.loadObjectLabel(title);
                title = new Element('span', {
                    text: ' (' + rules.length + ')'
                }).inject(div);

            }.bind(this));
        }

        this.objectsCustomContainer.empty();
        Object.each(ruleGrouped[2], function (rules, code) {

            var div = new Element('div', {
                'class': 'jarves-List-item'
            }).inject(this.objectsCustomContainer);
            div.addEvent('click', function () {
                this.filterRules(2, code, div)
            }.bind(this));

            var span = new Element('span').inject(div);
            this.humanReadableCondition(code, span);
            span = new Element('span', {text: ' (' + rules.length + ')'}).inject(div);

        }.bind(this));

        this.objectsAllCount.set('text', '(' + ruleCounter.all + ')');
        this.objectsCustomSplitCount.set('text', '(' + ruleCounter.custom + ')');
        this.objectsExactSplitCount.set('text', '(' + ruleCounter.exact + ')');

        Array.each(this.currentAcls, function (rule) {
            if (jarves.normalizeObjectKey(rule.object) != this.currentObject) {
                return;
            }

            if (this.currentConstraint == -1) {
                this.renderObjectRulesAdd(rule);
            }

        }.bind(this));

        if (this.rulesSort) {
            delete this.rulesSort;
        }

        this.rulesSort = new Sortables(this.objectRulesContainer, {
                handle: '.jarves-user-acl-object-rule-mover',
                clone: true,
                constrain: true,
                revert: true,
                opacity: 1,
                onSort: this.updateObjectRulesPosition.bind(this)
            }
        );

    },

    updateObjectRulesPosition: function(element) {
        this.currentAcls = this.currentAcls.filter(function(rule){
            return jarves.normalizeObjectKey(rule['object']) != this.currentObject;
        }.bind(this));

        var children = this.objectRulesContainer.getChildren()

        children.each(function(ruleDom, idx) {
            if (ruleDom.rule) {
                ruleDom.rule.prio = children.length - idx;
                this.currentAcls.push(ruleDom.rule);
            }
        }.bind(this));
    },

    filterRules: function (constraintType, constraintCode, domObject) {

        if (domObject) {
            this.objectConstraintsContainer.getElements('.active').removeClass('active');

            if (domObject) {
                if (domObject.hasClass('jarves-List-item')) {
                    domObject.addClass('active');
                    if (this.lastObjectTree) {
                        this.lastObjectTree.getFieldObject().getTree().deselect();
                    }
                }
            } else {
                if (this.lastObjectTree) {
                    this.lastObjectTree.getFieldObject().getTree().deselect();
                }
            }

            if (typeOf(constraintType) != 'null') {
                this.lastConstraintType = constraintType;
                this.lastConstraintCode = constraintCode;
            } else if (this.lastConstraintType) {
                constraintType = this.lastConstraintType;
                constraintCode = this.lastConstraintCode;
            }
        } else {
            delete this.lastConstraintType;
            this.objectConstraintsContainer.getElements('.active').removeClass('active');
            if (this.lastObjectTree) {
                this.lastObjectTree.getFieldObject().getTree().deselect();
            }
        }

        this.objectRulesContainer.getChildren().each(function (child) {
            var show = false;
            var completelyHide = false;

            if (typeOf(constraintType) != 'null') {
                if (constraintType === false || child.rule.constraintType == constraintType) {

                    if (constraintType === false || constraintType == 0 ||
                        (constraintType >= 1 && constraintCode == child.rule.constraintCode)) {
                        show = true;
                    }
                }
            } else {
                show = true;
            }

            if (this.lastRulesModeFilter !== false) {
                if (parseInt(this.lastRulesModeFilter) != parseInt(child.rule.mode)) {
                    show = false;
                    completelyHide = true;
                }
            }

            if (show) {
                if (child.savedHeight) {
                    child.morph({
                        'height': child.savedHeight,
                        paddingTop: 6,
                        paddingBottom: 6
                    });
                } else {
                    child.savedHeight = child.getSize().y - 12;
                }

                child.addClass('jarves-List-item');

            } else {

                if (!child.savedHeight) {
                    child.savedHeight = child.getSize().y - 12;
                }

                if (completelyHide) {
                    child.removeClass('jarves-List-item');
                }

                child.morph({
                    'height': completelyHide == true ? 0 : 1,
                    paddingTop: 0,
                    paddingBottom: 0
                });
            }
        }.bind(this));

    },

    renderObjectRulesAdd: function (rule) {
        var count = this.objectRulesContainer.getChildren().length, title;

        var div = new Element('div', {
            'class': 'jarves-List-item jarves-user-acl-object-rule'
        }).inject(this.objectRulesContainer);

        div.rule = rule;

        new Element('img', {
            'class': 'jarves-user-acl-object-rule-mover',
            src: _path + 'bundles/jarves/admin/images/item-mover.png'
        }).inject(div);

        var status = 'accept';
        if (rule.access == 0) {
            status = 'exclamation';
        } else if (rule.access == 2) {
            status = 'arrow_turn_bottom_left';
        }

        new Element('img', {
            'class': 'jarves-user-acl-object-rule-status',
            src: _path + 'bundles/jarves/admin/images/icons/' + status + '.png'
        }).inject(div);

        var mode = 'arrow_in'; //0, combined
        var modeTitle = 'All combined';

        switch (parseInt(rule.mode)) {
            case 1:
                mode = 'application_view_list';
                modeTitle = 'List';
                break; //list
            case 2:
                mode = 'application_form';
                modeTitle = 'View';
                break; //view detail
            case 3:
                mode = 'application_form_add';
                modeTitle = 'Add';
                break; //add
            case 4:
                mode = 'application_form_edit';
                modeTitle = 'Edit';
                break; //edit
            case 5:
                mode = 'application_form_delete';
                modeTitle = 'Delete';
                break; //delete
        }

        new Element('img', {
            'class': 'jarves-user-acl-object-rule-mode',
            src: _path + 'bundles/jarves/admin/images/icons/' + mode + '.png',
            title: modeTitle
        }).inject(div);

        title = t('All objects');

        if (rule.constraintType == 1) {
            title = 'object://' + this.currentObject + '/' + rule.constraintCode;
        }
        if (rule.constraintType == 2) {
            title = '';
        }

        title = new Element('span', {
            text: title
        }).inject(div);

        if (rule.constraintType == 2) {
            var span = new Element('span').inject(title);
            this.humanReadableCondition(rule.constraintCode, span);
        } else if (rule.constraintType == 1) {
            this.loadObjectLabel(title);
        }

        if (rule.mode != 1 && rule.mode <= 4) {

            var fieldSubline = new Element('div', {
                'class': 'jarves-user-acl-object-rule-subline'
            }).inject(div);

            var comma;

            if (rule.fields && rule.fields != '') {

                var definition = jarves.getObjectDefinition(this.currentObject);

                var fieldsObj = JSON.decode(rule.fields);

                var primaries = jarves.getObjectPrimaryList(this.currentObject);
                if (primaries) {
                    var primaryField = primaries[0];
                    var primaryLabel = definition.fields[primaryField].label || primaryField;
                }

                Object.each(fieldsObj, function (def, key) {

                    field = key;
                    if (definition && definition.fields[field] && definition.fields[field].label) {

                        field = definition.fields[field].label;

                        new Element('span', {text: field}).inject(fieldSubline);

                        var imgSrc;
                        var subcomma;

                        if (typeOf(def) == 'object' || typeOf(def) == 'array') {

                            new Element('span', {text: '['}).inject(fieldSubline);

                            var span = new Element('span').inject(fieldSubline);

                            if (typeOf(def) == 'array') {
                                Array.each(def, function (rule) {

                                    var span = new Element('span').inject(fieldSubline);
                                    this.humanReadableCondition(rule.condition, span);
                                    if (rule.access == 1) {
                                        new Element('img', {src: _path + 'bundles/jarves/admin/images/icons/accept.png'}).inject(span);
                                    } else {
                                        new Element('img',
                                            {src: _path + 'bundles/jarves/admin/images/icons/exclamation.png'}).inject(span);
                                    }
                                    subcomma = new Element('span', {text: ', '}).inject(fieldSubline);

                                }.bind(this));
                            } else {

                                var primaryLabel = '';
                                Object.each(def, function (access, id) {

                                    var span = new Element('span', {
                                        text: primaryLabel + ' = ' + id
                                    }).inject(span);

                                    if (access == 1) {
                                        new Element('img', {src: _path + 'bundles/jarves/admin/images/icons/accept.png'}).inject(span);
                                    } else {
                                        new Element('img',
                                            {src: _path + 'bundles/jarves/admin/images/icons/exclamation.png'}).inject(span);
                                    }

                                    new Element('img', {src: imgSrc}).inject(span);
                                    subcomma = new Element('span', {text: ', '}).inject(fieldSubline);

                                }.bind(this));
                            }

                            if (subcomma) {
                                subcomma.destroy();
                            }

                            new Element('span', {text: ']'}).inject(fieldSubline);

                        } else if (def == 0) {
                            imgSrc = _path + 'bundles/jarves/admin/images/icons/exclamation.png';
                        } else if (def) {
                            imgSrc = _path + 'bundles/jarves/admin/images/icons/accept.png';
                        }

                        if (imgSrc) {
                            new Element('img', {src: imgSrc}).inject(fieldSubline);
                        }
                    }

                    comma = new Element('span', {text: ', '}).inject(fieldSubline);

                }.bind(this));

                comma.destroy();

            } else {
                new Element('span', {text: t('All fields')}).inject(fieldSubline);
            }
        }

        var actions = new Element('div', {
            'class': 'jarves-user-acl-object-rule-actions'
        }).inject(div);

        new Element('img', {
            src: _path + 'bundles/jarves/admin/images/icons/pencil.png',
            title: t('Edit rule')
        })
            .addEvent('click', function () {
                this.openEditRuleDialog(this.currentObject, div);
            }.bind(this))
            .inject(actions);

        new Element('img', {
            src: _path + 'bundles/jarves/admin/images/icons/delete.png',
            title: t('Delete rule')
        })
            .addEvent('click', this.deleteObjectRule.bind(this, div))
            .inject(actions);

    },

    loadObjectLabel: function (domObject) {
        var url = domObject.get('text');

        jarves.getObjectLabel(url, function(label) {
            domObject.set('text', label);
        });
    },

    humanReadableCondition: function (condition, domObject) {
        if (typeOf(condition) == 'string') {
            condition = JSON.decode(condition);
        }

        if (typeOf(condition) != 'array') {
            return;
        }

        console.log('humanReadableCondition', condition);

        var field = '';
        var definition = jarves.getObjectDefinition(this.currentObject);

        var span = new Element('span');

        if (condition.length > 0) {

            Array.each(condition, function (condition) {

                if (typeOf(condition) == 'string') {
                    new Element('span',
                        {text: ' ' + ((condition.toLowerCase() == 'and') ? t('and') : t('or')) + ' '}).inject(span);
                } else {

                    if (typeOf(condition[0]) == 'array') {
                        //group
                        new Element('span', {text: '('}).inject(span);
                        var sub = new Element('span').inject(span);
                        this.humanReadableCondition(condition, sub);
                        new Element('span', {text: ')'}).inject(span);

                    } else {
                        field = condition[0];
                        if (definition && definition.fields[field] && definition.fields[field].label) {
                            field = definition.fields[field].label;
                        }

                        new Element('span', {text: field + ' ' + condition[1] + ' ' + condition[2]}).inject(span);
                    }
                }

            }.bind(this));

        } else {
            span.set('text', t('-- Nothing --'));
        }

        domObject.empty();
        span.inject(domObject);

    },

    addObjectsToList: function (bundleConfig, bundleName) {

        new Element('div', {
            'class': 'jarves-List-split',
            text: jarves.getBundleTitle(bundleName)
        }).inject(this.objectList);

        Object.each(bundleConfig.objects, function (object, objectName) {

            var div = new Element('div', {
                'class': 'jarves-List-item'
            })
                .addEvent('click', function () {
                    this.loadObjectRules(jarves.normalizeObjectKey(bundleName+'/'+objectName))
                }.bind(this))
                .inject(this.objectList);

            var h2 = new Element('h2', {
                text: object.label || objectName
            }).inject(div);

            div.count = new Element('span', {
                style: 'font-weight: normal; color: gray;'
            }).inject(h2);

            if (object.desc) {
                new Element('div', {
                    'class': 'sub',
                    text: object.desc
                }).inject(div);
            }

            this.objectDivs[jarves.normalizeObjectKey(bundleName+'/'+objectName)] = div;

        }.bind(this));

    },

    loadObjects: function () {

        this.objectList = new Element('div', {
            'class': 'jarves-user-acl-object-list'
        })
            .inject(this.objectTab.pane);

        this.objectConstraints = new Element('div', {
            'class': 'jarves-user-acl-object-constraints'
        })
            .inject(this.objectTab.pane);

        this.objectRulesFilter = new Element('div', {
            'class': 'jarves-user-acl-object-constraints-title'
        }).inject(this.objectConstraints);

        new Element('div', {
            'class': 'jarves-List-split',
            text: t('Constraints')
        }).inject(this.objectRulesFilter);

        var div = new Element('div', {
            style: 'padding: 2px;'
        }).inject(this.objectRulesFilter);

        new jarves.Button(t('Deselect'))
            .addEvent('click', function () {
                this.filterRules()
            }.bind(this))
            .inject(div);

        this.objectConstraintsContainer = new Element('div', {
            'class': 'jarves-user-acl-object-constraints-container'
        })
            .inject(this.objectConstraints);

        var allDiv = new Element('div', {
            'class': 'jarves-List-item'
        }).inject(this.objectConstraintsContainer);

        allDiv.addEvent('click', function () {
            this.filterRules(0, null, allDiv)
        }.bind(this));

        var h2 = new Element('div', {
            text: t('All objects')
        }).inject(allDiv);

        this.objectsAllCount = new Element('span', {
            style: 'padding-left: 5px;',
            text: '(0)'
        }).inject(h2);

        new Element('img', {
            src: _path + 'bundles/jarves/admin/images/icons/add.png',
            style: 'cursor: pointer; position: relative; top: -1px; float: right;',
            title: t('Add')
        })
            .addEvent('click', function (e) {
                this.openEditRuleDialog(this.currentObject, {constraintType: 0});
                e.stop();
            }.bind(this))
            .inject(h2);

        this.objectsCustomSplit = new Element('div', {
            'class': 'jarves-List-split',
            text: t('Custom')
        }).inject(this.objectConstraintsContainer);

        this.objectsCustomSplitCount = new Element('span', {
            style: 'color: gray; padding-left: 5px;',
            text: '(0)'
        }).inject(this.objectsCustomSplit);

        this.objectsCustomContainer = new Element('div', {
        }).inject(this.objectConstraintsContainer);

        new Element('img', {
            src: _path + 'bundles/jarves/admin/images/icons/add.png',
            style: 'cursor: pointer; position: relative; top: -1px; float: right;',
            title: t('Add')
        })
            .addEvent('click', function () {
                this.openEditRuleDialog(this.currentObject, {constraintType: 2});
            }.bind(this))
            .inject(this.objectsCustomSplit);

        this.objectsExactSplit = new Element('div', {
            'class': 'jarves-List-split',
            text: t('Exact') + ' '
        }).inject(this.objectConstraintsContainer);

        this.objectsExactContainer = new Element('div', {
        }).inject(this.objectConstraintsContainer);

        this.objectsExactSplitCount = new Element('span', {
            style: 'color: gray; padding-left: 5px;',
            text: '(0)'
        }).inject(this.objectsExactSplit);

        this.btnAddExact = new Element('img', {
            src: _path + 'bundles/jarves/admin/images/icons/add.png',
            style: 'cursor: pointer; position: relative; top: -1px; float: right;',
            title: t('Add')
        })
            .addEvent('click', function () {
                this.openEditRuleDialog(this.currentObject, {constraintType: 1})
            }.bind(this))
            .inject(this.objectsExactSplit);

        this.objectRules = new Element('div', {
            'class': 'jarves-user-acl-object-rules'
        })
            .inject(this.objectTab.pane);

        this.objectRulesFilter = new Element('div', {
            'class': 'jarves-user-acl-object-rules-filter'
        }).inject(this.objectRules);

        new Element('div', {
            'class': 'jarves-List-split',
            text: t('Rules (bottom has higher priority)')
        }).inject(this.objectRulesFilter);

        this.objectRulesInfo = new Element('div', {
            'class': 'jarves-user-acl-object-rules-info'
        }).inject(this.objectRulesFilter);

        //        new Element('div', {
        //            text: t('Most important rule shall be on the top.')
        //        }).inject(this.objectRulesInfo);

        var div = new Element('div', {
            text: t('Filter modes') + ': ',
            style: 'line-height: 26px;'
        }).inject(this.objectRulesInfo);

        this.selectModes = new jarves.Select(div);

        document.id(this.selectModes).setStyle('width', 120);

        this.selectModes.addImage(-1, tc('usersAclModes', 'All rules'), 'bundles/jarves/admin/images/icons/tick.png');
        this.selectModes.addImage(0, tc('usersAclModes', 'Combined'), 'bundles/jarves/admin/images/icons/arrow_in.png');
        this.selectModes.addImage(1, tc('usersAclModes', 'List'), 'bundles/jarves/admin/images/icons/application_view_list.png');
        this.selectModes.addImage(2, tc('usersAclModes', 'View'), 'bundles/jarves/admin/images/icons/application_form.png');
        this.selectModes.addImage(3, tc('usersAclModes', 'Add'), 'bundles/jarves/admin/images/icons/application_form_add.png');
        this.selectModes.addImage(4, tc('usersAclModes', 'Edit'), 'bundles/jarves/admin/images/icons/application_form_edit.png');
        this.selectModes.addImage(5, tc('usersAclModes', 'Delete'), 'bundles/jarves/admin/images/icons/application_form_delete.png');

        this.lastRulesModeFilter = false;

        this.selectModes.addEvent('change', function (value) {
            if (value == -1) {
                this.lastRulesModeFilter = false;
            } else {
                this.lastRulesModeFilter = value;
            }

            this.filterRules();
        }.bind(this));

        this.objectRulesContainer = new Element('div', {
            'class': 'jarves-user-acl-object-rules-container'
        })
            .inject(this.objectRules);

        this.addObjectsToList(jarves.getConfig('jarves'), 'jarves');

        Object.each(jarves.settings.configs, function (config, extKey) {
            extKey = jarves.getShortBundleName(extKey);
            if ('jarves' === extKey) return;
            if (!config.objects || typeOf(config.objects) != 'object') {
                return;
            }
            this.addObjectsToList(config, extKey);

        }.bind(this));

    },

    applyEditRuleDialog: function () {

        var value = this.editRuleKaObj.getValue();

        var oldScrollTop = this.objectRulesContainer.getScroll().y;

        if (value.constraintType == 2) {
            value.constraintCode = JSON.encode(value.constraintCodeCondition);
            delete value.constraintCodeCondition;
        }
        if (value.constraintType == 1) {
            value.constraintCode = value.constraintCodeExact;
            delete value.constraintCodeExact;
        }

        if (!value.fields || !Object.getLength(value.fields)) {
            delete value.fields;
        } else {
            value.fields = JSON.encode(value.fields);
        }

        value.object = this.currentObject;
        value.targetType = this.currentTargetType;
        value.targetId = this.currentTargetRsn;

        if (this.currentRuleDiv) {
            var pos = this.currentAcls.indexOf(this.currentRuleDiv.rule);
            value.prio = this.currentRuleDiv.rule.prio;
            this.currentAcls[pos] = value;
        } else {

            var newPrio = 1;
            if (this.currentAcls.length > 0) {
                newPrio = this.currentAcls[0].prio + 1;
            }

            oldScrollTop = 0;
            value.prio = newPrio;

            this.currentAcls.push(value);
        }

        console.log('apply', this.currentAcls);
        this.renderObjectRules();
        this.updateObjectRulesCounter();

        this.unsavedContent = true;

        this.editRuleDialog.close();
        this.objectRulesContainer.scrollTo(0, oldScrollTop);

        delete this.editRuleDialog;

    },

    deleteObjectRule: function (pDiv) {

        var oldScrollTop = this.objectRulesContainer.getScroll().y;

        var pos = this.currentAcls.indexOf(pDiv.rule);
        this.currentAcls.splice(pos, 1)
        pDiv.destroy();

        this.renderObjectRules();
        this.updateObjectRulesCounter();

        this.objectRulesContainer.scrollTo(0, oldScrollTop);

        this.unsavedContent = true;

    },

    openEditRuleDialog: function (pObject, pRuleDiv) {

        this.currentRuleDiv = typeOf(pRuleDiv) == 'element' ? pRuleDiv : null;

        this.editRuleDialog = this.win.newDialog('', true);

        this.editRuleDialog.setStyles({
            width: '90%',
            height: '90%'
        });

        this.editRuleDialog.center();

        //this.editRuleDialog.content
        new jarves.Button(t('Cancel'))
            .addEvent('click', function () {
                this.editRuleDialog.close();
            }.bind(this))
            .inject(this.editRuleDialog.bottom);

        var applyTitle = t('Apply');
        var title = t('Edit rule');

        if (typeOf(pRuleDiv) == 'object') {
            applyTitle = t('Add');
            title = t('Add rule');
        }

        new jarves.Button(applyTitle)
            .setButtonStyle('blue')
            .addEvent('click', this.applyEditRuleDialog.bind(this))
            .inject(this.editRuleDialog.bottom);

        new Element('h2', {
            text: title
        }).inject(this.editRuleDialog.content);

        var fields = {

            constraintType: {
                label: t('Constraint type'),
                type: 'select',
                inputWidth: 140,
                items: {
                    0: t('All objects'),
                    1: t('Exact object'),
                    2: t('Custom condition')
                }
            },

            constraintCodeCondition: {
                label: t('Constraint'),
                needValue: '2',
                againstField: 'constraintType',
                type: 'condition',
                object: pObject,
                startWith: 1
            },

            constraintCodeExact: {
                label: t('Object'),
                needValue: '1',
                fieldWidth: 250,
                againstField: 'constraintType',
                type: 'object',
                object: pObject
            },

            access: {
                label: t('Access'),
                type: 'select',
                inputWidth: 140,
                'default': '2',
                items: {
                    '2': t('Inherited'),
                    '0': t('Deny'),
                    '1': t('Allow')
                }

            },

            sub: {
                type: 'checkbox',
                label: t('With sub-items'),
                'default': 1
            },

            mode: {
                label: t('Mode'),
                type: 'select',
                inputWidth: 140,
                'default': '0',
                options: {
                    items: [
                        [tc('usersAclModes', 'Combined'), 'bundles/jarves/admin/images/icons/arrow_in.png'],
                        [tc('usersAclModes', 'List'), 'bundles/jarves/admin/images/icons/application_view_list.png'],
                        [tc('usersAclModes', 'View'), 'bundles/jarves/admin/images/icons/application_form.png'],
                        [tc('usersAclModes', 'Add'), 'bundles/jarves/admin/images/icons/application_form_add.png'],
                        [tc('usersAclModes', 'Edit'), 'bundles/jarves/admin/images/icons/application_form_edit.png'],
                        [tc('usersAclModes', 'Delete'), 'bundles/jarves/admin/images/icons/application_form_delete.png']
                    ],
                    itemsLabelAsValue: false
                }
            },

            __fields__: {
                label: t('Fields'),
                needValue: [0, 2, 3, 4],
                againstField: 'mode',
                type: 'label'
            },

            fields: {
                noWrapper: true,
                needValue: [0, 2, 3, 4],
                againstField: 'mode',
                type: 'UserAclRuleFields',
                object: pObject
            }

        };

        if (!this.currentDefinition.nested) {
            delete fields.sub;
        }

        this.editRuleKaObj = new jarves.FieldForm(this.editRuleDialog.content, fields, {
            returnDefault: true
        }, {win: this.win});

        var rule = Object.clone(
            typeOf(pRuleDiv) == 'element' ? pRuleDiv.rule : typeOf(pRuleDiv) == 'object' ? pRuleDiv : {});

        if (rule.constraintType == 2) {
            rule.constraintCodeCondition = rule.constraintCode;
        }
        if (rule.constraintType == 1) {
            rule.constraintCodeExact = rule.constraintCode;
        }

        this.editRuleKaObj.setValue(rule);

    },

    clickEntrypoint: function (pEvent) {

        this.entryPointList.getElements('a').removeClass('jarves-user-acl-entrypoint-rule-active');
        this.entryPointRuleContainer.empty();

        if (!pEvent.target) {
            return;
        }

        var element = pEvent.target;
        if (element.get('tag') != 'a') {
            element = element.getParent('a');
            if (!element) {
                return;
            }
        }

        element.addClass('jarves-user-acl-entrypoint-rule-active');

        this.clickEntryPointRule(element);

    },

    loadEntryPoints: function () {
        this.currentEntrypointDoms = {};

        this.entryPointList = new Element('div', {
            'class': 'jarves-user-acl-entrypoint-list'
        })
            .inject(this.entryPointTab.pane);

        this.entryPointListContainer = new Element('div', {
            'style': 'padding-left: 15px;'
        })
            .inject(this.entryPointList);

        this.entryPointListContainer.addEvent('click', this.clickEntrypoint.bind(this));

        this.entryPointRuleContainer = new Element('div', {
            'class': 'jarves-user-acl-entrypoint-rule-container'
        })
            .inject(this.entryPointTab.pane);

        this.adminEntryPointDom = this.addEntryPointTree(jarves.getConfig('JarvesBundle'), 'jarves');

        Object.each(jarves.settings.configs, function (ext, extCode) {
            if (extCode != 'JarvesBundle' && ext.entryPoints) {
                this.addEntryPointTree(ext, extCode);
            }
        }.bind(this));
    },

    getEntryPointTitle: function (pNode) {

        switch (pNode.type) {

            case 'iframe':
            case 'custom':
                return ('Window %s').replace('%s', pNode.type);

            case 'list':
            case 'edit':
            case 'add':
            case 'combine':
                return ('Framework window %s').replace('%s', pNode.type);

            case 'function':
                return t('Background function call');

            case 'store':
                return t('Type store');

            default:
                return t('Default entry point');
        }

    },

    getEntryPointIcon: function (pNode) {
        switch (pNode.type) {
            case 'list':
                return 'bundles/jarves/admin/images/icons/application_view_list.png';
            case 'edit':
                return 'bundles/jarves/admin/images/icons/application_form_edit.png';
            case 'add':
                return 'bundles/jarves/admin/images/icons/application_form_add.png';
            case 'combine':
                return 'bundles/jarves/admin/images/icons/application_side_list.png';
            case 'function':
                return 'bundles/jarves/admin/images/icons/script_code.png';
            case 'iframe':
            case 'custom':
                return 'bundles/jarves/admin/images/icons/application.png';
            case 'store':
                return 'bundles/jarves/admin/images/icons/database.png';
            default:
                return 'bundles/jarves/admin/images/icons/folder.png'
        }

    },

    addEntryPointTree: function (bundleConfig, bundleName) {
        var title = jarves.getBundleTitle(bundleName);

        if (bundleName !== 'jarves') {
            title += ' ('+bundleName+')';
        }

        bundleName = jarves.getShortBundleName(bundleName);

        var target = new Element('div', {
            style: 'padding-top: 5px; margin-top: 5px; border-top: 1px dashed silver;'
        }).inject(bundleName == 'jarves' ? this.entryPointListContainer : this.adminEntryPointDom.childContainer);

        var path = '/' + (bundleName === 'jarves' ? '' : bundleName);

        var a = new Element('a', { href: 'javascript:;', text: title, title: '#' +
            path, style: 'font-weight: bold;'}).inject(target);

        var childContainer = new Element('div',
            {'class': 'jarves-user-acl-tree-childcontainer', style: 'padding-left: 25px;'}).inject(a, 'after');

        if (bundleName == 'admin') {
            this.extContainer = childContainer;
        }

        a.entryPath = jarves.urlEncode(path);
        a.childContainer = childContainer;
        this.currentEntrypointDoms[a.entryPath] = a;
        this.loadEntryPointChildren(bundleConfig.entryPoints, '/' + bundleName, childContainer);

        return a;
    },

    loadEntryPointChildren: function (entryPoints, parentCode, childContainer) {
        Object.each(entryPoints, function (item, index) {
            if (item.acl == false) {
                return;
            }

            var code = (parentCode == '/' ? '/' : parentCode + '/') + index;
            var element = new Element('a', {
                href: 'javascript:;',
                text: item.label,
                title: this.getEntryPointTitle(item) + ', ' + code
            }).inject(childContainer);

            new Element('img', {
                src: _path + '' + this.getEntryPointIcon(item)
            }).inject(element, 'top');

            element.entryPath = jarves.urlEncode(code);
            this.currentEntrypointDoms[element.entryPath] = element;
            var newChildContainer = new Element('div',
                {'class': 'jarves-user-acl-tree-childcontainer', style: 'padding-left: 25px;'}).inject(childContainer);

            this.loadEntryPointChildren(item.children, code, newChildContainer);

        }.bind(this));
    },

    loadList: function () {

        var q = this.query.getValue();

        this.left.empty();

        new Element('div', {
            'class': 'jarves-List-loader',
            text: t('Loading ...')
        }).inject(this.left);

        var req = {};
        if (q) {
            req.q = q;
        }

        if (this.lastRq) {
            this.lastRq.cancel();
        }

        this.lastRq = new Request.JSON({url: _pathAdmin + 'user/acl/search', noCache: 1,
            onComplete: this.renderList.bind(this)
        }).get(req);

    },

    renderList: function (response) {
        var items = response.data;

        if (items && typeOf(items) == 'object') {

            this.left.empty();

            if (!items.users && !items.groups) {
                new Element('div', {
                    'class': 'jarves-List-info',
                    text: t('No users and groups.')
                }).inject(this.left);
            }

            if (typeOf(items.users) == 'array' && items.users.length > 0) {
                new Element('div', {
                    'class': 'jarves-List-split',
                    text: t('Users')
                }).inject(this.left);

                Array.each(items.users, function (item) {

                    var div = new Element('div', {
                        'class': 'jarves-List-item'
                    })
                        .addEvent('click', function(){
                            this.loadRules('user', item, false);
                        }.bind(this))
                        .inject(this.left);

                    this.userDivs[item.id] = div;

                    var h2 = new Element('h2', {
                        text: item.username
                    }).inject(div);

                    new Element('span', {
                        text: ' (' + item.ruleCount + ')',
                        'class': 'sub'
                    }).inject(h2);

                    var subline = new Element('div', {
                        'class': 'sub'
                    }).inject(div);

                    var name = [];
                    if (item.firstName) {
                        name.push(item.firstName);
                    }
                    if (item.lastName) {
                        name.push(item.lastName);
                    }

                    new Element('span', {
                        text: name.join(' ')
                    }).inject(subline);

                    if (item.email) {
                        new Element('span', {
                            text: ' (' + item.email + ')'
                        }).inject(subline);
                    }

                    var groups = [];
                    Array.each(item.groupMembership, function (group) {
                        groups.push(group.name);
                    });

                    var subline = new Element('div', {
                        'class': 'sub',
                        text: groups.join(', ')
                    }).inject(div);

                }.bind(this));
            }

            if (typeOf(items.groups) == 'array' && items.groups.length > 0) {
                new Element('div', {
                    'class': 'jarves-List-split',
                    text: t('Groups')
                }).inject(this.left);

                Array.each(items.groups, function (item) {

                    var div = new Element('div', {
                        'class': 'jarves-List-item'
                    })
                        .addEvent('click', function(){
                            this.loadRules('group', item, false);
                        }.bind(this))
                        .inject(this.left);

                    this.groupDivs[item.id] = div;

                    var h2 = new Element('h2', {
                        text: item.name
                    }).inject(div);

                    new Element('span', {
                        text: ' (' + item.ruleCount + ')',
                        'class': 'sub'
                    }).inject(h2);

                }.bind(this));
            }
        }
    },

    loadRules: function (pType, pItem, pForce) {
        if (!pForce && typeOf(this.currentTargetType) != 'null' && this.unsavedContent) {
            this.win.confirm(t('There is unsaved content. Continue?'), function (a) {
                if (a) {
                    this.loadRules(pType, pItem, true);
                }
            }.bind(this));
            return;
        }

        var div = pType == 'group' ? this.groupDivs[pItem.id] : this.userDivs[pItem.id];
        if (!div) {
            return;
        }

        this.left.getElements('.jarves-List-item').removeClass('active');
        div.addClass('active');

        var title;
        if (pType == 'user') {
            title = t('User %s').replace('%s', pItem['username']);
        }
        else {
            title = t('Group %s').replace('%s', pItem['name']);
        }

        this.win.setTitle(title);

        this.loadAcls(pType, pItem.id);
    },

    loadAcls: function (pType, pId) {
        if (this.lastOverlay) {
            this.lastOverlay.destroy();
        }

        this.hideRules();

        if (pId == 1) {
            this.tabs.hide();
            this.actions.hide();

            this.lastOverlay = new Element('div', {
                style: 'position: absolute; left: 0px; right: 0px; top: 0px; bottom: 0px; background-color: #bbb;',
                styles: {
                    opacity: 0.7,
                    paddingTop: 50,
                    textAlign: 'center'
                },
                text: t('User admin and the administration group have full access to anything.')
            }).inject(this.right);

            this.win.setLoading(false);
            return;
        }

        this.win.setLoading(true, null, {left: 216});

        if (this.lrAcls) {
            this.lrAcls.cancel();
        }

        this.currentTargetType = pType == 'user' ? 0 : 1;
        this.currentTargetRsn = pId;

        this.lrAcls = new Request.JSON({
            url: _pathAdmin + 'user/acl',
            noCache: true,
            onComplete: this.setAcls.bind(this)
        }).get({type: pType, id: pId});

    },

    hideRules: function () {
        this.objectConstraints.setStyle('display', 'none');
        this.objectRules.setStyle('display', 'none');

        this.entryPointList.getElements('a').removeClass('jarves-user-acl-entrypoint-rule-active');
        this.entryPointRuleContainer.empty();
    },

    showRules: function () {
        this.objectConstraints.setStyle('display', 'block');
        this.objectRules.setStyle('display', 'block');
    },

    updateEntryPointRules: function () {

        Object.each(this.currentEntrypointDoms, function (dom) {
            if (dom.ruleIcon) {
                dom.ruleIcon.destroy();
            }
            if (dom.ruleLine) {
                dom.ruleLine.destroy();
            }
            if (dom.ruleLineChildern) {
                dom.ruleLineChildern.destroy();
            }
            delete dom.rule;
        });

        Array.each(this.currentAcls, function (rule) {
            var objectName = jarves.normalizeObjectKey(rule.object);

            if (objectName != 'jarves/entryPoint') {
                return;
            }

            if (this.currentEntrypointDoms[rule.constraintCode]) {
                this.addEntryPointRuleToTree(rule);
            }

        }.bind(this));

    },

    clickEntryPointRule: function (domElement) {

        if (domElement.rule) {
            this.showEntrypointRule(domElement);
        } else {

            var rule = {
                object: 'jarves/entryPoint',
                constraintType: 1,
                sub: 1,
                prio: 0,
                constraintCode: domElement.entryPath,
                access: 1,
                targetType: this.currentTargetType,
                targetId: this.currentTargetRsn
            };
            this.currentEntrypointDoms[domElement.entryPath] = domElement;
            this.currentAcls.push(rule);
            this.addEntryPointRuleToTree(rule);

            this.clickEntryPointRule(domElement);
        }

    },

    showEntrypointRule: function (pDom) {

        this.entryPointRuleContainer.empty();

        var div = new Element('div', {
            'class': 'jarves-user-acl-entrypoint-rule'
        })
            .inject(this.entryPointRuleContainer);

        var title = new Element('div', {
            text: pDom.get('text'),
            style: 'line-height: 14px; font-weight: bold; padding: 2px;'
        }).inject(div);

        var fieldContainer = new Element('div').inject(div);

        var fields = {
            access: {
                label: t('Access'),
                'default': 1,
                type: 'checkbox'
            },

            sub: {
                type: 'checkbox',
                'default': 1,
                label: t('With sub-items')
            }
        };

        var kaFields = new jarves.FieldForm(fieldContainer, fields, {}, {win: this.win});

        var deleteRule = new jarves.Button([t('Delete rule'), '#icon-minus-5']).inject(fieldContainer);

        deleteRule.addEvent('click', this.deleteEntrypointRule.bind(this, pDom));

        kaFields.addEvent('change', function () {

            Array.each(this.currentAcls, function (acl, index) {
                var objectKey = jarves.normalizeObjectKey(acl.object);
                if (objectKey != 'jarves/entryPoint') {
                    return;
                }

                if (acl.constraintCode != pDom.entryPath) {
                    return;
                }

                this.currentAcls[index] = Object.merge(pDom.rule, kaFields.getValue());
                pDom.rule = this.currentAcls[index];
            }.bind(this));

            this.updateEntryPointRules();

        }.bind(this));

    },

    deleteEntrypointRule: function (pDom) {

        this.entryPointList.getElements('a').removeClass('jarves-user-acl-entrypoint-rule-active');
        this.entryPointRuleContainer.empty();

        var index = this.currentAcls.indexOf(pDom.rule);
        this.currentAcls.splice(index, 1);

        delete pDom.rule;

        this.updateEntryPointRules();

    },

    addEntryPointRuleToTree: function (rule) {

        var dom = this.currentEntrypointDoms[rule.constraintCode];

        if (dom.ruleIcon) {
            dom.ruleIcon.destroy();
        }
        if (dom.ruleLine) {
            dom.ruleLine.destroy();
        }
        if (dom.ruleLineChildern) {
            dom.ruleLineChildern.destroy();
        }

        var accessIcon = rule.access == 1 ? 'accept' : 'exclamation';
        var accessColor = rule.access == 1 ? 'green' : 'red';

        dom.rule = rule;

        dom.ruleIcon = new Element('img', {
            src: _path + 'bundles/jarves/admin/images/icons/' + accessIcon + '.png',
            style: 'position: absolute; left: -13px; top: 4px; width: 10px;'
        }).inject(dom);

        if (rule.sub == 1) {

            dom.ruleLine = new Element('div', {
                style: 'position: absolute; left: -9px; height: 4px; top: 14px; width: 1px; border-right: 1px solid ' +
                    accessColor
            }).inject(dom);

            var childContainer = dom.getNext();
            if (!childContainer) {
                return;
            }

            dom.ruleLineChildern = new Element('div', {
                style: 'position: absolute; left: -4px; bottom: 0px; top: 0px; width: 1px; border-right: 1px solid ' +
                    accessColor
            }).inject(childContainer);
        }

    },

    updateObjectRulesCounter: function () {
        var counter = {};

        Array.each(this.currentAcls, function (acl) {
            var objectName = jarves.normalizeObjectKey(acl.object);
            if (counter[objectName]) {
                counter[objectName]++;
            }
            else {
                counter[objectName] = 1;
            }
        }.bind(this));

        Object.each(this.objectDivs, function (dom, key) {
            if (!counter[key]) {
                counter[key] = 0;
            }
            dom.count.set('text', ' (' + counter[key] + ')');
        });

    },

    setAcls: function (pResponse) {
        if (!pResponse.data) {
            pResponse.data = [];
        }

        this.loadedAcls = this.currentAcls = Array.clone(pResponse.data);

        this.updateObjectRulesCounter();
        this.updateEntryPointRules();

        this.objectList.getElements('.jarves-List-item').removeClass('active');

        this.tabs.show();
        this.actions.show();
        this.win.setLoading(false);
        this.unsavedContent = false;
    },

    save: function () {
        if (this.lastSaveRq) {
            this.lastSaveRq.cancel();
        }

        this.btnSave.startLoading(t('Saving ...'));

        var req = {
            targetType: this.currentTargetType,
            targetId: this.currentTargetRsn,
            rules: this.currentAcls
        };

        this.lastSaveRq = new Request.JSON({url: _pathAdmin + 'user/acl',
            progressButton: this.btnSave,
            onFailure: function() {
                this.btnSave.failedLoading(t('Failed'));
            }.bind(this),
            onSuccess: function () {
                this.unsavedContent = false;
                this.btnSave.doneLoading(t('Saved'));
            }.bind(this)
        }).post(req);
    }

});