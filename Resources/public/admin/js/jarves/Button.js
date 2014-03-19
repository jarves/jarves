jarves.Button = new Class({

    $eventsBackuper: null,

    /**
     * @constructor
     * @param {String|Array} pTitle A string or a array. With the array you can define a icon: ['title', '#icon-add']
     * @param {String}       pOnClick
     * @param {String}       pTooltip
     */
    initialize: function(pTitle, pOnClick, pTooltip) {
        this.main = new Element('a', {
            'class': 'jarves-Button',
            href: 'javascript:void(0)',
            title: (pTooltip) ? pTooltip : null
        });

        this.mainLabel = new Element('span').inject(this.main);

        this.main.kaButton = this;

        this.setText(pTitle);

        if (pOnClick) {
            this.main.addEvent('click', pOnClick);
        }
    },

    setText: function(pText) {
        if (this.lastIconClass) {
            this.main.removeClass(this.lastIconClass);
            delete this.lastIconClass;
        }

        if (typeOf(pText) == 'element' && pText.inject) {
            pText.inject(this.mainLabel);
        } else if (typeOf(pText) == 'array') {
            this.mainLabel.empty();
            this.main.set('title', pText[0]);
            this.mainLabel.set('text', pText[0]);

            if (typeOf(pText[1]) == 'string') {
                if (pText[0] !== '') {
                    this.main.addClass('jarves-Button-textAndIcon');
                }

                if (pText[1].substr(0, 1) == '#') {
                    this.lastIconClass = pText[1].substr(1);
                    this.main.addClass(pText[1].substr(1));
                } else {
                    new Element('img', {
                        src: jarves.mediaPath(pText[1])
                    }).inject(this.mainLabel, 'top');
                }
            }
        } else {
            this.mainLabel.set('text', pText);
        }
    },

    getText: function() {
        return this.mainLabel.get('text');
    },

    setButtonStyle: function(pStyle) {
        if (this.oldButtonStyle) {
            this.main.removeClass('jarves-Button-' + this.oldButtonStyle);
        }

        this.main.addClass('jarves-Button-' + pStyle);
        this.oldButtonStyle = pStyle;
        return this;
    },

    setEnabled: function(pEnabled) {
        if (this.enabled === pEnabled) {
            return;
        }

        this.enabled = pEnabled;

        if (this.enabled) {

            //add back all events
            if (this.$eventsBackuper) {
                this.main.cloneEvents(this.$eventsBackuper);
            }

            this.main.removeClass('jarves-Button-deactivate');
            delete this.$eventsBackuper;

        } else {

            this.$eventsBackuper = new Element('span');
            //backup all events and remove'm.
            this.$eventsBackuper.cloneEvents(this.main);
            this.main.removeEvents();

            this.main.addClass('jarves-Button-deactivate');
        }
    },

    toElement: function() {
        return this.main;
    },

    inject: function(pTarget, pWhere) {
        this.main.inject(pTarget, pWhere);
        return this;
    },

    addEvent: function(pType, pFn) {
        (this.$eventsBackuper || this.main).addEvent(pType, pFn);
        return this;
    },

    fireEvent: function(pType, pParams) {
        (this.$eventsBackuper || this.main).fireEvent(pType, pParams);
    },

    focus: function() {
        this.main.focus();
    },

    startTip: function(pText) {
        if (!this.toolTip) {
            this.toolTip = new jarves.Tooltip(this.main, pText);
        }

        this.toolTip.setText(pText);
        this.toolTip.show();
    },

    startLoading: function(text) {
        if (this.main.hasClass('jarves-Button-loading')) {
            this.stopLoading(null, null, true);
        }
        this.mainLabel.dispose();

        this.loadingLabel = new Element('span', {
            text: text
        }).inject(this.main);

        if (this.lastIconClass) {
            this.main.removeClass(this.lastIconClass);
        }

        this.main.addClass('jarves-Button-loading');
    },

    setProgress: function(value) {
        if (false === value) {
            if (this.progress) this.progress.destroy();
            return;
        }

        if (!this.progress) {
            this.progress = new Element('div', {
                'class': 'jarves-Button-progress',
                styles: {
                    opacity: 0.7
                }
            }).inject(this.main, 'top');
        }

        this.progress.setStyle('width', value+'%');
    },

    stopLoading: function(text, highlightClass, noTextDisplay) {
        highlightClass = highlightClass || 'done';
        if (this.hideOldTextDelay) clearTimeout(this.hideOldTextDelay);
        this.main.removeClass('jarves-Button-loading');

        var displayOldText = function(){
            this.loadingLabel.destroy();
            this.mainLabel.inject(this.main);
            if (this.lastIconClass) {
                this.main.addClass(this.lastIconClass);
            }
            if (text) {
                this.main.removeClass('jarves-Button-stopLoading-' + highlightClass);
            }
        }.bind(this);

        if (this.progress) {
            this.progress.destroy();
        }

        if (text && !noTextDisplay) {
            this.loadingLabel.set('text', text);
            this.main.addClass('jarves-Button-stopLoading-' + highlightClass);
            this.hideOldTextDelay = displayOldText.delay(2000);
        } else {
            displayOldText();
        }
    },

    highlight: function(text, highlightClass) {
        highlightClass = highlightClass || 'done';
        this.mainLabel.dispose();

        this.highlightLabel = new Element('span', {
            text: text
        }).inject(this.main);

        var displayOldText = function(){
            this.highlightLabel.destroy();
            this.mainLabel.inject(this.main);
            this.main.removeClass('jarves-Button-stopLoading-' + highlightClass);
        }.bind(this);

        this.highlightLabel.set('text', text);
        this.main.addClass('jarves-Button-stopLoading-' + highlightClass);
        this.hideOldTextDelay = displayOldText.delay(1000);
    },

    doneLoading: function(text){
        if (!text) text = t('Done');
        this.stopLoading(text, 'done');
    },

    failedLoading: function(text){
        if (!text) text = t('Failed');
        this.stopLoading(text, 'failed');
    },

    /**
     * @param {String} pText
     * @param {Integer} pDelay Default is 300
     */
    startLaggedTip: function(pText, pDelay) {
        if (!this.toolTip) {
            this.toolTip = new jarves.Tooltip(this.main, pText);
        }

        this.toolTip.setText(pText);
        this.laggedTip = (function() {
            this.toolTip.show();
        }).delay(pDelay ? pDelay : 300, this);
    },

    stopTip: function(pText) {
        if (this.laggedTip) {
            clearTimeout(this.laggedTip);
        }

        if (this.toolTip) {
            this.toolTip.stop(pText);
        }
    },

    show: function() {
        this.main.setStyle('display');
    },

    hide: function() {
        this.main.setStyle('display', 'none');
    },

    isHidden: function() {
        return this.main.getStyle('display') == 'none';
    },

    setVisible: function(visible) {
        visible ? this.show() : this.hide();
    },

    activate: function() {
        this.setEnabled(true);
    },

    deactivate: function() {
        this.setEnabled(false);
    },

    setPressed: function(pressed) {
        if (pressed) {
            this.main.addClass('jarves-Button-pressed');
        } else {
            this.main.removeClass('jarves-Button-pressed');
        }
    },

    isPressed: function() {
        return this.main.hasClass('jarves-Button-pressed');
    }
});