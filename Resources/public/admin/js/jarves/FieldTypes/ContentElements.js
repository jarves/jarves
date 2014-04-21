jarves.FieldTypes.ContentElements = new Class({

    Extends: jarves.FieldAbstract,

    Statics: {
        asModel: true
    },

    options: {
        layout: '<div style="width: 80%; margin: auto;" class="jarves-slot"></div>'
    },
    /**
     * @var {jarves.Editor}
     */
    editor: null,

    createLayout: function() {
        this.main = new Element('div', {
            'html': this.options.layout
        }).inject(this.getParentInstance());

        this.editor = new jarves.Editor({

        }, this.main, this);
    },

    getContainerOffsetY: function() {
        return -document.id(this.getWin()).getPosition().y;
    },

    getOptionsContainer: function() {
        return null;
    },

    getValue: function() {
        return this.editor.getValue();
    },

    /**
     *
     * @param {jarves.ProgressWatch} progressWatch
     */
    save: function(progressWatch) {
        var progressWatchManager = new jarves.ProgressWatchManager({
            onAllSuccess: function() {
                console.log('contentElements allSuccess');
                progressWatch.done();
            }.bind(this),
            onError: function(progressWatch) {
                progressWatch.error();
            },
            onAllProgress: function(progress) {
                progressWatch.setProgress(progress);
            }.bind(this)
        });

        this.editor.save(progressWatchManager);
    },

    setValue: function(value) {
        this.editor.setValue(value);
    }
});