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

jarves.ContentTypes = jarves.ContentTypes || {};

jarves.ContentTypes.Text = new Class({
    Extends: jarves.ContentAbstract,

    Statics: {
        icon: 'icon-font',
        label: 'Rich Text'
    },

    editor: null,

    options: {
        /**
         * Sets the height of the editor to a fix value. Default is auto.
         *
         * @var {String}
         */
        inputHeight: null,

        /**
         * Sets the width of the editor to a fix value. Default is auto.
         *
         * @var {String}
         */
        inputWidth: null,

        config: 'standard',

        configs: {
            standard: {
                plugins: [
                    "advlist autolink autosave link image lists charmap print preview hr anchor pagebreak spellchecker", "searchreplace wordcount visualblocks visualchars code fullscreen insertdatetime media nonbreaking", "table contextmenu directionality emoticons template textcolor paste fullpage textcolor"
                ],
                menubar: false,
                toolbar_items_size: 'small',
                toolbar1: "formatselect | undo redo | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | styleselect fontselect fontsizeselect",
                toolbar2: "searchreplace | bullist numlist | outdent indent blockquote | link unlink anchor image media code | forecolor backcolor",
                toolbar3: "table | hr removeformat | subscript superscript | charmap emoticons | ltr rtl | visualchars visualblocks nonbreaking template pagebreak"
            },
            full: {
                plugins: [
                    "advlist autolink lists link image charmap print preview hr anchor pagebreak", "searchreplace wordcount visualblocks visualchars code fullscreen", "insertdatetime media nonbreaking save table contextmenu directionality", "emoticons template paste textcolor"
                ],
                toolbar1: "insertfile undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image",
                toolbar2: "print preview media | forecolor backcolor emoticons",
                tools: "inserttable"
            }
        }
    },

    isPreviewPossible: function() {
        return false;
    },

    focus: function() {
        this.main.focus();
    },

    createLayout: function() {
        this.main = new Element('div', {
            contentEditable: true,
            html: '<p><br/></p>',
            'class': 'jarves-content-text selectable'
        }).inject(this.getContentInstance().getContentContainer());

        this.main.addEvent('focus', function(e) {
            this.getEditor().click(e, this.main.getParent('.jarves-content'));
        }.bind(this));

        var id = (Math.random() * 10 * (Math.random() * 10)).toString(36).slice(2).replace('.', '');


        var config = this.options.configs[this.options.config];

        if (this.getContentFieldInstance().getOptionsContainer()) {
            this.toolbar = new Element('div', {
                'id': id
            }).inject(document.body);
            config.fixed_toolbar_container = '#' + id;
        }

        tinymce.init(Object.merge({
            mode: 'exact',
            inline: true,
            elements: [this.main],
            content_document: this.main.getDocument(),
            content_window: this.main.getWindow(),
            setup: function(editor) {
                this.editor = editor;
                this.ready = true;
                if (this.value) {
                    this.setValue(this.value);
                }
                editor.on('change', function(ed) {
                    this.checkChange();
                }.bind(this));
            }.bind(this)
        }, config));

        this.main.addEvent('keyup', function(ed) {
            this.checkChange();
        }.bind(this));
    },

    checkChange: function() {
        if (this.ready) {
            if (this.oldData != this.getValue()) {
                this.fireChange();
                this.oldData = this.getValue();
            }
        }
    },

    setValue: function(value) {
        if (value) {
            value = value.replace(/ data-mce-bogus="1"/g, '');
        }
        this.value = value;
        this.oldData = this.value;

        this.main.set('html', this.value || '<p><br/></p>');
    },

    getValue: function() {
        var value = this.main.get('html');

        value = value.replace(/ data-mce-bogus="1"/g, '');

        return value;
    },

    deselected: function() {
        if (this.toolbar) {
            this.toolbar.dispose();
            this.mainToolbarContainer.dispose();
        }

        delete this.isSelected;
    },

    destroy: function() {
        tinymce.remove(this.main);

        if (this.toolbar) {
            if (this.toolbar)
                this.toolbar.destroy();

            if (this.mainToolbarContainer)
                this.mainToolbarContainer.destroy();
        }

        this.main.destroy(this.main);
    },

    selected: function() {
        this.isSelected = true;

        if (!this.getContentFieldInstance().getOptionsContainer()) {
            return;
        }

        if (!this.mainToolbarContainer) {
            this.mainToolbarContainer = new Element('div', {
                'class': 'jarves_wysiwyg_toolbar jarves-content-text-wysiwyg-toolbar',
                style: 'float: left;'
            })
        }

        this.mainToolbarContainer.inject(this.getContentFieldInstance().getOptionsContainer(), 'top');

        this.toolbar.inject(this.mainToolbarContainer);
    }
});

