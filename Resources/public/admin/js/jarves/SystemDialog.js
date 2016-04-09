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

jarves.SystemDialog = new Class({

    Extends: jarves.Dialog,

    initialize: function(parent, options) {
        parent = jarves.getAdminInterface().getDialogContainer();
        this.closeExistingDialog();
        options.noBottom = true;
        options.withSmallCloseButton = true;
        this.parent(parent, options);
    },

    closeExistingDialog: function() {
        var lastDialog = jarves.getAdminInterface().getDialogContainer().getElement('.jarves-dialog-overlay');
        if (lastDialog && lastDialog.kaDialog) {
            lastDialog.kaDialog.hide();
        }
    },

    renderLayout: function () {
        this.parent();

        if (this.closerButton) {
            this.closerButton.addClass('jarves-SystemDialog-closer');
        }

        this.main.addClass('jarves-dialog-system');
    },

    /**
     * Position the dialog to the correct position.
     *
     * @param {Boolean} animated position the dialog out of the viewport and animate it into it.
     */
    center: function (animated) {
        if (!this.overlay.getParent()) {
            this.overlay.inject(this.container);
        }

        this.main.setStyles({
            left: -100,
            minWidth: null,
            top: 0,
            bottom: 0
        });

        this.showDialogContainer();

        setTimeout(function(){
            if (Modernizr.csstransforms && Modernizr.csstransitions) {
                var styles = {
                    opacity: 1
                };
                styles[Modernizr.prefixed('transform')] = 'translate(100px, 0px)';
                this.main.setStyles(styles);
            } else {
                this.main.morph({
                    'left': 0
                });
            }
        }.bind(this, 50));
    },

    getContainer: function() {
        return jarves.getAdminInterface().getDialogContainer()
    },

    doClose: function(animated) {
        if (this.options.destroyOnClose) {
            this.overlay.destroy();
        } else {
            this.overlay.dispose();
        }

        if (!this.getContainer().getChildren().length) {
            this.hideDialogContainer();
        }

        this.fireEvent('close');
    },

    showDialogContainer: function() {
        if (!this.getContainer().hasClass('jarves-main-dialog-container-visible')) {
            this.getContainer().addClass('jarves-main-dialog-container-visible');
        }
    },

    hideDialogContainer: function() {
        this.getContainer().removeClass('jarves-main-dialog-container-visible');
    }
});