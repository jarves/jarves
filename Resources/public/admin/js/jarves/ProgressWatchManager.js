/**
 *
 * @event done(jarves.ProgressWatch progressWatch)
 * @event progress(jarves.ProgressWatch progressWatch)
 * @event cancel(jarves.ProgressWatch progressWatch)
 *
 * @event allDone(value, this)
 * @event allProgress(Number progress, this)
 *
 * @type {Class}
 */
jarves.ProgressWatchManager = new Class({
    Extends: jarves.ProgressWatch,

    progressWatch: [],
    allProgressDone: false,

    /**
     *
     * @param {Object} options
     * @param {*}      context
     */
    initialize: function(options, context) {
        this.parent(options, context);

        this.addEvent('done', this.updateDone.bind(this));
        this.addEvent('cancel', this.updateDone.bind(this));
        this.addEvent('error', this.updateDone.bind(this));
        this.addEvent('progress', this.updateProgress.bind(this));
    },

    updateProgress: function() {
        var progressValue = 0;
        var progressMax = 0;

        Array.each(this.progressWatch, function(progress) {
            progressMax += progress.getProgressRange();
            progressValue += progress.isFinished() ? progress.getProgressRange() : progress.getProgress();
        }.bind(this));

        progressValue = progressValue * 100 / progressMax;
        if (this.currentProgress !== progressValue) {
            this.allProgress(progressValue);
        }
    },

    updateDone: function() {
        this.updateProgress();

        var allDone = true;
        var allSuccess = true;
        Array.each(this.progressWatch, function(progress) {
            if (!progress.isDone() && !progress.isCanceled()) {
                allDone = false;
            }
            if (progress.isErrored()) {
                allSuccess = false;
            }
        }.bind(this));

        if (this.allProgressDone !== allDone) {
            this.allProgressDone = allDone;
            this.allDone();
        }

        if (allDone && !this.allSuccessFired && allSuccess) {
            this.allSuccessFired = true;
            this.allSuccess();
        }
    },

    allProgress: function(progress) {
        this.currentProgress = progress;
        this.fireEvent('allProgress', [this.currentProgress, this]);
    },

    /**
     * Fires the 'allDone' event with the given value.
     * @param {*} value
     */
    allDone: function(value) {
        this.state = true;
        this.value = value;
        this.fireEvent('allDone', [this.value, this]);
    },

    /**
     * @param {jarves.ProgressWatch} progressWatch
     */
    done: function(progressWatch) {
        this.fireEvent('done', progressWatch);
    },

    allSuccess: function() {
        this.allDone();
        this.fireEvent('allSuccess');
    },

    /**
     * @returns {Boolean}
     */
    isAllDone: function() {
        return this.allProgressDone;
    },

    /**
     * @param {jarves.ProgressWatch} progressWatch
     */
    progress: function(progressWatch) {
        this.fireEvent('progress', progressWatch);
    },

    /**
     * Creates a new jarves.ProgressWatch instance and attaches all
     * events to this manager.
     *
     * @param {Object} options
     * @param {*} context
     *
     * @returns {jarves.ProgressWatch}
     */
    newProgressWatch: function(options, context) {
        var progress = new jarves.ProgressWatch(options, context);

        progress.addEvent('done', function() {
            this.fireEvent('done', progress);
        }.bind(this));

        progress.addEvent('cancel', function() {
            this.fireEvent('cancel', progress);
        }.bind(this));

        progress.addEvent('error', function() {
            this.fireEvent('error', progress);
        }.bind(this));

        progress.addEvent('progress', function() {
            this.fireEvent('progress', progress);
        }.bind(this));

        this.progressWatch.push(progress);
        return progress;
    },

    /**
     * @param {jarves.ProgressWatch} progressWatch
     */
    addProgressWatch: function(progressWatch) {
        this.progressWatch.push(progressWatch);
    },

    getAllProgressWatch: function() {
        return this.progressWatch;
    }
});