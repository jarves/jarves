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

jarves.FieldTypes.Wysiwyg = new Class({

    Extends: jarves.FieldAbstract,

    Statics: {
        asModel: true,
        options: {
            config: {
                label: 'Config',
                type: 'select',
                items: ['standard', 'full']
            }
        }
    },

    value: '',

    options: {
        config: 'standard',

        configs: {
            small: {
                plugins: [
                    "advlist autolink lists link image charmap print preview anchor",
                    "searchreplace visualblocks code fullscreen",
                    "insertdatetime media table contextmenu paste",
                    "autoresize"
                ],
                menubar: false,
                toolbar: "insertfile undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image | code"
            },
            standard: {
                plugins: [
                    "advlist autolink lists link image charmap print preview anchor",
                    "searchreplace visualblocks code fullscreen",
                    "insertdatetime media table contextmenu paste",
                    "autoresize"
                ],
                toolbar: "insertfile undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image | code"
            },
            full: {
                plugins: [
                    "advlist autolink lists link image charmap print preview hr anchor",
                    "searchreplace wordcount visualblocks visualchars code fullscreen",
                    "insertdatetime media nonbreaking save table contextmenu directionality",
                    "emoticons template paste textcolor",
                    "autoresize"
                ],
                toolbar1: "insertfile undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image",
                toolbar2: "print preview media | forecolor backcolor emoticons",
                tools: "inserttable"
            }
        },

        extraConfig: {}
    },

    createLayout: function () {
        this.main = new Element('div', {
            contentEditable: "true",
            'class': 'selectable jarves-field-wysiwyg'
        }).inject(this.fieldInstance.fieldPanel);

        var config = this.options.configs[this.options.config];

        if (!config) {
            console.error('Config not found for '.this.options.config);
        }

        config = Object.merge(config, this.options.extraConfig);

        tinymce.init(Object.merge({
            mode: 'exact',
            elements: [this.main],
//            content_document: this.main.getDocument(),
//            content_window: this.main.getWindow(),
            setup: function (editor) {
                editor.on('init', function(evt) {
                    this.editor = editor;
                    this.ready = true;
                    if (this.value) {
                        editor.setContent(this.value);
                    }
                    editor.on('change', function (ed) {
                        this.checkChange();
                    }.bind(this));
                }.bind(this));
            }.bind(this)
        }, config));

        this.main.addEvent('keyup', function (ed) {
            this.checkChange();
        }.bind(this));
    },

    checkChange: function () {
        if (this.ready) {
            if (this.oldData != this.getValue()) {
                this.fieldInstance.fireChange();
                this.oldData = this.getValue();
            }
        }
    },

    toElement: function () {
        //we can not return this.main as it is invisible made by the tinymce. actual div is something else.
        return this.fieldInstance.fieldPanel;
    },

    setValue: function (pValue) {
        this.value = pValue || '';
        this.oldData = this.value;
        if (this.ready) {
            this.editor.setContent(this.value);
        }
    },

    getValue: function () {
        if (!this.ready) {
            return this.value;
        } else {
            return this.editor.getContent();
        }
    }

});
