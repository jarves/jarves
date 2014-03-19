/**
 *
 * @event progress(Number progress)
 * @event start
 * @event done
 * @event cancel
 * @event error
 *
 * @event rename(String newName)
 * @event ready(Object response)
 *
 * @type {Class}
 */
jarves.FileUploadWatcher = new Class({
    Implements: [Options, Events],

    progress: 0,

    done: false,

    file: null,

    initialize: function(file, options) {
        this.file = file;
        this.setOptions(options);
    },

    /**
     *
     * @returns {Object}
     */
    getFile: function() {
        return this.file;
    },

    /**
     * @returns {Number}
     */
    getProgress: function() {
        return this.progress;
    },

    /**
     *
     * @returns {Boolean}
     */
    getDone: function() {
        return this.done;
    },

    /**
     * @param {Number} progress
     * @param {Boolean} internal if we fire the event or not.
     */
    setProgress: function(progress, internal) {
        this.progress = parseInt(progress);
        if (internal) {
            this.fireEvent('progress', this.progress);
        }
    },

    /**
     * @param {Boolean} done
     */
    setDone: function(done, internal) {
        this.done = !!done;
        if (done && internal) {
            this.fireEvent('done');
        }
    },

    /**
     * Cancels the upload.
     */
    cancel: function() {
        this.fireEvent('cancel');
    },

    /**
     *
     * @returns {String}
     */
    getRenamedName: function() {
        return this.renamedName
    },

    /**
     * Fires the 'rename' event and sets `renamedName`.
     * @param {String} name
     */
    rename: function(name) {
        this.renamedName = name;
        this.fireEvent('rename', name);
    },

    /**
     * Fires the `ready` event;
     *
     * @param {Object} response
     */
    ready: function(response) {
        this.fireEvent('ready', response);
    }
});