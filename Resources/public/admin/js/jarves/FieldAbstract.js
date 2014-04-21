jarves.FieldAbstractId = 1;
jarves.FieldAbstract = new Class({
    Extends: jarves.Base,
    Binds: ['fireChange'],

    /**
     * Here you can define some default options.
     *
     * @type {Object}
     */
    options: {

        /**
         * Can be a number, a number+'px' or number+'%'.
         *
         * @var {Mixed}
         */
        inputWidth: null,

        disabled: false
    },

    /**
     * The reference to the current (parent) jarves.Field instance.
     *
     * @type {jarves.Field}
     */
    fieldInstance: null,

    /**
     * The reference to the current jarves.Window instance.
     * Can be empty, if a script created a jarves.Field without container inside of a jarves.Window.
     * @type {jarves.Window}
     */
    win: null,

    /**
     * Constructor.
     *
     * @internal
     * @param  {Object} fieldInstance The instance of jarves.Field
     * @param  {Object} options
     */
    initialize: function (fieldInstance, options) {
        this.id = jarves.FieldAbstractId++;
        this.fieldInstance = fieldInstance;
        this.win = this.fieldInstance.win;
        options = options || {};
        this.setOptions(options);
        this.options = Object.merge(options, this.options); //keep on* keys available. setOptions will delete those
        this.createLayout(this.fieldInstance.fieldPanel);
    },

    getId: function() {
        return this.id;
    },

    /**
     *
     * @returns {jarves.Field}
     */
    getParentInstance: function() {
        return this.fieldInstance;
    },

    /**
     * @returns {jarves.Window}
     */
    getWin: function() {
        if (this.win) return this.win;
        if (this.getParentInstance()) this.getParentInstance().getWin();
    },

    /**
     * Use this method to create your field layout.
     * Please do not the constructor for this job.
     *
     * Inject your elements to this.fieldInstance.fieldPanel or use `container`.
     *
     * @param {Element} container Inject your element into this element.
     */
    createLayout: function (container) {
        /* Override it to your needs */
    },

    /**
     * This method is called, when the option 'disabled' is true and there this field
     * should act as a disabled one.
     *
     * @param {Boolean} disabled
     */
    setDisabled: function (disabled) {
        /* Override it to your needs */
    },

    /**
     *
     * @return {Boolean}
     */
    isDisabled: function() {
        /* Override it to your needs */
    },

    getContainer: function() {
        return this.fieldInstance.fieldPanel;
    },

    /**
     * Return the jarves.Field instance.
     *
     * @returns {jarves.Field}
     */
    getField: function() {
        return this.fieldInstance;
    },

    /**
     * Renders the UI with the new value.
     * Do not call this function in your code.
     *
     * @param {*} value
     * @param {Boolean} internal
     */
    setValue: function (value, internal) {
        /* Override it to your needs */
    },

//    /**
//     * Same as setValue but `values` is a object with all values used in jarves.FieldForm.
//     *
//     * @param {Object} values
//     * @param {boolean} internal
//     */
//    setValues: function(values, internal) {
//
//    },

    /**
     * Returns true if the content value has been changed.
     *
     * @return {Boolean}
     */
    isDirty: function() {
        this.getParentInstance().isDirty();
    },

    /**
     *
     * @param {Boolean} dirty
     */
    setDirty: function(dirty) {
        this.getParentInstance().setDirty(dirty);
    },

    /**
     *
     * @returns {Boolean}
     */
    getDirty: function() {
        return this.getParentInstance().getDirty();
    },

    /**
     * Returns the current value of this field.
     *
     * @return {*}
     */
    getValue: function () {
        /* Override it to your needs */
        return null;
    },

    /**
     * This is slightly different than `getValue`. In this save() method you
     * should save your data on the server or do whatever is needed
     * to have a valid `getValue()` return value.
     *
     * If this is not overwritten, we directly fire progressWatch.done(this.getValue()).
     *
     * Example: If you have a image field where the user can choose a image
     * then this image shouldn't be uploaded directly and also can be uploaded
     * in the getValue() method since getValue() requires a instant return value,
     * whereas save() can be asynchronous. So, for this image field example you
     * should save your image in this save() method only. Save the path in the current value
     * and call progressWatcher.done() if it's done or .cancel() or .error().
     * getValue() should then return your path value.
     *
     * If image hasn't been uploaded and we call already getValue() (which can happen
     * when we need a value of you to check if something has changed) you should
     * return nothing (if nothing is selected), the old path/value or if the user has selected
     * a new image (but is not saved through save() method), you should return the base64 (or anything else)
     * representation which you can be rendered again in setValue() (because we pass it eventually in setValue() then).
     *
     * @param {jarves.ProgressWatch} progressWatcher
     */
    save: function(progressWatcher) {
        progressWatcher.done(this.getValue());
    },

    /**
     * Returns the main element of this field.
     * This is not necessary.
     */
    toElement: function () {
        return this.main;
    },

    focus: function () {
        if (this.input && 'get' in this.input && -1 !== ['select', 'textarea', 'input'].indexOf(this.input.get('tag'))) {
            this.input.focus();
        }
    },

    /**
     * If a field is empty but required and the user wanna save,
     * then the frameworkWindows use this method to say the user 'hey it\'s required'.
     *
     * Take a look into the code, to get a idea behind.
     *
     */
    highlight: function () {

        //example of using highlight
        //this calls toElement() and highlight the background of it.
        if (this.toElement()) {
            document.id(this).highlight();
        }

        //or
        //document.id(this.input).highlight();
    },

    hide: function() {
        var el = this.toElement();
        if (!el) return;
        if ('none' === el.getStyle('display')) return;
        this.oldDisplay = el.getStyle('display') || el.getComputedStyle('display');
        el.setStyle('display', 'none');
    },

    isHidden: function() {
        var el = this.toElement();
        if (!el) return;
        return 'none' === el.getStyle('display');
    },

    show: function() {
        var el = this.toElement();
        if (!el) return;
        if ('none' !== el.getStyle('display') || !this.oldDisplay) return;
        el.setStyle('display', this.oldDisplay);
    },

    /**
     * Checks if the value the user entered(or not entered)
     * is a valid one. If it's not valid, then for example the
     * window framesworks won't continue the saving and fire this.highlight()
     * and this.showInvalid(true).
     *
     * @return {Boolean} false for not valid and anything else (also null) for valid.
     */
    isValid: function () {
        if (this.fieldInstance.options.required && this.getValue() === '') {
            return false;
        }

        if (this.fieldInstance.options.requiredRegex) {
            var rx = new RegExp(this.fieldInstance.options.requiredRegex);
            if (!rx.test(this.getValue().toString())) {
                return false;
            }
        }

        return true;
    },

    /**
     * Detects if the entered data is valid and shows a visual
     * symbol if not.
     *
     * This means:
     *  - if options.required==true and the user entered a value
     *  - if options.requiredRegex and the value passes the regex
     *
     * @return {Boolean} true if everything is ok
     */
    checkValid: function () {
        var status = this.isValid();
        if (status) {
            this.showValid();
        }
        else {
            this.showInvalid();
        }
        return status;
    },

    /**
     * If the entered data is no valid, this will be fired. (possible with each 'change' event)
     *
     * @param  {String} text text to display
     */
    showInvalid: function (text) {
        if (!((this.main || this.input) && (this.wrapper || this.input))) {
            return;
        }

        if (this.invalidIcon) {
            return;
        } //we're already displaying invalid stuff

        this.invalidIcon = new Element('div', {
            'class': 'jarves-field-invalid-icon icon-warning blink'
        }).inject(this.wrapper || this.input, 'after');

        var text = text || this.options.notValidText || t('The current value is invalid.');

        this.invalidText = new Element('div', {
            'class': 'jarves-field-invalid-text',
            text: text
        }).inject(this.main || this.input, 'after');

        if (this.input) {
            this.input.addClass('jarves-field-invalid');
        }

    },

    /**
     * If the entered data is valid, this will be fired. (possible with each 'change' event)
     *
     */
    showValid: function () {

        if (this.invalidIcon) {
            //we was invalid before, highlight a smooth green
            if (this.input) {
                this.input.highlight('green');
            }

            if (this.input) {
                this.input.removeClass('jarves-field-invalid');
            }

            //remove the invalid icon and text
            this.invalidIcon.destroy();
            this.invalidText.destroy();

            this.invalidIcon = null;
        }

    }

});