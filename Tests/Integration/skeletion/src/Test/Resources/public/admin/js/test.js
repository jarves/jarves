var test_test = new Class({

    initialize: function(pWin){
        this.win = pWin;

        var defaultFields = {
            text: {
                label: 'Text',
                type: 'text'
            },
            password: {
                label: 'Password',
                type: 'password'
            },
            checkbox: {
                label: 'Checkbox',
                type: 'checkbox'
            },
            textarea: {
                label: 'Textarea',
                type: 'textarea'
            },
            date: {
                label: 'Datetime',
                type: 'datetime'
            },
            number: {
                label: 'Number',
                type: 'number'
            },
            selectArray: {
                label: 'Select',
                type: 'select',
                items: ['A', 'B', 'C', 'D']
            },
            selectNumbered: {
                label: 'Select Numbered',
                type: 'select',
                items: {0: 'A', 1: 'B', 2: 'C', 3: 'D'}
            }
        };

        var defaultFieldsTable = {};
        Object.each(defaultFields, function(field, key){
            var clone = Object.clone(field);
            clone.tableItem = true;
            defaultFieldsTable[key] = clone;
        });

        var fields = {
            tab1: {
                type: 'tab',
                label: 'Tab 1',
                fullPage: true,
                children: {
                    group: {
                        label: 'Group 1',
                        type: 'group',
                        children: defaultFieldsTable
                    }
                }
            },
            tab2: {
                type: 'tab',
                label: 'Tab 2',
                fullPage: true,
                children: {
                    objectAll: {
                        label: 'Object All',
                        type: 'object'
                    },
                    objectFile: {
                        label: 'Object File',
                        type: 'object',
                        object: 'core:file'
                    },
                    objectFile2: {
                        label: 'Object File Combo',
                        type: 'object',
                        object: 'core:file',
                        options: {
                            combobox: true
                        }
                    },
                    objectFile3: {
                        label: 'Object File Multi',
                        type: 'object',
                        object: 'core:file',
                        options: {
                            multi: true
                        }
                    },
                    objectNode: {
                        label: 'Object Node',
                        type: 'object',
                        object: 'core:node'
                    }
                }
            },
            tab3: {
                type: 'tab',
                label: 'Tab 3',
                fullPage: true,
                children: {
                    treeNodeGroup: {
                        type: 'group',
                        label: 'Node Tree',
                        children: {
                            treeNode: {
                                type: 'tree',
                                object: 'core:node'
                            }
                        }
                    }
                }
            },
            tab4: {
                type: 'tab',
                label: 'Tab 4',
                fullPage: true,
                children: {
                    select: {
                        label: 'Select',
                        type: 'select',
                        items: ['First', 'Second', '...']
                    },
                    selectObject: {
                        label: 'Select Object',
                        type: 'select',
                        object: 'users:user'
                    },
                    layout: {
                        label: 'Layout',
                        type: 'layout'
                    },
                    array: {
                        label: 'Array',
                        type: 'array',
                        columns: [
                            {label: 'Title'},
                            {label: 'Yes?', width: 50}
                        ],
                        fields: {
                            text: {
                                type: 'text'
                            },
                            checkbox: {
                                type: 'checkbox'
                            }
                        }
                    },
                    codemirror: {
                        label: 'Codemirror',
                        type: 'codemirror'
                    },
                    condition: {
                        label: 'Condition',
                        type: 'condition'
                    }
                }
            }
        };

        var form = new jarves.FieldForm(
            pWin.getContentContainer(),
            fields,
            {

            }
        );

        var buttonGroup = this.win.addButtonGroup();
        var saveBtn = buttonGroup.addButton('Save', null, function(){

            var text = "";
            var value = form.getValue();

            Object.each(value, function(item, key){
                text += key+': '+JSON.encode(item)+"\n";
            });

            this.win.alert(text);

        }.bind(this));

        saveBtn.setButtonStyle('blue');

        return;


        var field1 = new jarves.Field({
            type: 'tree',
            objectKey: 'core:entrypoint'
        }, pWin.getContentContainer());

        return;

        var field1 = new jarves.Field({
            type: 'layout',
            label: t('Layout')
        }, pWin.getContentContainer());

        return;
        var form = new jarves.FieldForm(pWin.getContentContainer(), {
            'bla': {
                type: 'childrenSwitcher',
                label: 'switch',
                children: {
                    test: {
                        label: 'ficki',
                        type: 'text'
                    }
                }
            }
        });
        return;

        var button = new jarves.Button('test window').inject(pWin.getContentContainer());
        button.addEvent('click', function(){
            jarves.wm.open('admin/system/module/edit',{name: "Admin\\AdminBundle"});
        });

        return;

        var field2 = new jarves.Field({
            type: 'object',
            object: 'core:file',
            combobox: true
        }, pWin.getContentContainer());

        field2.setValue('#penis');

        var button = new jarves.Button('test').inject(field2, 'after');

        button.addEvent('click', function(){
            console.log(field2.getValue());
        });

        return;

        var field1 = new jarves.Field({
            type: 'view',
            directory: '@JarvesDemoThemeBundle',
            fullPath: true,
            label: t('View')
        }, pWin.getContentContainer());

        field1.setValue('@JarvesDemoThemeBundle/layout_default.tpl');

        return;

        new jarves.Button('Test').inject(pWin.getContentContainer());

        var tree;

        var id = new jarves.Field({
            type: 'text'
        }).inject(this.win.content);

        new jarves.Button('Deselect')
            .addEvent('click', function(){
                tree.getFieldObject().deselect();
            })
            .inject(this.win.content);

        new jarves.Button('Reload')
            .addEvent('click', function(){
                tree.getFieldObject().reloadBranch({id: id.getValue()});
            })
            .inject(this.win.content);

        new jarves.Button('Reload Parent')
            .addEvent('click', function(){
                tree.getFieldObject().reloadParentBranch({id: id.getValue()});
            })
            .inject(this.win.content);

        tree = new jarves.Field({
            label: t('Nodes'),
            type: 'tree',
            objectKey: 'Core\\Node'
        }, this.win.content);

        return;

        new jarves.Field({
            label: 'Node',
            type: 'object',
            object: 'Core\\Node'
        }, pWin.getContentContainer());

        new jarves.Field({
            label: 'PluginChooser',
            type: 'plugin'
        }, pWin.getContentContainer());

        return;
        new jarves.Select(this.win.content, {
            object: 'Core\\Domain'
        });

        new jarves.Select(this.win.content, {
            object: 'Core\\Language'
        });

        new jarves.FieldForm(this.win.content,{
            'defaultIcon': {
                label: t('Default icon'),
                type: 'file',
                combobox: true
            }
        });

        new jarves.Field({
            "label": "Sort direction",
            "items": {
                "desc": "[[Descending]]",
                "asc": "[[Ascending]]"
            },
            "type": "select"
        }, this.win.content);


        new jarves.Field({
            label: t('EntryPoint'),
            type: 'object',
            combobox: true,
            object: 'Core\\EntryPoint'
        }, this.win.content);

        new jarves.Field({
            label: t('Array'),
            type: 'array',
            columns: [null, '30%'],
            startWith: 1,
            fields: {
                title: {
                    label: 'Title',
                    type: 'text',
                    required: true
                },
                'visible': {
                    'label': 'Visible',
                    'type': 'checkbox',
                    'width': '100'
                }
            }
        }, this.win.content);


        var tree;


        new jarves.Button('Deselect')
            .addEvent('click', function(){
                tree.getFieldObject().deselect();
            })
            .inject(this.win.content);

        new jarves.Button('Reload 8')
            .addEvent('click', function(){
                tree.getFieldObject().reloadBranch({id: 8});
            })
            .inject(this.win.content);

        new jarves.Button('Reload parent 8')
            .addEvent('click', function(){
                tree.getFieldObject().reloadParentBranch({id: 8});
            })
            .inject(this.win.content);

        new jarves.Button('Reload 22')
            .addEvent('click', function(){
                tree.getFieldObject().reloadBranch({id: 22});
            })
            .inject(this.win.content);

        new jarves.Button('Reload parent 22')
            .addEvent('click', function(){
                tree.getFieldObject().reloadParentBranch({id: 22});
            })
            .inject(this.win.content);

        new jarves.Button('Reload Domain')
            .addEvent('click', function(){
                tree.getFieldObject().reloadBranch({id: 1}, 'Core\\Domain');
            })
            .inject(this.win.content);

        tree = new jarves.Field({
            label: t('Nodes'),
            type: 'tree',
            objectKey: 'Core\\Node'
        }, this.win.content);


        return;

        new jarves.Select(this.win.content, {
            items: [
                'Hosa', 'Mowla', 'Gazzo'
            ]
        });

        var s2 = new jarves.Select(this.win.content, {
            object: 'group'
        });

        s2.setValue(5);

        var s2 = new jarves.Select(this.win.content, {
            object: 'group',
            labelTemplate: '[{id}] {name}'
        });

        s2.setValue(5);

        var div = new Element('div', {
            style: 'padding-top: 15px;'
        }).inject(this.win.content);

        var field = {
            bla: {
                label: t('Icon path mapping'),
                type: 'array',
                asHash: true,
                columns: [
                    {label: t('Value'), width: '30%'},
                    {label: t('Icon path')}
                ],
                fields: {
                    value: {
                        type: 'text'
                    },
                    path: {
                        type: 'file',
                        combobox: true
                    }
                }
            }
        };

        var fieldObj = new jarves.FieldForm(div, field);

        fieldObj.setValue({
            bla: {peter: "10"}
        });

        var items = [];
        for (var i =0; i<100;i++)
            items.push('Mowla '+i);

        new jarves.Select(this.win.content, {
            items: items
        });

        new Element('input').inject(this.win.content);

        new jarves.TextboxList(this.win.content, {
            items: [
                'Hosa', 'Mowla', 'Gazzo'
            ]
        });

        var field = new jarves.Select(this.win.content, {
            object: 'domain'
        });

        var ch = new Element('div', {
            style: 'padding-top: 15px;'
        }).inject(this.win.content);

        field.addEvent('change', function(){
            ch.empty();
            logger( field.getValue());
            this.lastObjectTree = new jarves.Field({
                type: 'tree',
                object: 'node',
                scope: field.getValue()
            }, ch);
        });

        //field.fireEvent('change');

        var div = new Element('div', {
            style: 'padding-top: 15px;'
        }).inject(this.win.content);

//        this.lastObjectTree = new jarves.Field({
//            type: 'tree',
//            object: 'file'
//        }, div);

        var div = new Element('div', {
            style: 'padding-top: 15px;'
        }).inject(this.win.content);

        new jarves.Field({
            type: 'fieldTable',
            fieldWidth: '100%',
            asFrameworkColumn: true
        }, div);

    }

});