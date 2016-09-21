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

jarves.FieldTypes.Dialog = new Class({
    Extends: jarves.FieldAbstract,

    Statics: {
        options: {
            buttonLabel: {
                type: 'text',
                label: 'Button label'
            },
            minWidth: {
                lable: 'Min width',
                description: 'px, numbers or % values.',
                type: 'text'
            },
            minHeight: {
                lable: 'Min height',
                description: 'px, numbers or % values.',
                type: 'text'
            }
        }
    },

    options: {
        buttonLabel: ''
    },

    createLayout: function (container) {
        //deactivate auto-hiding of the childrenContainer.
        this.fieldInstance.handleChildsMySelf = true;

        this.button = new jarves.Button(this.options.buttonLabel || this.options.label).inject(container);

        var copy = this.fieldInstance.prepareChildContainer;

        this.fieldInstance.prepareChildContainer = function() {
            this.childContainer = this.fieldInstance.childContainer = new Element('div', {
                'class': 'jarves-field-childrenContainer',
                style: 'display: none'
            }).inject(container);
        }.bind(this);

        this.button.addEvent('click', this.openDialog.bind(this));
    },

    toElement: function() {
        return this.button.toElement();
    },

    openDialog: function() {
        this.dialog = new jarves.Dialog(this.getWin(), Object.merge(this.options, {
            withButtons: true,
            cancelButton: false,
            applyButtonLabel: t('OK')
        }));

        if (this.childContainer) {
            this.childContainer.inject(this.dialog.getContentContainer());
            this.childContainer.setStyle('display');

            this.dialog.addEvent('closed', function(){
                this.childContainer.setStyle('display', 'none');
                this.childContainer.inject(document.id(this), 'after');
            }.bind(this));
        }

        this.dialog.center(true);
    }
});