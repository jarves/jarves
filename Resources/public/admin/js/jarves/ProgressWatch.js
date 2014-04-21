/**
 *
 * @event done(jarves.ProgressWatch progressWatch)
 * @event progress(jarves.ProgressWatch progressWatch)
 * @event cancel(jarves.ProgressWatch progressWatch)
 *
 * @type {Class}
 */
jarves.ProgressWatch = new Class({
    Implements: [Options, Events],

    state: false,
    currentProgress: 0,
    progressRange: 1,
    canceled: false,
    errored: false,
    context: null,

    value: null,

    options: {

    },

    /**
     *
     * @param {Object} options
     * @param {*}      context
     */
    initialize: function(options, context) {
        this.context = context;
        this.setOptions(options);
    },

    /**
     *
     * @returns {*}
     */
    getContext: function() {
        return this.context;
    },

    /**
     *
     * @param {*} context
     */
    setContext: function(context) {
        this.context = context;
    },

    /**
     *
     * @returns {boolean}
     */
    getDone: function() {
        return this.state;
    },

    /**
     * Fires the 'done' event with the given value.
     * @param {*} value
     */
    done: function(value) {
        this.value = value;
        this.fireEvent('preDone', this);
        this.state = true;
        this.currentProgress = this.progressRange;
        this.fireEvent('done', this);
    },

    /**
     * Cancels the progress.
     */
    cancel: function() {
        this.canceled = true;
        this.fireEvent('cancel');
    },

    /**
     * Cancels the progress.
     */
    error: function() {
        this.state = true;
        this.errored = true;
        this.fireEvent('error');
    },

    /**
     *
     * @param {Number} progress
     */
    progress: function(progress) {
        this.currentProgress = progress;
        this.fireEvent('progress', this);
    },

    /**
     *
     * @returns {Number}
     */
    getProgressRange: function() {
        return this.progressRange;
    },

    /**
     * The higher the range the more 'space' you get in the progressbar of ProgressWatchManager.
     * Default is 1.
     *
     * @param {Number} range
     */
    setProgressRange: function(range) {
        this.progressRange = range;
    },

    /**
     * @param {boolean} done
     * @param {boolean} internal
     */
    setDone: function(done, internal) {
        this.state = !!done;
        //this.currentProgress = this.progressRange;
        if (done && internal) {
            this.fireEvent('done', this);
        }
    },

    /**
     * @returns {*}
     */
    getValue: function() {
        return this.value;
    },

    /**
     * @param {*} value
     */
    setValue: function(value) {
        this.value = value;
    },

    /**
     * @param {Number} progress
     * @param {boolean} internal if we fire the event or not.
     */
    setProgress: function(progress, internal) {
        this.currentProgress = progress;
        if (internal) {
            this.fireEvent('progress', this);
        }
    },

    /**
     * @returns {Number}
     */
    getProgress: function() {
        return this.currentProgress;
    },

    /**
     * Returns true if isDone, isCanceled or isErrored returns true.
     * @returns {boolean}
     */
    isFinished: function() {
        return this.isDone() || this.isCanceled() || this.isErrored();
    },

    /**
     * @returns {boolean}
     */
    isCanceled: function() {
        return true === this.canceled;
    },

    /**
     * @returns {boolean}
     */
    isErrored: function() {
        return true === this.errored;
    },

    /**
     * @returns {boolean}
     */
    isDone: function() {
        return true === this.state;
    }
});